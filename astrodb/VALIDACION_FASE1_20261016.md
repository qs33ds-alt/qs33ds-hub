# Validación de AstroDB fase 1

Base inspeccionada: `618ae252b282062ef10a38d4424566b914d3222d`.
Rama: `fix/astrodb-natalcore-timezone-20261016`.

## Corrección y pruebas ejecutadas

Se conserva la velocidad Swiss desconocida al normalizar arrays: `null` y cadena vacía ya no se convierten en velocidad cero ni movimiento directo. Una longitud ausente en arrays se rechaza en lugar de convertirse en cero grados de Aries.

Comando ejecutado: `node --test astrodb/tests/*.test.cjs`.
Resultado: tres pruebas de ejecución y las 14 comprobaciones estáticas pasan. Las pruebas cubren los formatos de velocidad ausente, velocidad negativa, cero y positiva, rechazo de longitud ausente y paquetes con nombres iguales e identidad NatalCore cruzada.

## Inspección de Supabase sin modificar datos

Consulta a `pg_indexes`: solo existen la clave primaria de `id` y los índices no únicos de `user_id` y `name`. No existe protección única para usuario y `input_data.id`. Una consulta agregada de grupos duplicados por esos campos devuelve cero grupos. No se han leído ni exportado cartas personales ni cambiado el esquema.

La búsqueda seguida de insert/update sigue pendiente de una solución transaccional con clave estable. Los tests locales no validan escrituras autenticadas ni concurrencia real.

## Bloqueos de validación

Playwright está disponible, pero Chromium no está instalado. El intento de instalación devolvió un archivo inválido al descargar Chrome for Testing. No se ha podido ejecutar el navegador ni inspeccionar capturas; no se acredita validación visual.

Drive sigue siendo exportación manual. No se ha implementado OAuth ni ejecutado una subida desde AstroDB. La autorización del conector no sustituye OAuth de esta aplicación. Sigue pendiente configurar un cliente OAuth web y verificar selección de carpeta con permisos mínimos antes de implementar y probar escrituras.

## Siguiente trabajo

Resolver la clave única tras revisar esquema y compatibilidad de registros antiguos, probar aislamiento y guardados concurrentes; implementar OAuth y guardado independiente de Drive; ejecutar pruebas de exportación y visuales en escritorio y móvil con navegador disponible. Mantener PR en borrador, sin fusionar ni publicar.

## Segunda intervención

Base remota: `183fb3667cc1cd67499a441b7bc920892fd6df2b`.

Se corrigen las conversiones de UUID a número en el selector y la comparativa; cargar una ficha acepta IDs antiguos numéricos y nuevos de texto, conservando el tipo original. Al abrir se conservan coordenadas cero.

La recuperación local deduplica por ID, no por datos personales. Dos fichas con IDs diferentes y datos personales idénticos permanecen separadas. Los registros antiguos sin ID reciben uno estable por origen y posición. Esto no intenta resolver fichas históricas que ya se hubieran perdido antes de esta intervención.

Las escrituras de una misma ficha y usuario se ejecutan en orden dentro de la página. Cada trabajo copia su entrada antes de esperar; un fallo no bloquea los siguientes y otras fichas pueden avanzar independientemente. Se captura el usuario y cliente para la consulta y se cancela la escritura si cambia la cuenta antes de completar la búsqueda. Cambiar de ficha invalida las confirmaciones visuales pendientes. Se elimina un serializador remoto sin llamadas que consultaba el editor en vivo.

Resultado de `node --test astrodb/tests/*.test.cjs`: 11 pruebas de ejecución/sintaxis y 14 comprobaciones estáticas pasan. Los dobles de Supabase comprueban orden, recuperación tras fallo y cancelación por cambio de cuenta. No equivalen a una escritura autenticada real.

Auditoría agregada: 5 registros existentes, ninguno sin ID en `input_data.id` o `input_data.astrodb_local_id`; RLS activo; políticas SELECT/INSERT/UPDATE/DELETE restringidas al usuario propietario y UPDATE con USING y WITH CHECK. Ningún dato ni esquema remoto fue modificado.

La cola solo protege una instancia de la página. Sigue pendiente una clave única por usuario/ficha y guardado atómico para concurrencia entre pestañas y dispositivos. Plan: revisar compatibilidad de los dos campos históricos de ID, añadir una columna derivada estable con restricción única, detenerse ante ambigüedades sin borrar filas y adoptar upsert con esa restricción. No se ha desplegado ese cambio.

Se intentó obtener Chromium Headless Shell como alternativa al navegador completo; la descarga también devolvió un archivo inválido. Las pruebas visuales siguen bloqueadas. No se ha implementado OAuth ni probado subida real a Drive; permanece exportación manual. Sin fusión ni publicación.

## Tercera intervención de integración

Se implementa `drive-sync.js` con OAuth de Google Identity Services y alcance `drive.file`. No se ha encontrado ningún cliente OAuth del proyecto. El token vive en memoria; la aplicación identifica la cuenta con Drive `about`, gestiona caducidad/revocación y crea una carpeta propia de copias automáticas conservando las carpetas históricas. Se documenta la activación en `ACTIVAR_GOOGLE_DRIVE.md`.

El cliente reserva IDs con `generateIds` y guarda la reserva antes de crear un archivo, busca por identidad en appProperties y actualiza por ID. Ante una respuesta perdida reutiliza la reserva; ante conflicto verifica propiedad/identidad antes de actualizar. Ficha, NatalCore y registro se escriben con resultados independientes; el éxito exige leer de vuelta el JSON y compararlo. La entrada se copia antes de esperar y las colas cancelan trabajo de sesiones anteriores. Web Locks coordina las pestañas del mismo origen. La primera creación simultánea en dispositivos distintos sigue sin garantía transaccional para Drive; no se considera validada.

Se integra el autoguardado al abrir/calcular una carta y al cambiar nombre/interpretación, con estados separados de local/Supabase/Drive y botón de reintento. Los datos de nacimiento cambiados invalidan posiciones anteriores; el cálculo asíncrono se descarta si cambian los datos o la ficha. Se conservan velocidades y movimientos desconocidos como null en JSON y como raya en la tabla, incluidas banderas antiguas de retrogradación.

### Base de datos real

Tras auditar 5 registros existentes sin IDs vacíos, ambiguos ni duplicados, se aplica la migración aditiva `astrodb_chart_identity_unique`: columna generada `chart_local_id` compatible con `input_data.id` y `input_data.astrodb_local_id`, restricción única `(user_id,chart_local_id)` y check de ID presente. SQL exacto en `schema/astrodb_chart_identity_unique.sql`. No se borran ni combinan filas; RLS y políticas existentes se mantienen. La aplicación adopta upsert con la clave única.

Se prueba primero la expresión y upsert en una tabla temporal con rollback. Después se simula el rol `authenticated` y su claim de propietario en una transacción de la base real: dos upserts de la ficha sintética producen una fila actualizada; un insert con otro user_id es rechazado por RLS. La transacción se revierte y una consulta posterior confirma 5 filas y cero filas de prueba. Esta verificación SQL no sustituye un login real desde el navegador ni una prueba simultánea de dos clientes.

El asesor de seguridad no detecta problemas nuevos de tablas/RLS; mantiene un aviso previo de protección de contraseñas filtradas desactivada. No se cambia la configuración Auth como parte de esta integración.

### Navegador y pruebas

Se obtiene Chrome Headless Shell 155.0.8059.84 desde la distribución oficial. El Chrome completo no arrancó por las restricciones de sockets de este entorno; Headless Shell sí ejecuta las pruebas. La navegación se realiza desde archivo local y se bloquea explícitamente el tráfico externo para comprobar el modo desconectado sin usar cuentas reales.

`node --test astrodb/tests/*.test.cjs`: 24 pruebas de ejecución y 14 comprobaciones estáticas pasan.

`CHROME_EXECUTABLE_PATH=<headless-shell> node astrodb/tests/browser-flow.cjs`: pasan los flujos a 1440×1000 y 390×844. Incluyen abrir por UUID, autoguardado local, duplicar con ID nuevo, volver a abrir, descargar y leer el paquete JSON, subject_id coherente, speed null, retrógrado, estados independientes con Drive simulado y Supabase desconectado, invalidación de posiciones al editar nacimiento, ausencia de errores de ejecución y ausencia de desbordamiento horizontal. Se inspeccionan las capturas de la carta completa en ambos tamaños. Se corrige el banner fijo que cubría contenido móvil y el estado de Supabase que quedaba comprobando tras fallo de carga.

### Estado de entrega

La rama sigue sin fusionar y la web pública no se actualiza. Falta introducir el cliente OAuth, autorizar la cuenta y probar una escritura y lectura real desde AstroDB a Drive en un origen web autorizado. No se afirma que Drive esté conectado. El guardado desde dos dispositivos que crean simultáneamente archivos Drive por primera vez requiere la solución distribuida descrita arriba. La versión visible queda unificada en 10.1.

Revisión final: el cliente de aplicación bloquea las copias automáticas si NatalCore no supera su validación estructural. El fixture del navegador incluye los 12 puntos obligatorios, valida NatalCore y comprueba la exportación. Las salidas formateadas representan valores numéricos desconocidos con una raya en lugar de convertir null en cero.

## Configuración del cliente OAuth

El propietario aporta el identificador público del cliente OAuth del proyecto Google AstroDB y se integra en index.html mediante ASTRODB_GOOGLE_CLIENT_ID. La integración no acredita el consentimiento de la cuenta ni la configuración efectiva de los orígenes en Google Cloud. Falta una prueba real desde un origen web autorizado. La web pública sigue sin actualizarse.

## Copia de validación publicada con autorización del propietario

Se autoriza expresamente la publicación de una copia separada. Commit de main `3f1f94297742bac240890b34e42d4314e664ea58`: solo añade `astrodb-validacion/index.html` y `astrodb-validacion/drive-sync.js`; `astrodb/index.html` y el resto de la web no cambian. El despliegue GitHub Pages run 38930047877 termina en success.

URL verificada: https://qs33ds-alt.github.io/qs33ds-hub/astrodb-validacion/ . HTML y módulo JS devuelven HTTP 200 y sus hashes coinciden con las fuentes probadas. La copia usa `astrodb_validation_v51` y no importa las claves locales de la aplicación habitual. Está etiquetada como PRUEBAS y propone usar una ficha ficticia.

Antes de publicar se repiten los flujos de navegador locales de la copia exacta a 1440 y 390 píxeles y se inspeccionan ambas capturas. Un intento adicional de navegar a la URL pública con Headless Shell falla con ERR_EMPTY_RESPONSE en este entorno; por tanto no se acredita una ejecución de navegador contra el sitio remoto. La verificación remota realizada es HTTP y comparación de bytes, además del despliegue correcto de Pages.

Sigue pendiente consentimiento OAuth de la cuenta, subida/lectura real de Drive y validación de los destinos autenticados desde el navegador del propietario. La PR de la aplicación habitual sigue en borrador, sin fusionar.

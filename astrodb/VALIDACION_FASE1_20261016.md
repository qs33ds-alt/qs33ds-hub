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

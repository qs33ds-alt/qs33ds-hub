# AstroDB y Código Semilla contrato de integración

Estado: implementación en rama de trabajo, sin fusionar ni publicar la web. La protección única de Supabase sí está aplicada en la base de datos. Drive requiere configurar el cliente OAuth, autorizar la cuenta y validar una subida real. No representa una conexión Drive ya activada.

## Identidad y guardado

La ficha conserva su ID estable, con compatibilidad para IDs numéricos antiguos y UUID nuevos. El paquete contiene `format`, `exported_at`, `storage_destination`, `chart_id`, `chart` y `natalcore`. La identidad exige `String(chart.id) === chart_id` y `natalcore.meta.subject_id === 'astrodb:' + chart_id`. La captura se realiza antes de esperar por las escrituras. La copia automática de Drive solo se envía si NatalCore supera su validación estructural.

Guardar, calcular o abrir una carta completa inicia persistencia local y dos destinos remotos independientes. Cambiar los datos natales invalida las posiciones anteriores y exige recalcular. Un error de Drive no impide el guardado en Supabase/local, y un error de Supabase no impide Drive/local. Los estados visuales solo se actualizan si siguen correspondiendo a la ficha y solicitud activas.

## Supabase

Tabla `public.astrodb_charts`, con autenticación y RLS propias. La columna generada `chart_local_id` normaliza `input_data.id` y el campo histórico `input_data.astrodb_local_id`. La restricción única `(user_id,chart_local_id)` permite upsert atómico sin buscar e insertar por separado. No se deduplica por nombre de persona y no se eliminan ni combinan registros para aplicar la migración. SQL en `schema/astrodb_chart_identity_unique.sql`.

## Google Drive

La implementación utiliza Google Identity Services, autorización explícita de la cuenta y el permiso `drive.file`. El navegador llama directamente a la API de Google con un token temporal en memoria; no existe un proxy de escritura abierto ni se aceptan credenciales privilegiadas en el frontend. Google verifica permisos de la cuenta y el cliente comprueba identidad, MIME, carpeta y propiedad de aplicación antes de actualizar un ID existente.

Se crea una carpeta propia `Código Semilla · AstroDB automático`, con `01 · NatalCore JSON`, `02 · Exportaciones AstroDB` y `03 · Registros de sincronización`. Por ficha se conservan tres archivos actualizables: paquete AstroDB, NatalCore en su formato nativo y resultado del último intento. Se reservan IDs antes de crear, se busca por identidad en appProperties y se verifica el contenido leyendo de vuelta cada JSON. No se busca ni combina por nombre de persona.

Las carpetas históricas del traspaso se conservan sin asumir acceso OAuth:

- Código Semilla: `1-Ri0lHhmqQZO4GhP7SxaZmbYSpIBXdP_`
- NatalCore: `1EaSNz24SJGifOLYjJiYiHgfuxPlyzrsp`
- Exportaciones: `1YpEhREFIDxwwR9bwZq316QwO5LJtBXy5`
- Registros: `1DFk_kQotJcdFpR9OrWtL9FEyhLX8ES5x`

Seleccionar carpetas preexistentes mediante Picker queda fuera del flujo actual; no se amplían permisos para usarlas. La configuración y los límites están en `ACTIVAR_GOOGLE_DRIVE.md`.

## Seguridad y límites

Nunca incluir service_role, client_secret, refresh tokens o tokens preconfigurados de Google en GitHub Pages. La conexión de ChatGPT a Drive no autoriza AstroDB. El identificador del cliente OAuth es público; el token de acceso solo está en memoria. Recargar/cerrar la página o caducar la sesión requiere reconectar. No se promete sincronización con el navegador cerrado ni borrado remoto al eliminar una ficha local.

Las reservas locales y Web Locks coordinan reintentos y pestañas del mismo origen. Para garantizar la primera creación simultánea desde dispositivos distintos en Drive falta un registro remoto transaccional. Las búsquedas ambiguas se rechazan. La garantía única de Supabase sí está en la base de datos.

## Validación antes de publicar

Las pruebas locales, SQL y de navegador ejecutadas se detallan en `VALIDACION_FASE1_20261016.md`. Se distinguen expresamente los transportes simulados de las conexiones reales. Quedan pendientes el cliente OAuth y consentimiento, una subida/lectura real a Drive, una sesión Supabase real desde el navegador y la concurrencia distribuida de primera creación en Drive. Mantener la PR en borrador hasta completar esas comprobaciones.

# AstroDB · Código Semilla · Contrato de integración (fase 1)

Estado: **diseño técnico, NO desplegado**. No representa sincronización activa.

## Destinos independientes
- Supabase: `public.astrodb_charts`, autenticación y RLS propias.
- Google Drive: carpeta Código Semilla `1-Ri0lHhmqQZO4GhP7SxaZmbYSpIBXdP_`.
  - NatalCore JSON: `1EaSNz24SJGifOLYjJiYiHgfuxPlyzrsp`
  - Exportaciones AstroDB: `1YpEhREFIDxwwR9bwZq316QwO5LJtBXy5`
  - Registros de sincronización: `1DFk_kQotJcdFpR9OrWtL9FEyhLX8ES5x`

## Contrato de guardado futuro
El navegador construye un paquete JSON de una ficha concreta con `chart_id` estable, `chart`, `natalcore`, `exported_at`, `format` y versión. El usuario autenticado autoriza explícitamente el acceso a Google Drive. Un backend verifica identidad, permisos, tamaño, esquema y propiedad del paquete antes de escribir.

La API de guardado debe recibir un `idempotency_key` basado en usuario, identificador de ficha y versión de contenido. Buscar un archivo por **nombre de persona** no es una estrategia válida. La actualización debe referenciar el ID de archivo Drive previamente almacenado para ese usuario y ficha, y crear una nueva versión si no existe. Mantener un registro independiente por destino con `pending/success/error`, hora, identificador remoto y error seguro.

## Seguridad y permisos
- Nunca incluir `service_role`, `client_secret`, refresh tokens o tokens de Google en GitHub Pages.
- La conexión actual de ChatGPT a Drive no equivale a autorización OAuth de AstroDB.
- No crear un endpoint público que acepte IDs de carpeta arbitrarios ni subir datos natales sin comprobar identidad.
- Usar permisos mínimos de Drive; determinar si el alcance `drive.file` permite escribir en carpetas ya existentes de esta cuenta. Si no, establecer un flujo de selección/autorización adecuado, no ampliar permisos silenciosamente.
- La falta de conexión a Drive no debe bloquear el guardado local ni el guardado en Supabase.

## Pruebas obligatorias antes de publicar
1. Dos personas con el mismo nombre y IDs distintos.
2. Guardar y cambiar de ficha durante la petición remota.
3. Actualizar la misma ficha dos veces sin duplicados en Drive ni Supabase.
4. Fallo de Drive con Supabase operativo, y viceversa.
5. Permiso Drive revocado y sesión caducada.
6. Verificar que NatalCore preserva retrógrados y `speed:null` cuando no hay velocidad.
7. Prueba visual real con Chromium en escritorio y móvil, descarga JSON, estado de guardado y ausencia de superposiciones.
8. Comprobar que la versión visible coincide con el artefacto publicado.

No desplegar ni fusionar sin completar las pruebas.
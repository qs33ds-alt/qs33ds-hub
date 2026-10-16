# Activar las copias de AstroDB en Google Drive

La rama incorpora el cliente OAuth y el guardado de tres archivos por ficha: ficha AstroDB con NatalCore, NatalCore separado y registro del último intento. Los tres se actualizan conservando su ID. El cliente vuelve a descargar el contenido y lo compara antes de confirmar el guardado.

## Configuración necesaria del propietario

1. En Google Cloud Console, seleccionar o crear el proyecto de AstroDB y habilitar Google Drive API.
2. Configurar la pantalla de consentimiento de Google Auth Platform. Si la aplicación está en pruebas, añadir las cuentas que la van a usar como usuarios de prueba.
3. Crear un cliente OAuth de tipo Aplicación web. Añadir como origen JavaScript autorizado `https://qs33ds-alt.github.io`. El origen no lleva `/qs33ds-hub/astrodb/` ni otro path. Para desarrollo web se puede añadir por separado el origen localhost utilizado. No se requiere client secret en AstroDB.
4. Introducir el identificador público terminado en `.apps.googleusercontent.com` en Copias automáticas → Ajustes de conexión. Se guarda solo esa configuración pública en el navegador. Opcionalmente el administrador puede definir `window.ASTRODB_GOOGLE_CLIENT_ID` antes de cargar el script de la aplicación.
5. Pulsar Conectar Google Drive. La primera vez puede cargar la biblioteca y pedir un segundo clic para abrir la autorización desde un gesto del usuario. Elegir la cuenta y conceder el permiso solicitado.

La autorización la realiza el propietario en la ventana de Google. No enviar contraseñas, client secrets ni tokens a un chat ni introducirlos en el código.

## Uso previsto

Al abrir una ficha completa, calcular una carta o modificar su nombre/interpretación se programa el guardado tras una breve pausa. Guardar y Guardar y reintentar copias lo ejecutan inmediatamente. Cambiar los datos de nacimiento invalida la carta previa; es necesario volver a calcularla. Cambiar de ficha o modificar los datos durante un cálculo invalida su respuesta pendiente.

Las copias se crean en una carpeta propia llamada Código Semilla · AstroDB automático. Contiene 01 · NatalCore JSON, 02 · Exportaciones AstroDB y 03 · Registros de sincronización. Se usa `drive.file`, limitado a los archivos creados o autorizados para la aplicación. Las carpetas históricas del traspaso no se alteran ni se dan por autorizadas por tener acceso desde el conector de ChatGPT. No hay ampliación silenciosa al permiso de todo Drive.

La sesión de Drive es independiente de Supabase. El token OAuth está en memoria, nunca en almacenamiento persistente ni en el repositorio. Tras recargar/cerrar la página o caducar el token se debe pulsar Conectar de nuevo. Esto no es un servicio que siga funcionando con el navegador cerrado. Las copias anteriores permanecen en Drive. Eliminar una ficha local no elimina sus copias remotas.

## Prueba real requerida antes de publicar

Conectar desde un origen web autorizado, abrir una carta sintética y comprobar los tres mensajes de verificación. Abrir la carpeta del enlace y comprobar los tres archivos. Repetir guardado y verificar que sus IDs se mantienen. Probar rechazo/revocación de autorización y desconexión de Supabase por separado. Estas pruebas requieren un cliente OAuth válido y consentimiento del usuario; los tests con transporte simulado no las sustituyen.

## Límite distribuido pendiente

El registro local de IDs reservados, la búsqueda por identidad y Web Locks evitan duplicados al repetir, reintentar o usar pestañas del mismo origen. No garantizan creación única si dos dispositivos estrenan simultáneamente la misma ficha o la carpeta antes de que ninguno vea la creación del otro. Ese caso requiere un registro remoto transaccional adicional para Drive. El cliente detecta identidades duplicadas en búsquedas y se detiene en lugar de sobrescribir arbitrariamente. Supabase sí dispone de una restricción única de base de datos por usuario y ficha.

## Referencias oficiales

- https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid
- https://developers.google.com/identity/oauth2/web/guides/use-token-model
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/api/guides/create-file

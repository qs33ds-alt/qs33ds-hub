# AstroDB Workspace V2 · Cierre y despliegue seguro

## Decisión aprobada
Mantener **AstroDB clásico** en `/astrodb/` y **AstroDB Workspace V2** en `/astrodb-validacion/`, ambos accesibles mediante tarjetas independientes desde el portal QS33DS (`/index.html`).

## Estado de la rama
Rama: `feature/astrodb-workspace-v2-20261016`. PR: #2. El portal y V2 están preparados **juntos** en la misma rama; nunca publicar solo la tarjeta del portal apuntando a la antigua validación.

## Condiciones previas al despliegue
1. GitHub Actions del último commit en verde, incluidos análisis de scripts embebidos, contratos y Playwright Chromium escritorio/móvil.
2. Confirmar con sesión real OAuth de Google Drive: guardar carta, verificar ficha + NatalCore + registro, desconectar, reconectar y recuperar. **Pendiente**.
3. Confirmar con sesión real Supabase: guardar, recuperar, comprobar aislamiento entre cuentas y datos originales. **Pendiente**.
4. Revisión visual final y exportación de copia de seguridad de las cartas originales antes de cualquier publicación.
5. Revisar diferencias del PR para confirmar que `astrodb/` no cambia. Conservar la posibilidad de revertir el merge.

## Secuencia de publicación
1. Mantener PR #2 como borrador mientras existan pruebas autenticadas pendientes.
2. Tras superar los controles, revisar y aprobar el PR.
3. Fusionar el PR completo: portal y V2 se publican de forma coordinada por GitHub Pages.
4. Verificar las rutas públicas `/astrodb/`, `/astrodb-validacion/` y el portal, incluidos los dos accesos.
5. Si falla V2, revertir la publicación del PR sin borrar las cartas del navegador ni los datos remotos.

## No confundir
Los tests automatizados con mocks no equivalen a una escritura autenticada real. El resultado verde de CI no autoriza afirmar que Drive o Supabase funcionan de extremo a extremo. La rama no está publicada en `main` hasta su fusión.

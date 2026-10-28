# AstroDB Psychological Futurist

Estado: diseño propuesto para la rama de desarrollo; no aprobado para producción.

## Prioridades

1. Conservar los cálculos de Swiss Ephemeris y el identificador inmutable de cada carta.
2. Terminar validación de nombres JSON en Google Drive antes de cambiar el diseño.
3. Mantener Supabase, NatalCore y Google Drive como capas independientes.

## Composición

- Explorador lateral: fichas, búsqueda, abrir y crear.
- Mandala natal central: prioridad visual; no modificar sus cálculos.
- Panel contextual: nacimiento y pestañas planetas, casas, aspectos, regentes, NatalCore.
- Estado de sincronización: local, Supabase y Drive con verificación visible.
- Reubicar funciones de los antiguos acordeones Base de datos y NatalCore antes de retirarlos.

## Identidad visual

Paleta azul noche, cian y violeta tenue; superficies oscuras, tipografía legible y geometría discreta. Evitar efectos excesivos y conservar accesibilidad de teclado y movimiento reducido.

## Criterios de aceptación

- Probar en móvil de 390x844 y escritorio de 1440x900.
- No introducir recortes, solapamientos ni desbordamientos en el mandala o formularios.
- Probar abrir, calcular, guardar, recuperar y volver a guardar una carta.
- No declarar verificadas las copias hasta leer los JSON de Drive.
- No cambiar la versión principal sin pruebas de navegación y verificación visual.

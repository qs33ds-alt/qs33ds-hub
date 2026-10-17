# AstroDB Workspace V2 — Estado de componentes

Fecha: 2026-10-17. Rama: `feature/astrodb-workspace-v2-20261016`.

## Componentes validados para uso local en la rama V2

| Componente | Estado | Evidencia |
| --- | --- | --- |
| Navegación Biblioteca / Observatorio / Datos / Análisis / NatalCore | VALIDADO | Pruebas Chromium escritorio y móvil |
| Cálculo natal Swiss Ephemeris | VALIDADO | Prueba E2E de cálculo con 12 casas y planetas |
| NatalCore | VALIDADO | Estado válido y exportación JSON comprobados |
| Guardado, reapertura y actualización de fichas locales | VALIDADO | Pruebas de persistencia y de identidad |
| Recuperación de versiones antiguas | VALIDADO | Prueba de recuperación sin duplicación |
| Protección frente a sustitución por ID | VALIDADO | Pruebas de navegador y contratos de merge |

Último pipeline exitoso: https://github.com/qs33ds-alt/qs33ds-hub/actions/runs/39026833378

## Componentes todavía no validados para uso real

| Componente | Estado | Requisito para cierre |
| --- | --- | --- |
| Supabase autenticado | ESQUEMA Y RLS VERIFICADOS; E2E PENDIENTE | La tabla tiene RLS, políticas SELECT/INSERT/UPDATE/DELETE por auth.uid() y un índice único (user_id, chart_local_id); falta prueba autenticada de extremo a extremo sin tocar datos reales |
| Sincronización automática Google Drive | PENDIENTE | OAuth autorizado y comprobación de las copias remotas y reintentos |
| Publicación pública V2 | BLOQUEADA | Revisión funcional y aprobación explícita antes de modificar `main` |

## Reglas de operación

1. La rama V2 y el borrador de PR son entornos de validación, no producción.
2. No fusionar el PR ni sustituir `astrodb/` o `astrodb-validacion/` en `main` sin autorización.
3. Nunca borrar, sobrescribir ni deduplicar fichas reales automáticamente.
4. Una ficha guardada localmente no debe presentarse como sincronizada en Supabase o Drive sin confirmación.
5. En pruebas usar únicamente fichas sintéticas, salvo autorización expresa para otras.

## Descarga y revisión

- Código V2: https://github.com/qs33ds-alt/qs33ds-hub/archive/refs/heads/feature/astrodb-workspace-v2-20261016.zip
- Pull request de revisión (sin fusionar): https://github.com/qs33ds-alt/qs33ds-hub/pull/2

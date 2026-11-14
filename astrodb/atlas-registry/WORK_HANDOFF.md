# AstroDB · Registro ATLAS — ENTREGA A CHATGPT WORK
Fecha: 2026-11-14
Estado: desarrollo aislado, NO publicado.

## Enlaces canónicos
- Carpeta de trabajo Drive: https://drive.google.com/drive/folders/1NI6la6dWmgn9lFhTz7Wc4UdbkFXKK-Gw
- Carpeta original AstroDB: https://drive.google.com/drive/folders/1hp6R00ds1D49k5N3C5gr0QCoFDSXHsbE
- ZIP original V2.1.1: https://drive.google.com/file/d/1UanfOPyKlgjvL1AcDoBftls038WL9TJ_/view
- Rama de trabajo: https://github.com/qs33ds-alt/qs33ds-hub/tree/feature/astrodb-atlas-registro-20261113
- Rama base: feature/astrodb-workspace-v21-ciclos-20261103
- Registro anterior V2: https://docs.google.com/document/d/1EdSSeE4ZSoVnpSJ4sR4N0RjZZ8VnqWRnwSsz41kHpyM/edit
- App histórica: https://astrodb-workspace.qs33ds.workers.dev/ (estado actual sin verificar)

## Implementado en la rama de trabajo
- astrodb/atlas-registry/schema-staging.sql: esquema propuesto para ejecuciones, artefactos y eventos, con RLS. NO ejecutado en Supabase.
- astrodb/atlas-registry/registry-core.js: normalización y correlación de ejecuciones, estado de descarga. Sin conexión a interfaz todavía.

## Infraestructura comprobada
- Supabase proyecto didehazzbdhgjpxvhycx: astrodb_charts, astrodb_documents, astrodb_studies; inventario mostró 0 filas. No implica ausencia de datos locales o de Drive.
- Otro proyecto mrgqezbpkbaeginbiegr: sin tablas AstroDB en inventario público.
- La rama de desarrollo no está fusionada ni publicada.

## Objetivo funcional
Una sola ficha por persona con sus NatalCore originales, ejecuciones de ATLAS ORIGEN, ENNOIA, Revolución Solar y SÍNTESIS, documentos, versiones, hashes, enlaces, fechas, estados y eventos de descarga.
Distinguir: descarga solicitada, descarga confirmada y registro histórico no verificado. Nunca inventar descargas retrospectivas.

## Próximas tareas para Work
1. Auditar el código real de la rama base y ZIP V2.1.1; identificar navegación, autenticación, persistencia y exportaciones.
2. Revisar compatibilidad de esquema staging con datos y políticas RLS existentes, y documentación Supabase vigente. No ejecutar migraciones sin pruebas.
3. Integrar módulo de registro en la interfaz de AstroDB de forma no destructiva.
4. Instrumentar generación, guardado y descarga; usar backend confiable para eventos verificados.
5. Añadir pruebas automáticas de identidad, no duplicación, control de acceso, exportación y recuperación.
6. Importar únicamente históricos demostrables, sin alterar archivos originales.
7. Generar ZIP de entrega y reporte de pruebas en la carpeta WORK. Publicar solo tras aprobación explícita.

## Condiciones
- No borrar ni sobrescribir originales, fichas, NatalCore ni documentos.
- No tocar producción ni rama main.
- No mostrar claves o service_role en el cliente.
- Separar HECHO / VERIFICADO / PENDIENTE / FALLIDO.
- En caso de discrepancia, detener la modificación y documentarla.

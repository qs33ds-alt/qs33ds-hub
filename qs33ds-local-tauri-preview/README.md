# QS33DS Local — vista previa Tauri 2

Esta rama contiene una **vista previa compilable de la interfaz** con chat local y conexión directa a Ollama. Es una prueba visual y de empaquetado; NO es la migración completa QS33DS_LOCAL_LINUX_V020 ni incluye agenda, memoria SQLite o motor Python.

## Ejecutar en Windows
Necesitas Windows 10/11, Ollama, WebView2 y el modelo `qwen3:1.7b` (descargar: `ollama pull qwen3:1.7b`). Si descargas el instalador desde **Actions → Compilación Windows Tauri → Artifacts**, ejecuta el instalador NSIS. El botón **Vista de muestra** funciona incluso sin Ollama.

## Código y compilación
Los archivos están en `qs33ds-local-tauri-preview/`. Para desarrollo: `npm install`, `npm run tauri dev`. GitHub Actions compila Windows automáticamente desde esta rama y publica el instalador como artifact del workflow (no crea ninguna release). No se incluye información personal ni secretos.

Los parámetros de velocidad de Qwen son reales cuando Ollama está conectado. Ninguna cifra de rendimiento se ha medido todavía en el ordenador del usuario. Para la versión definitiva se integrará el motor Python y sus funciones originales manteniendo datos en local.

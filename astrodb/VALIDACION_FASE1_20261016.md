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

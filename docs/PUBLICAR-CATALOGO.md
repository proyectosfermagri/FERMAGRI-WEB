# Publicar catálogo y archivos en el alojamiento existente

Estado al 30 de septiembre de 2026: preparado y probado localmente, **no desplegado**. PHP y el acceso al alojamiento todavía no están confirmados. DNS `ns1.eopensolutions.com` / `ns2.eopensolutions.com` es una pista, no una confirmación del proveedor. No se han contratado servicios.

## Qué cambia

La web lee `data/catalogo.json` del mismo alojamiento. Si falta o es inválido, intenta consultar Supabase con un tiempo límite. Portada, buscador, categorías y detalle comparten esa lectura. No se publican `formula_interna` ni la categoría Orgánicos.

El administrador sigue usando Supabase para iniciar sesión y guardar datos. Los archivos nuevos van a `api/catalog.php`, que valida la sesión y una lista explícita de administradores. Las imágenes JPG/PNG/WebP se recodifican en el servidor a WebP, máximo 1920 px y 1,5 MB finales; entrada máxima de 10 MB y 16 megapíxeles. Los PDF se conservan, máximo 10 MB, y se sirven como descarga. No hace falta instalar Node en el hosting.

Después de guardar/borrar productos o slides, el administrador pide publicar una copia completa desde la base de datos. Un fallo mantiene la última copia y muestra «Publicación pendiente». «Publicar catálogo» reintenta únicamente esa publicación, sin volver a crear registros. Las ediciones hechas fuera de este administrador requieren pulsar ese botón. Una caída de Auth/DB todavía impide editar; no impide leer la copia pública.

## Pendientes antes de activar

- Confirmar proveedor, carpeta pública y acceso por panel, SFTP o SSH. No enviar contraseñas por chat.
- Confirmar PHP 8.1+ con cURL, GD con WebP, fileinfo y mbstring; Apache 2.4 con `.htaccess` habilitado y `mod_headers`. Recomendado `memory_limit=256M`, `upload_max_filesize=10M`, `post_max_size=12M`, `max_execution_time=120`. El proxy debe permitir ese tamaño y tiempo.
- Recuperar originales: la exportación tiene **64 productos visibles y 5 slides**, con **20 referencias locales preparadas y 240 referencias remotas pendientes**. Incluyen imágenes, dos banners y documentos PDF. El informe exacto está en `.context/media-pending.json` (solo local, no subir). Los enlaces pendientes conservan la URL original; siguen fallando mientras Storage devuelva 402. **Este paquete no es una migración completa de archivos.**

Si el alojamiento no admite estos requisitos, no subir el administrador nuevo: habrá que adaptar la API al servidor disponible. El catálogo JSON puede servirse desde cualquier alojamiento estático.

## Preparación de los archivos antiguos

La exportación privada de trabajo está en `.context/public-export.json`. La herramienta utiliza únicamente la lista blanca de campos públicos. No subir `.context` ni una exportación completa de la base de datos.

```sh
php scripts/prepare-catalog.php .context/public-export.json --download
# O usando una copia de Storage, conservando los nombres exactos:
php scripts/prepare-catalog.php .context/public-export.json --originals=/ruta/a/fermagri-assets
```

Genera `media/`, `data/media-map.json`, `data/catalogo.json` y el informe local de pendientes. No cambia la base de datos ni borra originales. Sale con código **2** si quedan archivos sin recuperar: no confundirlo con una migración completa. Si Storage responde 402, deja de repetir descargas bloqueadas. No sustituye imágenes por nombres parecidos.

Ejecutar solo en la copia de trabajo, no sobre carpetas que estén atendiendo publicaciones del administrador. Volver a exportar los datos si se han editado desde la exportación inicial. El mapa se conserva para que las siguientes publicaciones sustituyan las URLs antiguas por archivos locales sin modificar las filas originales.

## Configuración y subida

1. Hacer una copia recuperable de la web actual y comprobar qué versión tiene. El paquete es una actualización de la web existente, no un instalador de un sitio vacío. No borrar archivos ajenos.
2. Probar primero en una carpeta o dominio de ensayo. Subir `api/`, `media/` y `data/`, incluidos sus `.htaccess`. No subir tests, scripts, SQL, `.git`, `.context`, node_modules ni otros archivos de trabajo.
3. Copiar `api/config.example.php` a `api/config.php` **en el servidor**. Configurar `supabase_key` con la clave pública anon del proyecto web `bfwqmekquomqkydrxwvm`, `admin_ids` con los UUID exactos de las cuentas autorizadas en Supabase Auth y `site_origin` con el origen HTTPS exacto (sin barra final). No usar una clave `service_role` ni contraseñas. Se pueden usar las variables `FERMAGRI_SUPABASE_ANON_KEY` y `FERMAGRI_ADMIN_IDS` (UUID separados por comas, sin espacios), o editar el array PHP en el panel privado. Un origen de ensayo debe configurarse por separado.
4. El usuario de PHP necesita escritura en `media/` y `data/`; no dar permisos 777. El servidor debe poder leer esos archivos. Proteger `api/config.php` y comprobar que no se descarga su contenido. Si `.htaccess` provoca 500, resolverlo con el proveedor, no eliminar las protecciones.
5. Subir primero los archivos de `media/`, después el mapa y el JSON. Para reemplazar JSON en un sitio activo, subir con nombre temporal y renombrar al terminar. No reemplazar una copia más reciente por la exportación inicial. No sobrescribir `api/config.php` en futuras actualizaciones.
6. Subir `public-data.js`, `productos.js`, `main.js`, `catalogo-utils.js`, `motor-dinamico.js`, `galeria.js` y los HTML actualizados. Activar `admin.html` solo después de validar la API. Mantener estilos, imágenes estáticas y demás archivos existentes.

## Comprobación en el servidor

- `data/catalogo.json` responde 200, JSON válido y `Cache-Control: no-cache`; no contiene `formula_interna`.
- `api/config.php`, `api/config.example.php`, `api/catalog-lib.php` y `data/.publish.lock` no son descargables. Sin listados de directorio.
- POST sin sesión a `api/catalog.php?action=upload` devuelve 401. GET al endpoint devuelve 405. Una cuenta no incluida en `admin_ids` no puede subir ni publicar.
- Con una cuenta autorizada, subir una imagen de prueba y verificar WebP, URL `media/<sha256>.webp`, `Content-Type: image/webp` y `X-Content-Type-Options: nosniff`. Un PDF se descarga con `Content-Disposition: attachment`. SVG, HTML y PHP deben rechazarse.
- Guardar y borrar un slide de prueba; comprobar el JSON y la web desde otro navegador. Probar también una ficha PDF individual y una carga masiva controlada. No usar contenido real para pruebas destructivas.
- Bloquear `*.supabase.co` en el navegador y comprobar portada, búsqueda, categorías y detalle. Los archivos ya migrados deben seguir visibles; revisar por separado los pendientes. Si falla la publicación, comprobar que sigue disponible la copia anterior y reintentar con el botón.
- Verificar capacidad y transferencia incluidas en el alojamiento: mover los archivos reduce el consumo de Supabase, **no convierte en ilimitado el hosting**. Esto tampoco elimina el consumo ya contabilizado en Supabase ni levanta inmediatamente su bloqueo.

## Pruebas locales

```sh
node --test tests/*.test.mjs
php tests/catalog-api.test.php
php -l api/catalog.php
php -l api/catalog-lib.php
php -l scripts/prepare-catalog.php
```

La prueba HTTP arranca PHP y un servidor simulado de Supabase en puertos locales temporales, sin tocar producción. Si PHP no está en PATH: `PHP_BIN=/opt/homebrew/opt/php@8.4/bin/php node --test tests/*.test.mjs`. Se comprobó también Chrome con todas las conexiones externas bloqueadas en portada, catálogo, Edáficos, Master Protec y detalle de Ulexita (id 2), sin errores JavaScript. Las reglas Apache deben verificarse en el hosting: el servidor de desarrollo de PHP no aplica `.htaccess`.

Para volver atrás, restaurar los HTML/JS anteriores desde la copia del servidor. Conservar `media/` y los JSON: los registros ya guardados pueden referenciarlos. No borrar nada de Supabase durante esta migración.

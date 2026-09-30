# Handoff — Despliegue y migración de archivos de Fermagri

Actualizado: **30 de septiembre de 2026**. Preparación local terminada; **despliegue y migración completa pendientes**.

## Para quien continúa

El usuario confirma que la persona que recibe este handoff **sí tiene acceso al alojamiento**. El siguiente paso es usar ese acceso para comprobar los requisitos y desplegar, no volver a implementar la solución. El agente anterior no accedió al servidor, no publicó estos cambios y no contrató servicios.

Objetivo: reducir el consumo de transferencia de Supabase **sin contratar un plan adicional**, conservando el diseño y el administrador. Los archivos se servirán desde el alojamiento existente de `fermagri.com`; el catálogo tendrá una copia pública local. Verificar también los límites de transferencia del hosting: no se presupone capacidad ilimitada.

## Código y entrega: importante antes de empezar

- Repositorio: `proyectosfermagri/FERMAGRI-WEB`. Rama actual: `AKB`; base de comparación: `origin/main`.
- Commit base de esta entrega: `13984c2c29fd4a3b0755eb8c192ecb56e1a5bf85`. Consultar `git log -1` para el commit de la entrega.
- Workspace: `/Users/auric/conductor/workspaces/fermagri-web-v1/bangui`.
- El usuario ha autorizado commit y push de la entrega a **`origin/AKB`**, no a `main`. Obtener esa rama y comprobar que contiene `api/catalog.php` y `docs/SESION-HANDOFF.md`; las exportaciones de trabajo y el ZIP local no se incluyen en Git.
- Este handoff está versionado en `docs/SESION-HANDOFF.md`. `.context/` está excluida de Git. Compartir este handoff y los archivos necesarios explícitamente, por un canal privado; no subir esa carpeta a la web.
- [Paquete de actualización preparado](../.context/fermagri-catalogo-local-2026-09-30.zip): `.context/fermagri-catalogo-local-2026-09-30.zip` (aprox. 1,6 MB). Contiene los archivos de publicación y la guía, pero no las herramientas de migración, pruebas ni exportación de trabajo. Es una actualización del sitio existente, no una instalación completa.
- [Guía detallada de publicación](PUBLICAR-CATALOGO.md): leer antes de subir archivos. Complementa este handoff.
- [Plan y estado de tareas](superpowers/plans/2026-09-30-catalogo-local.md).

Si se recuperan más archivos o cambia el código, el ZIP preparado quedará desactualizado: generar la entrega desde el estado final verificado. No desplegar una copia antigua del catálogo sobre cambios recientes del administrador.

## Incidente y proyecto correcto

En las comprobaciones de esta sesión, la API pública y Storage devolvían **HTTP 402 por cuota de transferencia en caché**. El acceso de administración permitió exportar los datos, pero no recuperar los archivos de Storage. Volver a comprobar el estado: no asumir que el bloqueo continúa o que ya se levantó.

Proyecto Supabase de esta web: **`bfwqmekquomqkydrxwvm`**.

- URL: `https://bfwqmekquomqkydrxwvm.supabase.co`.
- Bucket: `fermagri-assets`; tablas de esta migración: `productos` y `slides`.
- No utilizar otro proyecto seleccionado por defecto en una herramienta/MCP.
- Los DNS observados fueron `ns1.eopensolutions.com` y `ns2.eopensolutions.com`; son una pista, no una confirmación del proveedor ni del soporte PHP. El operador debe comprobar el servidor real usando su acceso.

## Qué está implementado

- `public-data.js` lee primero `data/catalogo.json`. Portada, búsqueda, categorías y detalle comparten esa copia; si falta o es inválida, hay un fallback remoto con timeout.
- `admin.html` conserva Supabase Auth y la base de datos. Las subidas nuevas de imágenes y PDF usan `api/catalog.php`, no Supabase Storage.
- La API PHP valida la sesión contra Supabase y una lista explícita de UUID de administradores. Recodifica imágenes a WebP y valida tipos/tamaños; los PDF se sirven como descarga. Guarda archivos completos de forma atómica y verifica el contenido antes de reutilizarlos.
- Guardar/borrar productos o slides solicita publicar el catálogo completo desde la base de datos. Si falla, conserva la copia anterior y muestra «Publicación pendiente». «Publicar catálogo» reintenta publicar **sin repetir el guardado**.
- Se excluyen `formula_interna` y la categoría Orgánicos de la copia pública. No se borran esos datos de la base.
- `data/media-map.json` traduce URLs antiguas a archivos locales en cada publicación. No hace falta reemplazar las URLs originales en la base de datos.
- El administrador **todavía depende de Supabase para iniciar sesión y editar**. La copia pública no elimina esa dependencia ni levanta el bloqueo de cuota existente.

## Recuperación de archivos: pendiente real

Exportación preparada: **64 productos visibles y 5 slides**. Hay **20 referencias de archivos locales verificadas y 240 referencias remotas pendientes**, entre imágenes, dos banners y documentos PDF. Las URLs pendientes se mantienen; no se han sustituido por imágenes parecidas. Por tanto, **tener el JSON no significa que todas las imágenes y fichas estén disponibles**.

Archivos de trabajo que debe recibir quien haga la migración:

- `.context/public-export.json`: exportación utilizada para preparar el catálogo.
- `.context/media-pending.json`: inventario exacto de referencias pendientes y motivo.
- `scripts/prepare-catalog.php`, `api/catalog-lib.php`, `media/` y `data/`: herramienta, funciones compartidas y resultados actuales.

Desde la raíz de la copia de trabajo, con PHP disponible:

```sh
# Si Storage vuelve a permitir las descargas:
php scripts/prepare-catalog.php .context/public-export.json --download

# O con una copia de los originales de Storage, con sus nombres exactos:
php scripts/prepare-catalog.php .context/public-export.json --originals=/ruta/a/fermagri-assets
```

La herramienta no borra originales ni modifica la base. El código de salida **2 significa que siguen faltando archivos**, no una migración completa. Si se han editado productos/slides después de la exportación inicial, obtener una exportación actual antes de regenerar. No ejecutar esta herramienta sobre las carpetas del servidor mientras el administrador esté publicando.

Si solo se dispone de originales con nombres distintos, revisar y vincular cada uno explícitamente; no inferir equivalencias por similitud de nombres. Tener acceso al hosting por sí solo no recupera archivos que únicamente estaban en Supabase. Si siguen faltando, informar del impacto y acordar cualquier publicación parcial, sin presentarla como migración terminada.

## Orden de despliegue

1. **Inspeccionar y respaldar.** Confirmar proveedor, método de acceso, carpeta pública y versión de la web instalada. Guardar una copia recuperable de los archivos que se reemplazarán. No cambiar DNS, contratar servicios ni borrar archivos ajenos para este despliegue.
2. **Comprobar compatibilidad.** PHP 8.1+ con cURL, GD con WebP, fileinfo y mbstring; Apache 2.4 con `.htaccess` habilitado y `mod_headers`. Valores recomendados: `memory_limit=256M`, `upload_max_filesize=10M`, `post_max_size=12M`, `max_execution_time=120`; revisar también los límites del proxy. Si no es compatible, no activar el administrador nuevo: informar y adaptar la API al servidor disponible.
3. **Recuperar los archivos pendientes y actualizar los datos.** Seguir el apartado anterior; conservar el mapa y los originales. Acordar una ventana sin ediciones al publicar la copia inicial para no sustituir datos más recientes.
4. **Probar en un entorno de ensayo.** Subir `api/`, `media/` y `data/`, incluidos sus `.htaccess`. Dar escritura a PHP en `media/` y `data/`, sin permisos 777.
5. **Configurar en el servidor.** Copiar `api/config.example.php` a `api/config.php`. Definir la clave pública `anon` del proyecto correcto, los UUID exactos de las cuentas administradoras autorizadas y el origen HTTPS exacto en `site_origin` (sin barra final; ensayo y producción pueden diferir). Se admiten `FERMAGRI_SUPABASE_ANON_KEY` y `FERMAGRI_ADMIN_IDS`, o editar el array PHP en el panel privado. **No usar `service_role`, contraseñas ni una lista de todos los usuarios.** No compartir credenciales por chat ni añadir `config.php` a Git.
6. **Subir primero los archivos, después los datos.** Publicar `media/` antes del mapa y del JSON. Reemplazar JSON mediante archivo temporal y renombrado al terminar. No sobrescribir un `api/config.php` ya configurado.
7. **Activar el frontend.** Subir `public-data.js`, `productos.js`, `main.js`, `catalogo-utils.js`, `motor-dinamico.js`, `galeria.js` y los HTML actualizados: `index.html`, `productos.html`, `producto.html`, `edaficos.html`, `master.html`. Subir `admin.html` solo cuando la API esté validada. Mantener los estilos, imágenes estáticas y demás archivos existentes.
8. **Validar producción y dejar constancia.** Seguir la lista siguiente; registrar fecha, versión entregada, pendientes y ubicación privada del respaldo. No guardar contraseñas en este documento.

No subir `.context`, `.git`, pruebas, scripts de mantenimiento, SQL, `node_modules` ni exportaciones de trabajo al directorio público. No descomprimir el workspace entero sobre producción.

## Pruebas y criterios de cierre

En esta sesión pasaron **13 pruebas Node**, comprobaciones PHP y revisión de código. Chrome cargó portada, catálogo, Edáficos, Master Protec y detalle `producto.html?id=2` con conexiones externas bloqueadas, sin errores JavaScript. Esto verifica los datos y el flujo local, **no los 240 archivos pendientes ni las reglas Apache del servidor real**.

Para repetir desde el repositorio:

```sh
node --test tests/*.test.mjs
php tests/catalog-api.test.php
php -l api/catalog.php
php -l api/catalog-lib.php
php -l scripts/prepare-catalog.php
git diff --check
```

En el Mac de este workspace, PHP está en `/opt/homebrew/opt/php@8.4/bin/php`. Si no está en PATH, usar esa ruta para PHP y `PHP_BIN=/opt/homebrew/opt/php@8.4/bin/php node --test tests/*.test.mjs`. No se necesita Node en el hosting de producción.

Antes de dar el despliegue por terminado:

- [ ] `data/catalogo.json` responde 200, tiene datos actuales, no contiene fórmulas internas ni Orgánicos y usa `Cache-Control: no-cache`.
- [ ] Los archivos migrados responden 200 desde el dominio propio; los pendientes están resueltos o expresamente aceptados como pendientes.
- [ ] `api/config.php`, `api/config.example.php`, `api/catalog-lib.php` y `data/.publish.lock` no se pueden descargar; no hay listados de directorio. Las reglas `.htaccess` no provocan errores 500.
- [ ] POST sin sesión al endpoint devuelve 401; GET devuelve 405. Una cuenta autenticada fuera de la lista de administradores no puede subir/publicar.
- [ ] Una cuenta autorizada puede subir JPG/PNG/WebP y PDF; SVG/HTML/PHP se rechazan. La imagen resultante es WebP; el PDF lleva `Content-Disposition: attachment`; los archivos usan `X-Content-Type-Options: nosniff`.
- [ ] Crear, editar y borrar contenido **de prueba** actualiza la copia y se refleja en un segundo navegador. Probar ficha individual y carga masiva controlada, sin borrar contenido real.
- [ ] Ante un fallo de publicación sigue disponible la copia anterior, se muestra el aviso y el reintento no duplica filas.
- [ ] Con Supabase bloqueado en el navegador funcionan portada, búsqueda, categorías, detalle y archivos ya migrados. Probar móvil y escritorio, con recarga sin caché.
- [ ] Quedan documentados el proveedor, método de publicación, versión instalada y recuperación, sin credenciales.

## Reversión y límites de esta entrega

Si hace falta revertir, restaurar HTML/JS anteriores desde el respaldo. **Conservar `media/` y los JSON**: puede haber registros recién guardados que los referencien. No borrar archivos ni datos de Supabase como parte de esta migración. Si se revierte al frontend anterior, reaparece su dependencia de Supabase; no confundir la reversión con una solución al bloqueo.

No renombrar `AKB`. Commit/push solo con autorización del usuario. Preservar los cambios existentes en `setup_slides_table.sql` y `SUPABASE_STAGE2_AUTH.sql`: son trabajo previo de permisos, no pasos que deban ejecutarse a ciegas para desplegar PHP. No se requiere crear una tabla nueva para esta entrega.

## Contexto anterior de diseño (no es la tarea pendiente)

El sitio ya tiene ajustes de hero/carrusel móvil, header, categorías, contacto, buscador y colores de marca. Mantener ese diseño. El chatbot usa WhatsApp `+593 99 140 6383`; capturas históricas en `.context/design-review/`. Header/footer se cargan con `cache: 'no-cache'`; CSS/JS pueden requerir recarga forzada. La auditoría visual y el pulido propuestos en el handoff antiguo no son requisitos para resolver este despliegue.

# Catálogo y archivos en el alojamiento de Fermagri

**Objetivo aprobado:** conservar el administrador y el diseño, servir archivos desde el alojamiento existente y mantener el catálogo público disponible sin Supabase. Sin nuevos servicios de pago.

**Arquitectura:** un JSON público con productos y slides, y un mapa de archivos migrados, compartido por catálogo, detalle y portada. El administrador conserva Supabase Auth y la base de datos; una API en el alojamiento valida la sesión, recibe imágenes/PDF y publica una copia desde la base de datos (no acepta filas arbitrarias del navegador). La implementación PHP queda condicionada a confirmar soporte en el hosting Apache.

**Contexto:** rama AKB en worktree existente. Los dos SQL modificados previamente se preservan. No hacer commit/push hasta autorización. El acceso al hosting está pendiente; DNS ns1/ns2.eopensolutions.com. La API pública y Storage de Supabase responden 402, pero el acceso de administración permite exportar datos.

- [x] Recuperar datos públicos actuales, excluir formula_interna y orgánicos; inventariar archivos, sin reemplazar fotografías por coincidencias ambiguas.
- [x] Implementar lectura local compartida con fallback remoto acotado. Quitar esperas infinitas a Supabase. Cubrir catálogo, detalle, búsqueda y slider; mantener filtros/orden existentes.
- [x] Preparar API PHP con autenticación Supabase y lista explícita de administradores, validación de MIME/tamaño, nombres generados, archivos no ejecutables y publicación atómica. Preservar copia anterior ante errores.
- [x] Adaptar las subidas individuales y masivas del administrador, comprimir imágenes y sincronizar la copia después de guardar/borrar. Mostrar fallo de publicación y permitir reintentar sin duplicar registros.
- [x] Proveer herramienta de migración de archivos existentes y exportación inicial; no sobrescribir archivos previos ni publicar referencias rotas como migración exitosa.
- [x] Probar carga sin Supabase, categorías ocultas, timeout/errores, datos vacíos, subidas sin sesión, tipos rechazados y publicación fallida conservando respaldo. Pruebas existentes y revisión del diff.
- [x] Documentar despliegue/configuración y preparar entrega. Publicar solo si el hosting y el acceso quedan confirmados; mantener explícitos los bloqueos de acceso y recuperación de archivos.
- [ ] Pendiente externo: confirmar alojamiento/PHP/acceso, recuperar los 240 archivos pendientes y validar el despliegue real.

Resultado parcial: 64 productos visibles, 5 slides, 20 referencias locales, 240 pendientes por bloqueo de Storage. Compresión solo en servidor para mantener una única validación/recodificación. Se quitó un renderizador obsoleto en Master que usaba `listaProductos` inexistente; `motor-dinamico.js` ya hace esa carga. Instrucciones en `docs/PUBLICAR-CATALOGO.md`. No se ha publicado ni se han borrado originales.

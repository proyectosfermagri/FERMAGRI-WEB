function formatearFormula(texto) {
    if (!texto) return "";
    return texto
        .replace(/_([0-9a-z\+\-\/]+)/g, '<sub>$1</sub>')
        .replace(/\^([0-9a-z\+\-\/]+)/g, '<sup>$1</sup>');
}

let listadoProductos = [];

// Leer la copia publicada, con fallback remoto si todavía no está desplegada.
async function cargarProductosDesdeSupabase() {
    try {
        const data = await window.fermagriData.load('productos');

        const catalogoUtils = window.catalogoUtils;

        listadoProductos = data.map(p => {
            const producto = catalogoUtils
                ? catalogoUtils.applyCatalogCategoryOverrides(p)
                : p;

            return {
                ...producto,
                nombre: formatearFormula(producto.nombre),
                descripcion: Array.isArray(producto.descripcion) ? producto.descripcion.map(d => formatearFormula(d)) : [formatearFormula(producto.descripcion)],
                dosis: formatearFormula(producto.dosis),
                concentracion: formatearFormula(producto.concentracion)
            };
        });

        listadoProductos = catalogoUtils
            ? catalogoUtils.sortProductsForCatalog(catalogoUtils.filterVisibleProducts(listadoProductos), 'Todos')
            : listadoProductos.sort((a, b) => a.nombre.localeCompare(b.nombre));

        window.dispatchEvent(new Event('productosCargados'));
        return listadoProductos;
    } catch (err) {
        console.error("Error cargando productos de Supabase:", err);
        return [];
    }
}

// Promesa global para compatibilidad con el código existente
window.productosCargadosPromise = cargarProductosDesdeSupabase();

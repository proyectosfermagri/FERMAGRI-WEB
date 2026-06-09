// Configuración de Supabase para Fermagri
const SUPABASE_URL = "https://bfwqmekquomqkydrxwvm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmd3FtZWtxdW9tcWt5ZHJ4d3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTEzMjIsImV4cCI6MjA4OTQ2NzMyMn0.Tatgp8Gs_5DN-zvmoWjW5IuhbrRQhMtCOxHFCwguHl0";

// Cargamos el cliente de Supabase desde CDN (esto se carga en el HTML)
// let supabase; // Se inicializará en cada página

function formatearFormula(texto) {
    if (!texto) return "";
    return texto
        .replace(/_([0-9a-z\+\-\/]+)/g, '<sub>$1</sub>')
        .replace(/\^([0-9a-z\+\-\/]+)/g, '<sup>$1</sup>');
}

let listadoProductos = [];

// Función para inicializar Supabase y cargar datos
async function cargarProductosDesdeSupabase() {
    try {
        const client = window.sb || window.supabase;
        const { data, error } = await client
            .from('productos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;

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
window.productosCargadosPromise = new Promise(async (resolve) => {
    // Esperamos a que la librería de Supabase esté disponible
    const checkClient = setInterval(async () => {
        if (window.sb) {
            clearInterval(checkClient);
            const productos = await cargarProductosDesdeSupabase();
            resolve(productos);
        }
    }, 100);
});

/* Una copia compartida para catálogo, detalle, búsqueda y portada. */
(function (global) {
    const url = 'https://bfwqmekquomqkydrxwvm.supabase.co';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmd3FtZWtxdW9tcWt5ZHJ4d3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTEzMjIsImV4cCI6MjA4OTQ2NzMyMn0.Tatgp8Gs_5DN-zvmoWjW5IuhbrRQhMtCOxHFCwguHl0';
    const fields = {
        productos: 'id,nombre,categoria,descripcion,dosis,concentracion,origen,presentacion,ficha,seguridad,imagen,textura,orden',
        slides: 'id,orden,title,subtitle,image_url,button_text,button_link',
    };
    let snapshot;
    const pending = {};
    const validRows = (table, rows) => Array.isArray(rows) && rows.every(row => row && row.id != null
        && typeof row[table === 'productos' ? 'nombre' : 'title'] === 'string');

    async function getJSON(path, headers = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(path, {headers, cache: 'no-cache', signal: controller.signal});
            if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
            return await response.json();
        } finally {
            clearTimeout(timeout);
        }
    }

    async function load(table) {
        if (!Object.hasOwn(fields, table)) throw new Error('Tabla fuera del catálogo público.');
        if (!snapshot) {
            snapshot = getJSON('data/catalogo.json').then(data => {
                if (!data || data.version !== 1 || !validRows('productos', data.productos) || !validRows('slides', data.slides)) {
                    throw new Error('Copia del catálogo inválida.');
                }
                return data;
            }).catch(() => null);
        }
        const local = await snapshot;
        if (local) return local[table];
        if (!pending[table]) {
            const order = table === 'slides' ? 'orden.asc,id.asc' : 'nombre.asc';
            pending[table] = getJSON(`${url}/rest/v1/${table}?select=${fields[table]}&order=${order}`, {apikey: key})
                .then(rows => {
                    if (!validRows(table, rows)) throw new Error('Respuesta del catálogo inválida.');
                    return rows;
                });
        }
        return pending[table];
    }

    global.fermagriData = {load};
})(window);

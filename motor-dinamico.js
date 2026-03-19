/**
 * MOTOR DINÁMICO DE CARGA - FERMAGRI 2026
 * Este script lee la categoría de la URL y filtra los productos
 */

document.addEventListener('DOMContentLoaded', () => {
    const initMotor = () => {
        const contenedor = document.getElementById('contenedor-dinamico');
        
        if (!contenedor) return; 

        const path = window.location.pathname;
        const paginaActual = path.split("/").pop().replace(".html", "") || "index";

        console.log("Detectada categoría:", paginaActual); 

        contenedor.innerHTML = "";

        if (typeof listadoProductos === 'undefined') {
            console.error("Error: listadoProductos no definido.");
            return;
        }

        // Flexibilidad para la categoría
        const productosFiltrados = listadoProductos.filter(p => p.categoria.toLowerCase() === paginaActual.toLowerCase() || p.categoria.toLowerCase().replace(/ /g, '-') === paginaActual.toLowerCase());

        if (productosFiltrados.length === 0) {
            contenedor.innerHTML = `<p style="grid-column: 1/-1; padding: 50px; color: #666;">
                Próximamente más productos en la línea ${paginaActual.toUpperCase()}.</p>`;
            return;
        }

        productosFiltrados.forEach(producto => {
            const enlace = `producto.html?id=${producto.id}`;
            const card = `
                <a href="${enlace}" class="tarjeta-producto">
                    <div class="tarjeta-imagen">
                        <img src="${producto.imagen}" alt="${producto.nombre}">
                    </div>
                    <div class="tarjeta-info">
                        <p class="nombre-producto">${producto.nombre}</p>
                    </div>
                </a>
            `;
            contenedor.innerHTML += card;
        });
    };

    if (window.productosCargadosPromise) {
        window.productosCargadosPromise.then(initMotor);
    } else {
        initMotor();
    }
});
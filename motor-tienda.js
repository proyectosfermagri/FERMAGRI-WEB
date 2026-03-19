document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener el ID del producto desde la URL (ej: producto.html?id=4m50)
    const params = new URLSearchParams(window.location.search);
    const productoId = params.get('id');

    // 2. Buscar el producto en la base de datos (listaProductos viene de productos.js)
    const producto = listaProductos.find(p => p.id === productoId);

    // 3. Si el producto existe, inyectar los datos
    if (producto) {
        // Llenar textos simples
        document.getElementById('js-nombre').innerText = producto.nombre;
        document.getElementById('js-apellido').innerText = producto.apellido;
        document.getElementById('js-descripcion').innerText = producto.descripcion;
        document.getElementById('js-presentacion').innerText = producto.presentacion;

        // Llenar la dosis (usamos innerHTML para que reconozca las negritas <strong>)
        document.getElementById('js-dosis').innerHTML = producto.dosis;

        // Llenar la imagen y el texto alternativo
        const imgElement = document.getElementById('js-imagen');
        imgElement.src = producto.imagen;
        imgElement.alt = `Fermagri - ${producto.nombre} ${producto.apellido}`;

        // Configurar los enlaces de los botones PDF
        document.getElementById('js-ficha').href = producto.ficha;
        document.getElementById('js-seguridad').href = producto.seguridad;

        // Cambiar el título de la pestaña del navegador
        document.title = `${producto.nombre} ${producto.apellido} | Fermagri`;

    } else {
        // Si el ID no existe o no se encuentra, mostrar mensaje de error o redirigir
        console.error("Producto no encontrado");
        document.querySelector('.contenedor-producto').innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <h2>Lo sentimos, el producto no existe.</h2>
                <a href="index.html" class="btn-pdf">Volver al catálogo</a>
            </div>
        `;
    }
});
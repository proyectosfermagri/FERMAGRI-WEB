// Función principal de dibujo
function mostrarProductos(filtro = 'Todos') {
    const contenedor = document.getElementById('contenedor-galeria');
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const filtroNormalizado = filtro.toLowerCase().trim();

    const lista = (filtro === 'Todos') 
        ? listadoProductos 
        : listadoProductos.filter(p => {
            const nombre = p.nombre.toLowerCase();
            const categoria = p.categoria.toLowerCase();
            const descripcion = p.descripcion.join(" ").toLowerCase();
            const concentracion = p.concentracion.toLowerCase();
            
            return categoria === filtroNormalizado || 
                   nombre.includes(filtroNormalizado) ||
                   descripcion.includes(filtroNormalizado) ||
                   concentracion.includes(filtroNormalizado);
        });

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="no-resultados-container">
                <i class="fas fa-search-minus no-res-icon"></i>
                <h3>No encontramos lo que buscas</h3>
                <p>Prueba con otros términos o explora nuestras categorías.</p>
                <button onclick="mostrarProductos('Todos')" class="btn-ver-todo">Ver todo el catálogo</button>
            </div>
        `;
        return;
    }

    lista.forEach(p => {
        contenedor.innerHTML += `
            <div class="producto-card">
                <div class="card-imagen">
                    <img src="${p.imagen}" alt="${p.nombre}">
                </div>
                <h3>${p.nombre}</h3>
                <p>${p.presentacion}</p>
                <a href="producto.html?id=${p.id}" class="btn-ver-mas">Ver Detalle</a>
            </div>
        `;
    });
}

// Lógica de los botones y carga inicial
document.addEventListener('DOMContentLoaded', () => {
    const initGaleria = () => {
        const params = new URLSearchParams(window.location.search);
        const catUrl = params.get('cat') || 'Todos';

        // 1. Carga inicial
        mostrarProductos(catUrl);

        // 2. Activar botones de filtro
        document.querySelectorAll('.btn-filtro').forEach(boton => {
            // Marcar activo si coincide con la URL
            if(boton.getAttribute('data-categoria') === catUrl) boton.classList.add('active');

            boton.addEventListener('click', (e) => {
                const cat = e.currentTarget.getAttribute('data-categoria');
                
                // Cambiar título
                const titulo = document.getElementById('titulo-categoria');
                if (titulo) {
                    titulo.textContent = cat === 'Todos' ? "NUESTROS PRODUCTOS" : "FERTILIZANTES " + cat.toUpperCase();
                }

                // Cambiar clase activa en botones
                document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');

                mostrarProductos(cat);
            });
        });
    };

    if (window.productosCargadosPromise) {
        window.productosCargadosPromise.then(initGaleria).catch(err => console.error("Error cargando productos para galeria:", err));
    } else {
        initGaleria();
    }
});
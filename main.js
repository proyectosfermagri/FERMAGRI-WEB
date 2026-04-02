/* --- FERMAGRI: MAIN JAVASCRIPT UNIFICADO --- */

// 0. INICIALIZACIÓN DE SUPABASE (Global)
if (typeof supabase !== 'undefined') {
    window.sb = supabase.createClient(
        "https://bfwqmekquomqkydrxwvm.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmd3FtZWtxdW9tcWt5ZHJ4d3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTEzMjIsImV4cCI6MjA4OTQ2NzMyMn0.Tatgp8Gs_5DN-zvmoWjW5IuhbrRQhMtCOxHFCwguHl0"
    );
}
// 0.1 UTILIDADES GLOBALES
window.normalizeText = function(str) {
    if (!str) return "";
    return str.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
};

// 1. CARGA DE COMPONENTES (Header, Footer, etc.)
window.cargarComponente = function(id, archivo) {
    const placeholder = document.getElementById(id);
    if (!placeholder) return;

    fetch(archivo)
        .then(response => {
            if (!response.ok) throw new Error(`Error al cargar ${archivo}`);
            return response.text();
        })
        .then(data => {
            placeholder.innerHTML = data;
            
            // Si es el header, ejecutamos la lógica de "link activo"
            if (id === 'header-placeholder' || id === 'header') {
                const currentPage = window.location.pathname.split("/").pop() || "index.html";
                const menuLinks = document.querySelectorAll('.nav-menu a');

                menuLinks.forEach(link => {
                    // Comparamos el href con el nombre de la página actual
                    if (link.getAttribute('href') === currentPage) {
                        link.classList.add('activo');
                    }
                });
            }
        })
        .catch(error => console.error('Error en cargarComponente:', error));
};

// 2. BÚSQUEDA GLOBAL (Desktop, Móvil y Hero)
window.ejecutarBusqueda = function(event) {
    if (!event || event.key === 'Enter') {
        if (event && event.preventDefault) event.preventDefault();

        const inputHeader = document.getElementById('inputBuscador');
        const termino = inputHeader ? inputHeader.value.trim() : "";

        if (termino === "") return;
        
        // Verificamos si existe la sección de resultados locales (estamos en el Index)
        if (document.getElementById('sec-resultados-busqueda')) {
            window.mostrarResultadosBusqueda(termino);
        } else {
            window.location.href = `productos.html?buscar=${encodeURIComponent(termino)}`;
        }
    }
};

window.ejecutarBusquedaMobile = function() {
    const inputMobile = document.getElementById('inputBuscadorMobile');
    const termino = inputMobile ? inputMobile.value.trim() : "";
    
    if (termino === "") return;

    // Verificamos si existe la sección de resultados locales (estamos en el Index)
    if (document.getElementById('sec-resultados-busqueda')) {
        // Cerrar menú móvil si está abierto
        const navMenu = document.querySelector('.nav-menu');
        const btnMenu = document.getElementById('hamburger');
        if (navMenu) navMenu.classList.remove('active');
        if (btnMenu) btnMenu.classList.remove('active');
        
        window.mostrarResultadosBusqueda(termino);
    } else {
        window.location.href = `productos.html?buscar=${encodeURIComponent(termino)}`;
    }
};

window.ejecutarBusquedaHero = function(event) {
    // Si no hay evento (fue clic) o es la tecla Enter
    if (!event || event.key === 'Enter') {
        const inputHero = document.getElementById('inputBuscadorCelular');
        const termino = inputHero ? inputHero.value.trim() : "";
        
        if (termino === "") return;
        
        // Si estamos en el Index (donde existe la sección), mostramos resultados locales
        if (document.getElementById('sec-resultados-busqueda')) {
            window.mostrarResultadosBusqueda(termino);
        } else {
            // Si por alguna razón estamos en otra página, redirigimos a productos
            window.location.href = `productos.html?buscar=${encodeURIComponent(termino)}`;
        }
    }
};

// 2.1 LÓGICA DE MOSTRAR RESULTADOS EN EL INDEX
window.mostrarResultadosBusqueda = async function(termino) {
    const secResultados = document.getElementById('sec-resultados-busqueda');
    const contenedor = document.getElementById('contenedor-resultados-busqueda');
    const tituloBusqueda = document.getElementById('titulo-busqueda');

    if (!secResultados || !contenedor) return;

    // Mostrar sección y scroll
    secResultados.style.display = 'block';
    secResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #418431;"></i><p>Buscando productos...</p></div>';

    try {
        if (!window.sb) throw new Error("Supabase no inicializado");

        const { data, error } = await window.sb.from('productos').select('*');
        if (error) throw error;

        const term = window.normalizeText(termino);
        const resultados = data.filter(p => {
            const nombre = window.normalizeText(p.nombre);
            const desc = window.normalizeText(Array.isArray(p.descripcion) ? p.descripcion.join(" ") : p.descripcion);
            const cat = window.normalizeText(p.categoria);
            const conc = window.normalizeText(p.concentracion);
            return nombre.includes(term) || desc.includes(term) || cat.includes(term) || conc.includes(term);
        });

        if (resultados.length === 0) {
            contenedor.innerHTML = `
                <div class="no-resultados-container">
                    <i class="fas fa-search-minus no-res-icon"></i>
                    <h3>No encontramos lo que buscas</h3>
                    <p>Prueba con otros términos o productos similares.</p>
                </div>`;
        } else {
            contenedor.innerHTML = "";
            resultados.forEach(p => {
                const card = document.createElement('div');
                card.className = 'producto-card';
                card.innerHTML = `
                    <div style="background: #f9f9f9; width: 100%; display: flex; align-items: center; justify-content: center; border-radius: 12px 12px 0 0;">
                        <img src="${p.imagen}" alt="${p.nombre}">
                    </div>
                    <h3>${p.nombre}</h3>
                    <p>${p.presentacion || 'Verificado por Fermagri'}</p>
                    <a href="producto.html?id=${p.id}" class="btn-detalle">Ver Detalle</a>
                `;
                contenedor.appendChild(card);
            });
        }
    } catch (err) {
        console.error("Error en búsqueda:", err);
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Error al conectar con la base de datos.</p>';
    }
};

window.limpiarBusqueda = function() {
    const secResultados = document.getElementById('sec-resultados-busqueda');
    const inputs = ['inputBuscador', 'inputBuscadorMobile', 'inputBuscadorCelular'];
    
    inputs.forEach(id => {
        const inp = document.getElementById(id);
        if (inp) inp.value = "";
    });

    if (secResultados) {
        secResultados.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// 3. DELEGACIÓN DE EVENTOS (Menú Hamburguesa)
// Usamos delegación en el document para que funcione aunque el header se cargue después
document.addEventListener('click', (e) => {
    const btnMenu = e.target.closest('#hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Caso A: Clic en el botón hamburguesa
    if (btnMenu) {
        e.preventDefault();
        if (navMenu) {
            navMenu.classList.toggle('active');
            btnMenu.classList.toggle('active');
        }
    } 
    // Caso B: Clic fuera del menú o del botón (para cerrar)
    else if (navMenu && navMenu.classList.contains('active')) {
        if (!navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            const btn = document.getElementById('hamburger');
            if (btn) btn.classList.remove('active');
        }
    }
});

// 4. INICIALIZACIÓN AUTOMÁTICA
document.addEventListener('DOMContentLoaded', () => {
    // Intentamos cargar los placeholders comunes si existen
    if (document.getElementById('header-placeholder')) {
        window.cargarComponente('header-placeholder', 'header.html');
    }
    if (document.getElementById('footer-placeholder')) {
        window.cargarComponente('footer-placeholder', 'footer.html');
    }

    // 5. LÓGICA DEL SLIDER (Ken Burns)
    let slideIndex = 0;
    let slideInterval;
    let slides = document.querySelectorAll('.slide');
    let dots = document.querySelectorAll('.dot');

    async function initDynamicSlider() {
        if (!document.querySelector('.slider')) return;

        // Intentar cargar desde Supabase
        if (window.sb) {
            const { data, error } = await window.sb.from('slides').select('*').order('orden', { ascending: true });
            
            if (!error && data && data.length > 0) {
                const sliderContainer = document.querySelector('.slider');
                const dotsContainer = document.querySelector('.slider-dots');
                
                if (sliderContainer && dotsContainer) {
                    sliderContainer.innerHTML = '';
                    dotsContainer.innerHTML = '';

                    data.forEach((s, idx) => {
                        // Crear Slide
                        const slideDiv = document.createElement('div');
                        slideDiv.className = `slide ${idx === 0 ? 'active' : ''}`;
                        slideDiv.innerHTML = `
                            <div class="slide-bg" style="background-image: linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('${s.image_url}');"></div>
                            <div class="hero-content">
                                <h1>${s.title}</h1>
                                <p>${s.subtitle || ''}</p>
                                ${s.button_text ? `<a href="${s.button_link || '#'}" class="cta-button">${s.button_text}</a>` : ''}
                            </div>
                        `;
                        sliderContainer.appendChild(slideDiv);

                        // Crear Dot
                        const dotSpan = document.createElement('span');
                        dotSpan.className = `dot ${idx === 0 ? 'active' : ''}`;
                        dotSpan.onclick = () => window.currentSlide(idx);
                        dotsContainer.appendChild(dotSpan);
                    });

                    // Re-capturar elementos actualizados
                    slides = document.querySelectorAll('.slide');
                    dots = document.querySelectorAll('.dot');
                }
            }
        }

        // Iniciar slider con lo que haya (Supabase o Hardcoded)
        if (slides.length > 0) {
            showSlide(slideIndex);
            if (window.innerWidth > 768) startTimer();
        }
    }

    function showSlide(n) {
        if (slides.length === 0) return;
        
        slideIndex = n;
        if (slideIndex >= slides.length) slideIndex = 0;
        if (slideIndex < 0) slideIndex = slides.length - 1;

        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        if (slides[slideIndex]) slides[slideIndex].classList.add('active');
        if (dots[slideIndex]) dots[slideIndex].classList.add('active');
    }

    function nextSlide() {
        slideIndex++;
        showSlide(slideIndex);
    }

    window.currentSlide = function(n) {
        slideIndex = n;
        showSlide(slideIndex);
        resetTimer();
    };

    function startTimer() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 7000);
    }

    function resetTimer() {
        clearInterval(slideInterval);
        startTimer();
    }

    // Ejecutar inicialización
    initDynamicSlider();
});
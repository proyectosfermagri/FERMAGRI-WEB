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

// 2. BÚSQUEDA GLOBAL (Desktop y Móvil)
window.ejecutarBusqueda = function(event) {
    if (!event || event.key === 'Enter') {
        if (event && event.preventDefault) event.preventDefault();

        const inputHeader = document.getElementById('inputBuscador');
        const termino = inputHeader ? inputHeader.value.trim() : "";

        if (termino === "") return;
        window.location.href = `productos.html?buscar=${encodeURIComponent(termino)}`;
    }
};

window.ejecutarBusquedaMobile = function() {
    const inputMobile = document.getElementById('inputBuscadorMobile');
    const termino = inputMobile ? inputMobile.value.trim() : "";
    
    if (termino === "") return;
    window.location.href = `productos.html?buscar=${encodeURIComponent(termino)}`;
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
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');

    function showSlide(n) {
        if (slides.length === 0) return;
        
        slideIndex = n;
        if (slideIndex >= slides.length) slideIndex = 0;
        if (slideIndex < 0) slideIndex = slides.length - 1;

        // Limpiar todas las clases active
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Activar el slide y el punto correspondiente
        slides[slideIndex].classList.add('active');
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
        slideInterval = setInterval(nextSlide, 7000); // 7 segundos por slide
    }

    function resetTimer() {
        clearInterval(slideInterval);
        startTimer();
    }

    if (slides.length > 0) {
        showSlide(slideIndex);
        // Solo activar el slider automático en escritorio
        if (window.innerWidth > 768) {
            startTimer();
        }
    }
});
/**
 * FERMAGRI CHATBOT ELITE (V2 - Robusta)
 */

(function() {
    console.log("Fermagri Bot: Inicializando...");

    const BOT_CONFIG = {
        name: "Asistente Fermagri",
        centralWhatsApp: "593987654321", 
        welcomeMsg: "¡Hola! Bienvenido a Fermagri 🌿. Soy tu asistente virtual inteligente. ¿En qué podemos ayudarte hoy?",
        technicalMsg: "Excelente. Contamos con ingenieros agrónomos listos para apoyarte. ¿Qué tipo de soporte necesitas?",
        sourceSearchMsg: "Fermagri utiliza tecnología de vanguardia. ¿Qué **fuente nutricional** buscas hoy? (p. ej: Nitrógeno, Azufre, Boro)",
        cropAdvisoryMsg: "Entendido. Para darte el mejor servicio, por favor cuéntanos brevemente tu cultivo y tu duda:",
    };

    let distributors = [];
    let products = [];
    let currentMode = 'menu';

    // Inyectar HTML
    const botHTML = `
        <div class="fermagri-bot-container">
            <div id="bot-window" class="bot-window" style="display:none;">
                <div class="bot-header">
                    <img src="logo_fermagri.png" alt="Bot" onerror="this.src='https://cdn-icons-png.flaticon.com/512/4712/4712035.png'">
                    <div class="bot-info">
                        <h4>${BOT_CONFIG.name}</h4>
                        <p>En línea • Respuesta rápida</p>
                    </div>
                </div>
                <div id="bot-body" class="bot-body"></div>
                <div id="bot-input-area" class="bot-input-area" style="display:none;">
                    <div class="bot-search-box">
                        <input type="text" id="bot-chat-input" placeholder="Escribe aquí...">
                        <button id="bot-send-btn"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>
                <div class="bot-footer">Tecnología Fermagri © 2026</div>
            </div>
            <div id="bot-bubble" class="bot-bubble">
                <i class="fab fa-whatsapp"></i>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', botHTML);

    const bubble = document.getElementById('bot-bubble');
    const windowEl = document.getElementById('bot-window');
    const body = document.getElementById('bot-body');
    const inputArea = document.getElementById('bot-input-area');
    const chatInput = document.getElementById('bot-chat-input');
    const sendBtn = document.getElementById('bot-send-btn');

    // Restrict WhatsApp bubble to Homepage on Mobile
    if (window.innerWidth <= 768) {
        const path = window.location.pathname.toLowerCase();
        if (!path.endsWith('/') && !path.endsWith('index.html')) {
            bubble.style.display = 'none';
        }
    }

    // Funciones de Flujo (Exportadas al objeto global para los onclicks de los botones inyectados)
    window.botFlow = {
        toggle: () => {
            const isOpen = windowEl.style.display === 'flex';
            windowEl.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen && body.children.length === 0) {
                botFlow.addMsg(BOT_CONFIG.welcomeMsg);
                botFlow.showMainMenu();
                loadInitialData();
            }
        },

        addMsg: (text, type = 'bot') => {
            const div = document.createElement('div');
            div.className = `bot-msg msg-${type}`;
            div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            body.appendChild(div);
            body.scrollTop = body.scrollHeight;
        },

        showMainMenu: () => {
            const div = document.createElement('div');
            div.className = "msg-buttons";
            div.innerHTML = `
                <button class="bot-btn" onclick="botFlow.startBuy()">🛒 Quiero comprar <i class="fas fa-chevron-right"></i></button>
                <button class="bot-btn" onclick="botFlow.startTechnical()">🛠️ Soporte Técnico <i class="fas fa-chevron-right"></i></button>
            `;
            body.appendChild(div);
            body.scrollTop = body.scrollHeight;
        },

        startBuy: () => {
            botFlow.addMsg("🛒 Quiero comprar productos.", 'user');
            setTimeout(() => {
                const provinces = [...new Set(distributors.map(d => d.provincia))].sort();
                botFlow.addMsg("¡Perfecto! Ayudamos a alimentar al mundo. ¿En qué **provincia** te encuentras?");
                
                const select = document.createElement('select');
                select.className = "province-select";
                select.innerHTML = `<option value="">-- Elige provincia --</option>` + 
                                  provinces.map(p => `<option value="${p}">${p}</option>`).join('');
                select.onchange = (e) => botFlow.handleBuyProvince(e.target.value);
                body.appendChild(select);
            }, 400);
        },

        handleBuyProvince: (prov) => {
            if (!prov) return;
            botFlow.addMsg(`Me encuentro en ${prov}`, 'user');
            setTimeout(() => {
                const matches = distributors.filter(d => d.provincia === prov);
                if (matches.length > 0) {
                    botFlow.addMsg(`Aquí tienes distribuidores autorizados en ${prov}:`);
                    matches.forEach(d => {
                        const btn = document.createElement('button');
                        btn.className = "bot-btn";
                        btn.style.borderColor = "#25d366";
                        
                        // Normalización de número para Ecuador (593)
                        let rawPhone = d.whatsapp.replace(/\D/g, "");
                        if (rawPhone.startsWith('0')) rawPhone = '593' + rawPhone.substring(1);
                        if (!rawPhone.startsWith('593')) rawPhone = '593' + rawPhone;
                        
                        btn.innerHTML = `<span><i class="fab fa-whatsapp"></i> ${d.nombre}</span> <i class="fas fa-external-link-alt"></i>`;
                        btn.onclick = () => window.open(`https://wa.me/${rawPhone}?text=Hola, te contacto desde la web de Fermagri. Busco comprar productos en ${prov}.`, '_blank');
                        body.appendChild(btn);
                    });
                } else {
                    botFlow.addMsg("No tenemos distribuidores directos allí. Conéctate con nuestra central.");
                    botFlow.startCentralLink();
                }
            }, 400);
        },

        startTechnical: () => {
            botFlow.addMsg("🛠️ Necesito Soporte Técnico.", 'user');
            setTimeout(() => {
                botFlow.addMsg(BOT_CONFIG.technicalMsg);
                const div = document.createElement('div');
                div.className = "msg-buttons";
                div.innerHTML = `
                    <button class="bot-btn" onclick="botFlow.startAdvisory()">🌱 Asesoría a cultivos <i class="fas fa-chevron-right"></i></button>
                    <button class="bot-btn" onclick="botFlow.startSearchSource()">📦 Por Fuente Nutricional <i class="fas fa-chevron-right"></i></button>
                `;
                body.appendChild(div);
            }, 400);
        },

        startAdvisory: () => {
            botFlow.addMsg("🌱 Necesito asesoría especializada.", 'user');
            currentMode = 'advisory_input';
            setTimeout(() => {
                botFlow.addMsg(BOT_CONFIG.cropAdvisoryMsg);
                inputArea.style.display = 'block';
                chatInput.placeholder = "Describe tu cultivo o duda...";
                chatInput.focus();
            }, 400);
        },

        startSearchSource: () => {
            botFlow.addMsg("📦 Busco por Fuente Nutricional.", 'user');
            currentMode = 'search_source';
            setTimeout(() => {
                botFlow.addMsg(BOT_CONFIG.sourceSearchMsg);
                inputArea.style.display = 'block';
                chatInput.placeholder = "Escriba aquí (ej: Azufre)...";
                chatInput.focus();
            }, 400);
        },

        handleSearch: (query) => {
            if (!query) return;
            botFlow.addMsg(`Busco: ${query}`, 'user');
            
            const results = products.filter(p => {
                const q = window.normalizeText(query);
                const name = window.normalizeText(p.nombre);
                const cat = window.normalizeText(p.categoria);
                const desc = window.normalizeText(Array.isArray(p.descripcion) ? p.descripcion.join(" ") : p.descripcion);
                const conc = window.normalizeText(p.concentracion);

                return name.includes(q) || desc.includes(q) || conc.includes(q) || cat.includes(q);
            });

            setTimeout(() => {
                if (results.length > 0) {
                    botFlow.addMsg(`He encontrado estos productos:`);
                    results.slice(0, 3).forEach(p => {
                        const card = document.createElement('div');
                        card.className = "mini-product-card";
                        card.innerHTML = `
                            <img src="${p.imagen || 'ICONOS/icono%20especializados.webp'}" alt="${p.nombre}" onerror="this.src='ICONOS/icono%20especializados.webp'">
                            <div class="mini-product-info">
                                <h5>${p.nombre || 'Producto Fermagri'}</h5>
                                <p>${p.categoria || 'Complemento'}</p>
                            </div>
                            <a href="producto.html?id=${p.id}" class="btn-mini-detail">Ver Detalle</a>
                        `;
                        body.appendChild(card);
                    });
                    if (results.length > 3) {
                        botFlow.addMsg(`Hay ${results.length - 3} más. <a href="productos.html?buscar=${query}" style="color:#1a4d2e; font-weight:bold;">Ver catálogo</a>`);
                    }
                } else {
                    botFlow.addMsg("No encontramos una fuente nutricional exacta. ¿Deseas hablar con un consultor?");
                    botFlow.startCentralLink();
                }
                // Asegurar scroll al final después de que se rendericen las tarjetas
                setTimeout(() => { body.scrollTop = body.scrollHeight; }, 100);
            }, 500);
        },

        startCentralLink: () => {
            const btn = document.createElement('button');
            btn.className = "bot-btn";
            btn.style.borderColor = "#25d366";
            btn.innerHTML = `<span><i class="fab fa-whatsapp"></i> Chat con Oficina Central</span> <i class="fas fa-external-link-alt"></i>`;
            btn.onclick = () => window.open(`https://wa.me/${BOT_CONFIG.centralWhatsApp}?text=Hola Fermagri, necesito asesoría técnica.`, '_blank');
            body.appendChild(btn);
        }
    };

    // Eventos
    bubble.onclick = botFlow.toggle;
    sendBtn.onclick = handleUserInput;
    chatInput.onkeypress = (e) => { if (e.key === 'Enter') handleUserInput(); };

    function handleUserInput() {
        const val = chatInput.value.trim();
        if (!val) return;
        chatInput.value = "";

        if (currentMode === 'search_source') {
            botFlow.handleSearch(val);
        } else if (currentMode === 'advisory_input') {
            botFlow.addMsg("¡Perfecto! Preparando tu consulta...", 'bot');
            
            // Normalización central
            let cPhone = BOT_CONFIG.centralWhatsApp.replace(/\D/g, "");
            if (cPhone.startsWith('0')) cPhone = '593' + cPhone.substring(1);
            if (!cPhone.startsWith('593')) cPhone = '593' + cPhone;

            setTimeout(() => {
                const msg = encodeURIComponent(`Hola experto Fermagri, tengo una consulta sobre mi cultivo: ${val}`);
                window.open(`https://wa.me/${cPhone}?text=${msg}`, '_blank');
                botFlow.addMsg("Se abrirá WhatsApp con tu mensaje listo. ¡Solo dale a enviar!");
                inputArea.style.display = 'none';
                botFlow.showMainMenu();
            }, 800);
        }
    }

    async function loadInitialData() {
        console.log("Fermagri Bot: Cargando datos...");
        if (distributors.length > 0) return;
        
        const client = window.sb || (window.supabase ? window.supabase : null);
        if (!client) {
            console.warn("Fermagri Bot: Supabase no detectado aún. Reintentando...");
            setTimeout(loadInitialData, 1000);
            return;
        }

        try {
            const [dRes, pRes] = await Promise.all([
                client.from('distribuidores').select('*'),
                client.from('productos').select('*')
            ]);
            distributors = dRes.data || [];
            products = pRes.data || [];
            console.log("Fermagri Bot: Datos cargados correctamente.");
        } catch (e) { console.error("Fermagri Bot: Error de carga", e); }
    }

})();

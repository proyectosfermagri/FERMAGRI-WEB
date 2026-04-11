/**
 * FERMAGRI CHATBOT
 * Intake guiado para atencion al cliente con resumen a WhatsApp.
 */

(function () {
    const BOT_CONFIG = {
        name: "Atencion Fermagri",
        centralWhatsApp: "+34657663133",
        welcomeMsg: "Bienvenido a Fermagri. Soy el asistente virtual de atencion. En menos de un minuto voy a organizar tu solicitud para derivarte por WhatsApp con la persona indicada.",
    };

    const state = {
        booted: false,
        step: "menu",
        customerName: "",
        customerType: "",
        province: "",
        category: "",
        urgency: "",
        detail: "",
    };

    const escapeHtml = (value) => String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const openWhatsApp = (message) => {
        const phone = BOT_CONFIG.centralWhatsApp.replace(/\D/g, "");
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const botHTML = `
        <div class="fermagri-bot-container">
            <div id="bot-window" class="bot-window" style="display:none;">
                <div class="bot-header">
                    <div class="bot-header-main">
                        <img src="logo_fermagri.png" alt="Fermagri" onerror="this.src='https://cdn-icons-png.flaticon.com/512/4712/4712035.png'">
                        <div class="bot-info">
                            <h4>${BOT_CONFIG.name}</h4>
                            <p>Clasificacion previa antes de WhatsApp</p>
                        </div>
                    </div>
                    <button id="bot-close-btn" class="bot-icon-btn" type="button" aria-label="Cerrar chat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="bot-body" class="bot-body"></div>
                <div id="bot-input-area" class="bot-input-area" style="display:none;">
                    <div class="bot-search-box">
                        <input type="text" id="bot-chat-input" placeholder="Escribe aqui...">
                        <button id="bot-send-btn" type="button" aria-label="Enviar">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
                <div class="bot-footer">
                    <button id="bot-restart-btn" class="bot-footer-link" type="button">Empezar de nuevo</button>
                </div>
            </div>
            <button id="bot-bubble" class="bot-bubble" type="button" aria-label="Abrir chat de atencion">
                <i class="fab fa-whatsapp"></i>
            </button>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", botHTML);

    const bubble = document.getElementById("bot-bubble");
    const windowEl = document.getElementById("bot-window");
    const body = document.getElementById("bot-body");
    const inputArea = document.getElementById("bot-input-area");
    const chatInput = document.getElementById("bot-chat-input");
    const sendBtn = document.getElementById("bot-send-btn");
    const closeBtn = document.getElementById("bot-close-btn");
    const restartBtn = document.getElementById("bot-restart-btn");

    if (window.innerWidth <= 768) {
        const path = window.location.pathname.toLowerCase();
        if (!path.endsWith("/") && !path.endsWith("index.html")) {
            bubble.style.display = "none";
        }
    }

    const scrollToBottom = () => {
        body.scrollTop = body.scrollHeight;
    };

    const setInput = (visible, placeholder = "Escribe aqui...") => {
        inputArea.style.display = visible ? "block" : "none";
        chatInput.value = "";
        chatInput.placeholder = placeholder;
        if (visible) chatInput.focus();
    };

    const addMsg = (text, type = "bot") => {
        const div = document.createElement("div");
        div.className = `bot-msg msg-${type}`;
        div.innerHTML = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        body.appendChild(div);
        scrollToBottom();
    };

    const addActions = (buttons) => {
        const wrap = document.createElement("div");
        wrap.className = "msg-buttons";
        buttons.forEach((item) => {
            const btn = document.createElement("button");
            btn.className = `bot-btn ${item.variant || ""}`.trim();
            btn.type = "button";
            btn.textContent = item.label;
            btn.onclick = item.onClick;
            wrap.appendChild(btn);
        });
        body.appendChild(wrap);
        scrollToBottom();
    };

    const buildSummary = () => {
        const fields = [
            "Hola. Te comparto un nuevo caso recibido desde el chatbot web de Fermagri.",
            "",
            "Resumen del caso:",
            `Nombre: ${state.customerName || "No indicado"}`,
            `Tipo de contacto: ${state.customerType || "No indicado"}`,
            `Provincia: ${state.province || "No indicada"}`,
            `Categoria: ${state.category || "No indicada"}`,
            `Prioridad percibida: ${state.urgency || "No indicada"}`,
            `Detalle del cliente: ${state.detail || "No indicado"}`,
        ];
        return fields.join("\n");
    };

    const showCustomerTypeStep = () => {
        state.step = "customer_type";
        addMsg("Para orientarte de forma precisa, indícame qué tipo de contacto eres.");
        addActions([
            {
                label: "Productor",
                onClick: () => selectCustomerType("Productor"),
            },
            {
                label: "Distribuidor",
                onClick: () => selectCustomerType("Distribuidor"),
            },
            {
                label: "Tecnico / asesor",
                onClick: () => selectCustomerType("Tecnico / asesor"),
            },
            {
                label: "Otro",
                onClick: () => selectCustomerType("Otro"),
            },
        ]);
        setInput(false);
    };

    const showUrgencyStep = () => {
        state.step = "urgency";
        addMsg("Gracias. Indícame qué nivel de prioridad tiene tu caso.");
        addActions([
            {
                label: "Alta",
                onClick: () => selectUrgency("Alta"),
            },
            {
                label: "Media",
                onClick: () => selectUrgency("Media"),
            },
            {
                label: "Baja",
                onClick: () => selectUrgency("Baja"),
            },
        ]);
        setInput(false);
    };

    const showCategoryStep = () => {
        state.step = "category";
        addMsg("Perfecto. Ahora selecciona el tema principal de tu consulta.");
        addActions([
            {
                label: "Compra / cotizacion",
                onClick: () => selectCategory("Compra / cotizacion"),
            },
            {
                label: "Distribuidor / ubicacion",
                onClick: () => selectCategory("Distribuidor / ubicacion"),
            },
            {
                label: "Producto / catalogo",
                onClick: () => selectCategory("Producto / catalogo"),
            },
            {
                label: "Soporte tecnico",
                onClick: () => selectCategory("Soporte tecnico"),
            },
            {
                label: "Otro tema",
                onClick: () => selectCategory("Otro tema"),
            },
        ]);
        setInput(false);
    };

    const selectCustomerType = (customerType) => {
        state.customerType = customerType;
        addMsg(customerType, "user");
        state.step = "province";
        addMsg("Gracias. Ahora indícame tu **provincia**.");
        setInput(true, "Escribe tu provincia");
    };

    const selectCategory = (category) => {
        state.category = category;
        addMsg(category, "user");
        showUrgencyStep();
    };

    const selectUrgency = (urgency) => {
        state.urgency = urgency;
        addMsg(urgency, "user");
        state.step = "detail";
        addMsg("Muy bien. **Describe brevemente tu caso** para que nuestro equipo lo reciba con contexto claro desde el inicio.");
        setInput(true, "Describe aqui tu caso");
    };

    const showSummaryStep = () => {
        const summary = buildSummary();
        addMsg("Listo. Ya tengo la informacion necesaria para derivarte de forma ordenada.");
        addMsg(`**Resumen preparado para atencion:**<br>${escapeHtml(summary).replace(/\n/g, "<br>")}`);
        addActions([
            {
                label: "Enviar por WhatsApp",
                variant: "bot-btn-whatsapp",
                onClick: () => openWhatsApp(summary),
            },
            {
                label: "Empezar de nuevo",
                onClick: resetConversation,
            },
        ]);
        setInput(false);
        state.step = "done";
    };

    const showWelcome = () => {
        addMsg(BOT_CONFIG.welcomeMsg);
        addActions([
            {
                label: "Comenzar",
                onClick: () => {
                    addMsg("Quiero iniciar.", "user");
                    state.step = "name";
                    addMsg("Empecemos. ¿Cuál es tu **nombre**?");
                    setInput(true, "Escribe tu nombre");
                },
            },
            {
                label: "Ir directo a WhatsApp",
                variant: "bot-btn-whatsapp",
                onClick: () => openWhatsApp("Hola Fermagri. Quisiera comunicarme con el area de atencion al cliente."),
            },
        ]);
    };

    const resetConversation = () => {
        state.step = "menu";
        state.customerName = "";
        state.customerType = "";
        state.province = "";
        state.category = "";
        state.urgency = "";
        state.detail = "";
        body.innerHTML = "";
        setInput(false);
        showWelcome();
    };

    const toggle = () => {
        const isOpen = windowEl.style.display === "flex";
        windowEl.style.display = isOpen ? "none" : "flex";
        if (!isOpen && !state.booted) {
            state.booted = true;
            resetConversation();
        }
    };

    const handleUserInput = () => {
        const value = chatInput.value.trim();
        if (!value) return;

        chatInput.value = "";
        addMsg(escapeHtml(value), "user");

        if (state.step === "name") {
            state.customerName = value;
            showCustomerTypeStep();
            return;
        }

        if (state.step === "province") {
            state.province = value;
            showCategoryStep();
            return;
        }

        if (state.step === "detail") {
            state.detail = value;
            showSummaryStep();
        }
    };

    bubble.onclick = toggle;
    closeBtn.onclick = toggle;
    restartBtn.onclick = resetConversation;
    sendBtn.onclick = handleUserInput;
    chatInput.onkeypress = (event) => {
        if (event.key === "Enter") handleUserInput();
    };
})();


const cropsData = {
    "Arroz": {
        products: {
            gold: { name: "15-15-15 PREMIUN", desc: "Nutrición integral equilibrada. Ideal para el desarrollo inicial y macollamiento." },
            standard: { name: "Nutricultivo Desarrollo", desc: "Opción edáfica para potenciar el vigor y crecimiento del cultivo." }
        },
        stages: [
            { name: "Establecimiento", weeks: 0, recommendations: "Aplicar Nutricultivo Siembra o Siembra Premiun para un arranque vigoroso.", sacos_ha: 3, nutrients: ["Fósforo (P)", "Nitrógeno (N)"], simples: ["Nutricultivo Siembra", "Siembra Premiun"] },
            { name: "Macollamiento", weeks: 3, recommendations: "Refuerzo con Master Protec N46 para crecimiento inicial acelerado.", sacos_ha: 2, nutrients: ["Nitrógeno (N)"], simples: ["Master Protec N46", "Master Protec Desarrollo"] },
            { name: "Llenado de Grano", weeks: 8, recommendations: "Uso de KALIMOP para maximizar peso y calidad del grano.", sacos_ha: 2, nutrients: ["Potasio (K)"], simples: ["KALIMOP"] }
        ],
        npk_ha: { n: 120, p: 20, k: 30 }
    },
    "Maiz": {
        products: {
            gold: { name: "10-30-10 PREMIUN", desc: "Fórmula de alto fósforo para híbridos de alto potencial de rendimiento." },
            standard: { name: "Siembra Premiun", desc: "Opción especializada para el arranque de ciclos convencionales." }
        },
        stages: [
            { name: "Siembra", weeks: 0, recommendations: "Arrancador 10-30-10 PREMIUN rico en Fósforo.", sacos_ha: 4, nutrients: ["Fósforo (P)", "Nitrógeno (N)"], simples: ["10-30-10 PREMIUN", "Nutricultivo Siembra"] },
            { name: "V6 (6 Hojas)", weeks: 4, recommendations: "Aplicación de Master Protec N40 o N46 para desarrollo foliar.", sacos_ha: 3, nutrients: ["Nitrógeno (N)"], simples: ["Master Protec N40", "Master Protec N46"] },
            { name: "Floración", weeks: 8, recommendations: "Master Protec Finalizador para proteger y vigorizar en polinización.", sacos_ha: 2, nutrients: ["Potasio (K)"], simples: ["Master Protec Finalizador", "KALIMOP"] }
        ],
        npk_ha: { n: 180, p: 60, k: 90 }
    },
    "Banano": {
        products: {
            gold: { name: "Platanero Gold", desc: "Máxima asimilación específica para musáceas y racimos de exportación." },
            standard: { name: "15-15-15 PREMIUN", desc: "Nutrición base equilibrada para mantenimiento de follaje y retorno." }
        },
        stages: [
            { name: "Establecimiento", weeks: 0, recommendations: "Fundamentación radicular con Desarrollo Premiun o Nutricultivo Siembra.", sacos_ha: 5, nutrients: ["Fósforo (P)", "Calcio (Ca)"], simples: ["Desarrollo Premiun", "Nitrato de Calcio"] },
            { name: "Crecimiento", weeks: 12, recommendations: "Ciclos de nutrición con Master Protec N35 y ESTA KIESERIT.", sacos_ha: 4, nutrients: ["Nitrógeno (N)", "Magnesio (Mg)"], simples: ["Master Protec N35", "ESTA KIESERIT"] },
            { name: "Producción", weeks: 24, recommendations: "Platanero Gold o KALISOP para optimizar el ratio dedo/racimo.", sacos_ha: 6, nutrients: ["Potasio (K)"], simples: ["KALISOP Gran.", "PATENTKALI"] }
        ],
        npk_ha: { n: 400, p: 100, k: 600 }
    },
    "Cacao": {
        products: {
            gold: { name: "Fercacao Gold", desc: "Alta concentración especializada para el cuajado masivo y engrose de mazorcas." },
            standard: { name: "Nutricultivo Cacao", desc: "Producto edáfico balanceado para el mantenimiento continuo de la huerta." }
        },
        stages: [
            { name: "Desarrollo", weeks: 0, recommendations: "Nutrición equilibrada con Nutricultivo Cacao o HUMIK +.", sacos_ha: 3, nutrients: ["Nitrógeno (N)", "Fósforo (P)", "M.O."], simples: ["Nutricultivo Cacao", "HUMIK +"] },
            { name: "Floración", weeks: 52, recommendations: "Aporte con Borax Soluble y Ulexita granular para mayor cuajado.", sacos_ha: 2, nutrients: ["Fósforo (P)", "Boro (B)"], simples: ["Borax Soluble", "Ulexita granular"] },
            { name: "Cosecha", weeks: 104, recommendations: "Refuerzo Fercacao Gold para almendras con mejor peso y calidad comercial.", sacos_ha: 3, nutrients: ["Potasio (K)"], simples: ["Fercacao Gold", "KALIMOP"] }
        ],
        npk_ha: { n: 150, p: 50, k: 200 }
    },
    "Palma Africana": {
        products: {
            gold: { name: "Palmero Gold", desc: "Especializado en formación de aceite, racimos pesados y vigor de copa." },
            standard: { name: "15-15-15 PREMIUN", desc: "Nutrición continua convencional para periodos de mantenimiento." }
        },
        stages: [
            { name: "Trasplante", weeks: 0, recommendations: "Base sólida con Nutricultivo Siembra + ESTA KIESERIT.", sacos_ha: 4, nutrients: ["Fósforo (P)", "Magnesio (Mg)"], simples: ["Nutricultivo Siembra", "ESTA KIESERIT"] },
            { name: "Joven", weeks: 52, recommendations: "Aportes continuos de Master Protec N46 para desarrollo vigoroso.", sacos_ha: 3, nutrients: ["Nitrógeno (N)", "Potasio (K)"], simples: ["Master Protec N46", "KALIMOP"] },
            { name: "Adulta", weeks: 208, recommendations: "Palmero Gold y Borax para máximo rendimiento de aceite industrial.", sacos_ha: 6, nutrients: ["Potasio (K)", "Boro (B)"], simples: ["Palmero Gold", "Borax Soluble", "Ulexita granular"] }
        ],
        npk_ha: { n: 120, p: 90, k: 120 }
    },
    "Papas": {
        products: {
            gold: { name: "10-30-10 PREMIUN", desc: "Fórmula maestra para máxima tuberización gracias a su alto fósforo." },
            standard: { name: "Nutricultivo Siembra", desc: "Balance ideal para semilleros y variedades comerciales en estribación." }
        },
        stages: [
            { name: "Siembra", weeks: 0, recommendations: "Incorporar 10-30-10 PREMIUN para una tuberización masiva y uniforme.", sacos_ha: 6, nutrients: ["Fósforo (P)"], simples: ["10-30-10 PREMIUN", "Nutricultivo Siembra"] },
            { name: "Emergencia", weeks: 3, recommendations: "Master Protec N35 o N40 para rápida cobertura de surco.", sacos_ha: 3, nutrients: ["Nitrógeno (N)"], simples: ["Master Protec N35", "Master Protec N40"] },
            { name: "Llenado", weeks: 6, recommendations: "Aplicación de KALISOP Granular para calidad de piel y calibres pesados (libre de cloro).", sacos_ha: 5, nutrients: ["Potasio (K)", "Azufre (S)"], simples: ["KALISOP Gran.", "PATENTKALI"] }
        ],
        npk_ha: { n: 150, p: 300, k: 100 }
    },
    "Pitahaya": {
        products: {
            gold: { name: "8 -20-20  PREMIUN", desc: "Equilibrio ideal para mantener floración continua y elevación de grados Brix." },
            standard: { name: "15-15-15 PREMIUN", desc: "Nutrición base balanceada para cladodios en etapa ociosa." }
        },
        stages: [
            { name: "Establecimiento", weeks: 0, recommendations: "Master Protec Desarrollo para emisiones de cladodios vigorosos.", sacos_ha: 3, nutrients: ["Nitrógeno (N)"], simples: ["Master Protec Desarrollo", "Nutricultivo Desarrollo"] },
            { name: "Producción", weeks: 104, recommendations: "Aplicación de 8 -20-20 PREMIUN y Nitrato de Calcio para consistencia de fruta.", sacos_ha: 4, nutrients: ["Fósforo (P)", "Potasio (K)", "Calcio (Ca)"], simples: ["8 -20-20  PREMIUN", "Nitrato de Calcio"] },
            { name: "Post-cosecha", weeks: 110, recommendations: "MICROALGAE K+ PLUS y Solufol Multiproposito foliar para recuperación.", sacos_ha: 2, nutrients: ["Bioestimulantes", "Potasio (K)"], simples: ["MICROALGAE K+ PLUS", "Solufol Multiproposito"] }
        ],
        npk_ha: { n: 180, p: 60, k: 200 }
    },
    "Limón": {
        products: {
            gold: { name: "Desarrollo Premiun", desc: "Nutrición progresiva de alta eficiencia para estimulación continua de copa." },
            standard: { name: "15-15-15 PREMIUN", desc: "Mantenimiento general en huertos adultos contra el estrés." }
        },
        stages: [
            { name: "Brotación", weeks: 0, recommendations: "Master Protec N35 + Nitrato de Calcio para inducir brotación libre de deficiencias.", sacos_ha: 3, nutrients: ["Nitrógeno (N)", "Calcio (Ca)"], simples: ["Master Protec N35", "Nitrato de Calcio"] },
            { name: "Amarre", weeks: 20, recommendations: "PATENTKALI y Borax para amarre efectivo y calidad de jugo.", sacos_ha: 4, nutrients: ["Potasio (K)", "Magnesio (Mg)", "Boro (B)"], simples: ["PATENTKALI", "KALISOP Gran.", "Borax Soluble"] }
        ],
        npk_ha: { n: 200, p: 80, k: 200 }
    },
    "Caña de Azúcar": {
        products: {
            gold: { name: "Nutricultivo Soca", desc: "Especializado como arrancador de socas para rápidos rebrotes y vigor." },
            standard: { name: "15-15-15 PREMIUN", desc: "Soporte nutricional multietapa para renovación." }
        },
        stages: [
            { name: "Plante", weeks: 0, recommendations: "Nutricultivo Siembra o 10-30-10 PREMIUN integrado al fondo del surco.", sacos_ha: 5, nutrients: ["Fósforo (P)", "Nitrógeno (N)"], simples: ["Nutricultivo Siembra", "10-30-10 PREMIUN"] },
            { name: "Ahijamiento", weeks: 6, recommendations: "Master Protec N46 formulado para reducción de volatilización en áreas grandes.", sacos_ha: 4, nutrients: ["Nitrógeno (N)"], simples: ["Master Protec N46"] },
            { name: "Crecimiento", weeks: 20, recommendations: "KALIMOP (Muriato de Potasio) para promover síntesis máxima de sacarosa.", sacos_ha: 4, nutrients: ["Potasio (K)"], simples: ["KALIMOP"] }
        ],
        npk_ha: { n: 180, p: 80, k: 80 }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const cropSelect = document.getElementById('crop-select');
    const hectaresInput = document.getElementById('hectares');
    const btnCalculate = document.getElementById('btn-calculate');
    const resultsContainer = document.getElementById('results-content');
    const calendarContainer = document.getElementById('calendar-grid');

    function calculate() {
        const crop = cropSelect.value;
        const has = parseFloat(hectaresInput.value) || 0;
        
        if (!crop || has <= 0) {
            alert("Por favor selecciona un cultivo y cantidad de hectáreas.");
            return;
        }

        const data = cropsData[crop];
        
        // Renderizar Calendario
        calendarContainer.innerHTML = '';
        data.stages.forEach(stage => {
            const totalSacos = stage.sacos_ha * has;
            
            // Generar badges de nutrientes
            const nutrientsHtml = stage.nutrients.map(n => `<span style="display:inline-block; background:#2D5A27; color:white; font-size:0.75rem; padding: 3px 8px; border-radius: 12px; margin: 2px 4px 2px 0;">${n}</span>`).join('');
            
            // Generar texto de simples
            const simplesHtml = stage.simples.map(s => `<li>${s}</li>`).join('');

            const stageDiv = document.createElement('div');
            stageDiv.className = 'calendar-step';
            stageDiv.innerHTML = `
                <div class="step-header">
                    <span class="step-week">Etapa: ${stage.name}</span>
                </div>
                
                <div style="margin: 15px 0 10px 0;">
                    <strong style="font-size: 0.85rem; color: #64748b; text-transform: uppercase;">Nutrientes Clave:</strong><br>
                    ${nutrientsHtml}
                </div>

                <h4>Sugerencia Formulada</h4>
                <p>${stage.recommendations}</p>
                
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                    <strong style="font-size: 0.85rem; color: #64748b; text-transform: uppercase;">Alternativas Simples Fermagri:</strong>
                    <ul style="margin: 5px 0 0 20px; font-size: 0.85rem; color: #333;">
                        ${simplesHtml}
                    </ul>
                </div>

                <div class="sacos-recomendacion" style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4CAF50;">
                    <strong style="color: #2e7d32; display: block; font-size: 0.85rem;">APLICACIÓN ESTIMADA (COMPUESTOS O SIMPLES):</strong>
                    <span style="font-size: 1.1rem; font-weight: bold; color: #1b5e20;">${totalSacos} sacos</span>
                    <span style="font-size: 0.8rem; color: #666;"> para sus ${has} ha.</span>
                </div>
            `;
            calendarContainer.appendChild(stageDiv);
        });

        // Simular Cálculo NPK
        const totalN = data.npk_ha.n * has;
        const totalP = data.npk_ha.p * has;
        const totalK = data.npk_ha.k * has;

        resultsContainer.innerHTML = `
            <div class="npk-summary">
                <div class="npk-item"><strong>Nitrógeno (N) Total</strong> <span>${totalN.toLocaleString()} kg</span></div>
                <div class="npk-item"><strong>Fósforo (P) Total</strong> <span>${totalP.toLocaleString()} kg</span></div>
                <div class="npk-item"><strong>Potasio (K) Total</strong> <span>${totalK.toLocaleString()} kg</span></div>
            </div>
            
            <h3 class="recommendation-title">Plan de Fertilización Sugerido (Fermagri)</h3>
            
            <div class="product-cards">
                <div class="p-card" style="border-left-color: #f1c40f;">
                    <h5 style="color:#d35400;">OPCIÓN 1: LÍNEA GOLD (Alta Eficiencia)</h5>
                    <p><strong>Primera Elección:</strong> ${data.products.gold.name}</p>
                    <p>${data.products.gold.desc}</p>
                    <p style="margin-top:10px; font-size: 0.85rem; color: #2D5A27;"><em>* Ideal para máxima productividad y rendimiento superior del cultivo.</em></p>
                </div>
                
                <div class="p-card" style="border-left-color: #3498db;">
                    <h5 style="color:#2980b9;">OPCIÓN 2: ESPECÍFICA (Mantenimiento)</h5>
                    <p><strong>Sugerencia Alternativa:</strong> ${data.products.standard.name}</p>
                    <p>${data.products.standard.desc}</p>
                    <p style="margin-top:10px; font-size: 0.85rem; color: #34495e;"><em>* Una opción especializada balanceada con excelente relación costo-beneficio.</em></p>
                </div>

                <div class="p-card">
                    <h5>COMPLEMENTOS FOLIAR / PROTECCIÓN</h5>
                    <p>Acompañar con la línea <strong>MASTER PROTEC</strong> y <strong>SOLUBLES</strong> de Fermagri según el calendario fenológico mostrado arriba.</p>
                </div>
            </div>
        `;

        const resultsSection = document.getElementById('plan-results');
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    if (btnCalculate) {
        btnCalculate.addEventListener('click', calculate);
    }
});

// Configuración de Supabase (compartida con otros scripts)
const SUPABASE_URL = "https://bfwqmekquomqkydrxwvm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmd3FtZWtxdW9tcWt5ZHJ4d3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTEzMjIsImV4cCI6MjA4OTQ2NzMyMn0.Tatgp8Gs_5DN-zvmoWjW5IuhbrRQhMtCOxHFCwguHl0";

let cropsData = {}; // Se llenará desde Supabase

async function cargarDatosCalculadora() {
    try {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data, error } = await client
            .from('calculadora_cultivos')
            .select('*')
            .order('nombre_cultivo', { ascending: true });

        if (error) throw error;

        // Transformar formato de tabla a objeto cropsData para compatibilidad
        const transformado = {};
        data.forEach(item => {
            transformado[item.nombre_cultivo] = {
                productos_recomendados: item.productos_recomendados || [],
                stages: item.etapas,
                npk_ha: { n: item.n_ha, p: item.p_ha, k: item.k_ha },
                micro_ha: {
                    fe: item.fe_ha || 0,
                    mn: item.mn_ha || 0,
                    zn: item.zn_ha || 0,
                    cu: item.cu_ha || 0,
                    b: item.b_ha || 0,
                    mo: item.mo_ha || 0,
                    cl: item.cl_ha || 0,
                    mgo: item.mgo_ha || 0
                }
            };
        });

        cropsData = transformado;
        llenarSelectorCultivos();
    } catch (err) {
        console.error("Error cargando datos de la calculadora:", err);
    }
}

function llenarSelectorCultivos() {
    const cropSelect = document.getElementById('crop-select');
    if (!cropSelect) return;
    
    // Guardar selección actual si existe
    const currentVal = cropSelect.value;
    
    // Limpiar y llenar
    cropSelect.innerHTML = '<option value="" disabled selected>Selecciona tu cultivo</option>';
    Object.keys(cropsData).forEach(crop => {
        const option = document.createElement('option');
        option.value = crop;
        option.textContent = crop;
        cropSelect.appendChild(option);
    });
    
    if (currentVal && cropsData[currentVal]) {
        cropSelect.value = currentVal;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosCalculadora();
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
            const nutrientsHtml = stage.nutrients.map(n => `<span style="display:inline-block; background:#2D5A27; color:white; font-size:0.75rem; padding: 3px 8px; border-radius: 12px; margin: 2px 4px 2px 0;">${n}</span>`).join('');
            const simplesHtml = stage.simples.map(s => `<li>${s}</li>`).join('');

            const stageDiv = document.createElement('div');
            stageDiv.className = 'calendar-step';
            stageDiv.innerHTML = `
                <div class="step-header"><span class="step-week">Etapa: ${stage.name}</span></div>
                <div style="margin: 15px 0 10px 0;"><strong style="font-size: 0.85rem; color: #64748b; text-transform: uppercase;">Nutrientes Clave:</strong><br>${nutrientsHtml}</div>
                <h4>Sugerencia Formulada</h4>
                <p>${stage.recommendations}</p>
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                    <strong style="font-size: 0.85rem; color: #64748b; text-transform: uppercase;">Alternativas Simples Fermagri:</strong>
                    <ul style="margin: 5px 0 0 20px; font-size: 0.85rem; color: #333;">${simplesHtml}</ul>
                </div>
                <div class="sacos-recomendacion" style="margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4CAF50;">
                    <strong style="color: #2e7d32; display: block; font-size: 0.85rem;">APLICACIÓN ESTIMADA:</strong>
                    <span style="font-size: 1.1rem; font-weight: bold; color: #1b5e20;">${totalSacos} sacos</span>
                    <span style="font-size: 0.8rem; color: #666;"> para sus ${has} ha.</span>
                </div>
            `;
            calendarContainer.appendChild(stageDiv);
        });

        // Cálculo NPK y Micros
        const totalN = data.npk_ha.n * has;
        const totalP = data.npk_ha.p * has;
        const totalK = data.npk_ha.k * has;
        const micros = data.micro_ha;

        // Generar cards de productos dinámicamente
        const productCardsHtml = data.productos_recomendados.map((p, index) => `
            <div class="p-card" style="border-left-color: ${index % 2 === 0 ? '#f1c40f' : '#3498db'};">
                <h5 style="color: ${index % 2 === 0 ? '#d35400' : '#2980b9'};">OPCIÓN ${index + 1}: ${index === 0 ? 'LÍNEA PREMIUM' : 'ALTERNATIVA'}</h5>
                <p><strong>Producto:</strong> ${p.name}</p>
                <p>${p.desc}</p>
            </div>
        `).join('') || '<p>No hay productos recomendados configurados.</p>';

        resultsContainer.innerHTML = `
            <div class="npk-summary">
                <div class="npk-item"><strong>Nitrógeno (N) Total</strong> <span>${totalN.toLocaleString()} kg</span></div>
                <div class="npk-item"><strong>Fósforo (P₂O₅) Total</strong> <span>${totalP.toLocaleString()} kg</span></div>
                <div class="npk-item"><strong>Potasio (K₂O) Total</strong> <span>${totalK.toLocaleString()} kg</span></div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 16px; margin-bottom: 40px; border: 1px solid #e2e8f0;">
                <h4 style="margin-top:0; color:#2D5A27; font-size: 0.8rem; text-transform: uppercase;">Micronutrientes Sugeridos (kg totales)</h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap:10px; text-align:center;">
                    ${micros.fe > 0 ? `<div><strong style="display:block; font-size:10px;">Fe</strong><span>${(micros.fe*has).toFixed(2)}</span></div>` : ''}
                    ${micros.mn > 0 ? `<div><strong style="display:block; font-size:10px;">Mn</strong><span>${(micros.mn*has).toFixed(2)}</span></div>` : ''}
                    ${micros.zn > 0 ? `<div><strong style="display:block; font-size:10px;">Zn</strong><span>${(micros.zn*has).toFixed(2)}</span></div>` : ''}
                    ${micros.cu > 0 ? `<div><strong style="display:block; font-size:10px;">Cu</strong><span>${(micros.cu*has).toFixed(2)}</span></div>` : ''}
                    ${micros.b > 0 ? `<div><strong style="display:block; font-size:10px;">B</strong><span>${(micros.b*has).toFixed(2)}</span></div>` : ''}
                    ${micros.mo > 0 ? `<div><strong style="display:block; font-size:10px;">Mo</strong><span>${(micros.mo*has).toFixed(2)}</span></div>` : ''}
                    ${micros.cl > 0 ? `<div><strong style="display:block; font-size:10px;">Cl</strong><span>${(micros.cl*has).toFixed(2)}</span></div>` : ''}
                    ${micros.mgo > 0 ? `<div><strong style="display:block; font-size:10px;">MgO</strong><span>${(micros.mgo*has).toFixed(2)}</span></div>` : ''}
                </div>
            </div>
            <h3 class="recommendation-title">Plan de Fertilización Sugerido</h3>
            <div class="product-cards">
                ${productCardsHtml}
                <div class="p-card"><h5>COMPLEMENTOS</h5><p>Acompañar con línea MASTER PROTEC y SOLUBLES.</p></div>
            </div>
        `;

        const resultsSection = document.getElementById('plan-results');
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    if (btnCalculate) btnCalculate.addEventListener('click', calculate);
});

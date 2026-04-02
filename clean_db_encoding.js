const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://bfwqmekquomqkydrxwvm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmd3FtZWtxdW9tcWt5ZHJ4d3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTEzMjIsImV4cCI6MjA4OTQ2NzMyMn0.Tatgp8Gs_5DN-zvmoWjW5IuhbrRQhMtCOxHFCwguHl0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function cleanString(str) {
    if (typeof str !== 'string') return str;
    
    let cleaned = str
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã /g, 'á') // Variación común
        .replace(/Ã³/g, 'ó')
        .replace(/Ã³/g, 'ó')
        .replace(/Ã³/g, 'ó')
        .replace(/Â/g, '')
        // Para subíndices químicos comunes
        .replace(/P2O5/g, 'P₂O₅')
        .replace(/K2O/g, 'K₂O')
        .replace(/MgO/g, 'MgO') // El usuario pidió MgO específicamente
        .replace(/SO4/g, 'SO₄')
        .replace(/NH4/g, 'NH₄')
        .replace(/NO3/g, 'NO₃');
    
    return cleaned;
}

function cleanObject(obj) {
    if (Array.isArray(obj)) {
        return obj.map(cleanObject);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (let key in obj) {
            newObj[key] = cleanObject(obj[key]);
        }
        return newObj;
    } else {
        return cleanString(obj);
    }
}

async function runCleanup() {
    console.log("Iniciando depuración de datos...");
    
    const { data: crops, error } = await supabase
        .from('calculadora_cultivos')
        .select('*');
        
    if (error) {
        console.error("Error al obtener cultivos:", error);
        return;
    }
    
    console.log(`Procesando ${crops.length} registros...`);
    
    for (const crop of crops) {
        const updatedCrop = {
            nombre_cultivo: cleanString(crop.nombre_cultivo),
            etapas: cleanObject(crop.etapas),
            productos_recomendados: cleanObject(crop.productos_recomendados)
        };
        
        console.log(`Limpiando: ${crop.nombre_cultivo} -> ${updatedCrop.nombre_cultivo}`);
        
        const { error: updateError } = await supabase
            .from('calculadora_cultivos')
            .update(updatedCrop)
            .eq('id', crop.id);
            
        if (updateError) {
            console.error(`Error actualizando ${crop.id}:`, updateError);
        }
    }
    
    console.log("Depuración completada.");
}

runCleanup();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://bfwqmekquomqkydrxwvm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmd3FtZWtxdW9tcWt5ZHJ4d3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTEzMjIsImV4cCI6MjA4OTQ2NzMyMn0.Tatgp8Gs_5DN-zvmoWjW5IuhbrRQhMtCOxHFCwguHl0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data: crops, error } = await supabase
        .from('calculadora_cultivos')
        .select('nombre_cultivo');
        
    if (error) {
        console.error("Error:", error);
        return;
    }
    
    console.log(crops.map(c => c.nombre_cultivo).join(", "));
}

run();

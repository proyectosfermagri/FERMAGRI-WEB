<?php
// Copiar a config.php en el servidor. No usar una clave service_role.
return [
    'supabase_url' => 'https://bfwqmekquomqkydrxwvm.supabase.co',
    'supabase_key' => getenv('FERMAGRI_SUPABASE_ANON_KEY') ?: '',
    'admin_ids' => array_values(array_filter(explode(',', getenv('FERMAGRI_ADMIN_IDS') ?: ''))),
    'site_origin' => 'https://fermagri.com',
];

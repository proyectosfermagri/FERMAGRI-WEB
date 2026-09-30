<?php
declare(strict_types=1);

const PUBLIC_FIELDS = [
    'productos' => ['id','nombre','categoria','descripcion','dosis','concentracion','origen','presentacion','ficha','seguridad','imagen','textura','orden'],
    'slides' => ['id','orden','title','subtitle','image_url','button_text','button_link'],
];

function public_rows(string $table, array $rows, array $media = []): array {
    if (!isset(PUBLIC_FIELDS[$table]) || !array_is_list($rows)) {
        throw new RuntimeException('Respuesta del catálogo inválida.', 502);
    }
    $result = [];
    foreach ($rows as $row) {
        if (!is_array($row) || !isset($row['id']) || !isset($row[$table === 'productos' ? 'nombre' : 'title'])) {
            throw new RuntimeException('Registro del catálogo inválido.', 502);
        }
        if ($table === 'productos' && in_array(mb_strtolower(trim($row['categoria'] ?? '')), ['orgánicos','organicos'], true)) continue;
        $row = array_intersect_key($row, array_flip(PUBLIC_FIELDS[$table]));
        foreach (['imagen','textura','ficha','seguridad','image_url'] as $field) {
            if (!empty($row[$field]) && isset($media[$row[$field]])) $row[$field] = $media[$row[$field]];
        }
        $result[] = $row;
    }
    return $result;
}

function atomic_json(string $path, array $data): void {
    try {
        $json = json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } catch (JsonException $e) {
        throw new RuntimeException('No se pudo generar la copia del catálogo.', 500, $e);
    }
    $tmp = tempnam(dirname($path), '.catalog-');
    if ($tmp === false) throw new RuntimeException('No se pudo crear la copia del catálogo.', 500);
    try {
        if (file_put_contents($tmp, $json . "\n", LOCK_EX) !== strlen($json) + 1 || !chmod($tmp, 0644) || !rename($tmp, $path)) {
            throw new RuntimeException('No se pudo publicar el catálogo.', 500);
        }
    } finally {
        if (is_file($tmp)) unlink($tmp);
    }
}

function encode_media(string $bytes): array {
    if (strlen($bytes) === 0 || strlen($bytes) > 10 * 1024 * 1024) {
        throw new RuntimeException('El archivo supera el límite de 10 MB o está vacío.', 413);
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->buffer($bytes);
    if ($mime === 'application/pdf' && str_starts_with($bytes, '%PDF-')) return [$bytes, 'pdf'];
    if (!in_array($mime, ['image/jpeg','image/png','image/webp'], true)) {
        throw new RuntimeException('Solo se permiten imágenes JPG, PNG, WebP y documentos PDF.', 415);
    }
    $dimensions = @getimagesizefromstring($bytes);
    if (!$dimensions || $dimensions[0] * $dimensions[1] > 16000000) {
        throw new RuntimeException('Imagen inválida o mayor de 16 megapíxeles.', 422);
    }
    $source = @imagecreatefromstring($bytes);
    if (!$source) throw new RuntimeException('No se pudo leer la imagen.', 422);
    $ratio = min(1, 1920 / max($dimensions[0], $dimensions[1]));
    $width = max(1, (int)round($dimensions[0] * $ratio));
    $height = max(1, (int)round($dimensions[1] * $ratio));
    $target = imagecreatetruecolor($width, $height);
    imagealphablending($target, false);
    imagesavealpha($target, true);
    imagecopyresampled($target, $source, 0, 0, 0, 0, $width, $height, $dimensions[0], $dimensions[1]);
    ob_start();
    $ok = imagewebp($target, null, 82);
    $encoded = ob_get_clean();
    if (!$ok || !$encoded || strlen($encoded) > 1500000) {
        throw new RuntimeException('La imagen sigue siendo demasiado pesada. Reduce sus dimensiones.', 422);
    }
    return [$encoded, 'webp'];
}

function store_media(string $root, string $bytes, string $extension): string {
    $hash = hash('sha256', $bytes);
    $relative = 'media/' . $hash . '.' . $extension;
    $path = $root . '/' . $relative;
    if (is_file($path)) {
        if (hash_file('sha256', $path) !== $hash) throw new RuntimeException('Archivo local incompleto: ' . $relative, 500);
        return $relative;
    }
    $tmp = tempnam($root . '/media', '.upload-');
    if ($tmp === false) throw new RuntimeException('No se pudo crear el archivo.', 500);
    try {
        if (file_put_contents($tmp, $bytes, LOCK_EX) !== strlen($bytes) || !chmod($tmp, 0644) || !rename($tmp, $path)) {
            throw new RuntimeException('No se pudo guardar el archivo completo.', 500);
        }
    } finally {
        if (is_file($tmp)) unlink($tmp);
    }
    return $relative;
}

function supabase_request(array $config, string $path, string $token, array $headers = []): array {
    $curl = curl_init(rtrim($config['supabase_url'], '/') . $path);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => array_merge(['apikey: ' . $config['supabase_key'], 'Authorization: Bearer ' . $token], $headers),
    ]);
    $body = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    if ($status === 401 || $status === 403) throw new RuntimeException('La sesión no tiene acceso. Inicia sesión otra vez.', 401);
    if ($body === false || !in_array($status, [200,206], true)) {
        throw new RuntimeException('Supabase no está disponible. Se conserva la última copia publicada.', 503);
    }
    $data = json_decode($body, true);
    if (!is_array($data)) throw new RuntimeException('Respuesta inválida de Supabase.', 502);
    return $data;
}

function publish_catalog(array $config, string $token, string $root): array {
    // Serializar las publicaciones antes de leer: una petición antigua no pisa otra más reciente.
    $lock = fopen($root . '/data/.publish.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
        if ($lock) fclose($lock);
        throw new RuntimeException('Hay otra publicación en curso. Reintenta en unos segundos.', 409);
    }
    try {
        $mediaPath = $root . '/data/media-map.json';
        $media = is_file($mediaPath) ? json_decode(file_get_contents($mediaPath), true, 512, JSON_THROW_ON_ERROR) : [];
        foreach ($media as $source => $target) {
            if (!is_string($target) || !preg_match('#^media/[a-f0-9]{64}\.(webp|pdf)$#D', $target) || !is_file($root . '/' . $target)) {
                throw new RuntimeException('Falta un archivo del catálogo migrado. Revisa la publicación.', 500);
            }
        }
        $snapshot = ['version' => 1, 'generated_at' => gmdate('c')];
        foreach (PUBLIC_FIELDS as $table => $fields) {
            $all = [];
            $offset = 0;
            do {
                $rows = supabase_request($config, '/rest/v1/' . $table . '?select=' . implode(',', $fields)
                    . '&order=' . ($table === 'slides' ? 'orden.asc,id.asc' : 'id.asc'), $token,
                    ['Range: ' . $offset . '-' . ($offset + 999), 'Range-Unit: items']);
                if (!array_is_list($rows)) throw new RuntimeException('Respuesta inválida del catálogo.', 502);
                $all = array_merge($all, $rows);
                $offset += count($rows);
                if ($offset > 50000) throw new RuntimeException('El catálogo excede el tamaño admitido.', 413);
            } while (count($rows) > 0);
            $snapshot[$table] = public_rows($table, $all, $media);
        }
        atomic_json($root . '/data/catalogo.json', $snapshot);
        return ['generated_at'=>$snapshot['generated_at'], 'productos'=>count($snapshot['productos']), 'slides'=>count($snapshot['slides'])];
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

<?php
// Uso: php scripts/prepare-catalog.php export.json [--download] [--originals=/ruta]
// El directorio de originales debe conservar los nombres exactos de Storage.
declare(strict_types=1);
require __DIR__ . '/../api/catalog-lib.php';
if (PHP_SAPI !== 'cli' || empty($argv[1])) exit("Uso: php scripts/prepare-catalog.php export.json [--download] [--originals=/ruta]\n");
$root = dirname(__DIR__);
if (!is_dir($root . '/.context')) mkdir($root . '/.context', 0700);
$export = json_decode(file_get_contents($argv[1]), true, 512, JSON_THROW_ON_ERROR);
$mapPath = $root . '/data/media-map.json';
$map = is_file($mapPath) ? json_decode(file_get_contents($mapPath), true, 512, JSON_THROW_ON_ERROR) : [];
$originals = null;
foreach ($argv as $arg) if (str_starts_with($arg, '--originals=')) $originals = realpath(substr($arg, 12));
$download = in_array('--download', $argv, true);
$prefix = 'https://bfwqmekquomqkydrxwvm.supabase.co/storage/v1/object/public/fermagri-assets/';
$snapshot = ['version'=>1, 'generated_at'=>gmdate('c')];
$references = [];
foreach (PUBLIC_FIELDS as $table => $_) {
    $snapshot[$table] = public_rows($table, $export[$table]);
    foreach ($snapshot[$table] as $row) foreach (['imagen','textura','ficha','seguridad','image_url'] as $field) {
        if (!empty($row[$field])) $references[$row[$field]] = true;
    }
}
$pending = [];
foreach (array_keys($references) as $reference) {
    try {
        if (isset($map[$reference]) && preg_match('#^media/([a-f0-9]{64})\.(webp|pdf)$#D', $map[$reference], $match)
            && is_file($root . '/' . $map[$reference]) && hash_file('sha256', $root . '/' . $map[$reference]) === $match[1]) continue;
        unset($map[$reference]);
        $bytes = false;
        if (str_starts_with($reference, $prefix)) {
            $name = rawurldecode(substr($reference, strlen($prefix)));
            $local = $originals ? realpath($originals . '/' . $name) : false;
            if ($local && str_starts_with($local, $originals . '/') && is_file($local)) {
                $bytes = file_get_contents($local);
            } elseif ($download) {
                $curl = curl_init($reference);
                curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_CONNECTTIMEOUT=>5, CURLOPT_TIMEOUT=>30, CURLOPT_MAXFILESIZE=>10*1024*1024]);
                $bytes = curl_exec($curl);
                $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
                curl_close($curl);
                if ($status === 402) $download = false; // No repetir cientos de peticiones bloqueadas.
                if ($status !== 200) throw new RuntimeException('Storage respondió HTTP ' . $status);
            }
        } elseif (str_starts_with($reference, 'IMAGENES/') || str_starts_with($reference, 'media/')) {
            $local = realpath($root . '/' . rawurldecode($reference));
            if ($local && (str_starts_with($local, $root . '/IMAGENES/') || str_starts_with($local, $root . '/media/')) && is_file($local)) {
                $bytes = file_get_contents($local);
            }
        }
        if ($bytes === false) throw new RuntimeException('Falta original verificable; se conserva la referencia existente.');
        [$encoded, $ext] = encode_media($bytes);
        $map[$reference] = store_media($root, $encoded, $ext);
    } catch (Throwable $error) {
        $pending[] = ['url'=>$reference, 'reason'=>$error->getMessage()];
    }
}
foreach (PUBLIC_FIELDS as $table => $_) $snapshot[$table] = public_rows($table, $snapshot[$table], $map);
atomic_json($mapPath, $map);
atomic_json($root . '/data/catalogo.json', $snapshot);
atomic_json($root . '/.context/media-pending.json', $pending);
echo count($snapshot['productos']) . ' productos, ' . count($snapshot['slides']) . " slides.\n";
echo (count($references) - count($pending)) . ' referencias locales; ' . count($pending) . " pendientes: .context/media-pending.json\n";
// Código no cero para que una publicación automática no confunda una migración parcial con una completa.
exit($pending ? 2 : 0);

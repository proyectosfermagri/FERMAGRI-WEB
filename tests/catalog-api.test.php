<?php
require __DIR__ . '/../api/catalog-lib.php';

function check($condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function rejects(callable $action): void {
    try { $action(); } catch (RuntimeException $e) { return; }
    throw new RuntimeException('Se aceptó una entrada inválida');
}

check(public_rows('productos', [['id'=>1,'nombre'=>'Urea','formula_interna'=>'privado'],
    ['id'=>2,'nombre'=>'Humic','categoria'=>'Orgánicos']]) === [['id'=>1,'nombre'=>'Urea']],
    'No publicar fórmulas internas ni orgánicos');
check(public_rows('slides', []) === [], 'Una eliminación completa debe publicar una lista vacía');
rejects(fn() => public_rows('slides', [['title'=>'Sin id']]));
rejects(fn() => public_rows('productos', ['error'=>'upstream']));

rejects(fn() => encode_media('<?php echo "bad"; ?>'));
rejects(fn() => encode_media('<svg xmlns="http://www.w3.org/2000/svg"></svg>'));
$image = imagecreatetruecolor(2400, 1200);
ob_start(); imagepng($image); $png = ob_get_clean();
[$bytes, $extension] = encode_media($png . '<?php echo "bad"; ?>');
check($extension === 'webp', 'Convertir a WebP');
check(!str_contains($bytes, '<?php'), 'Eliminar contenido añadido al recodificar');
check(getimagesizefromstring($bytes)[0] === 1920, 'Limitar resolución');
check(encode_media("%PDF-1.4\n%%EOF")[1] === 'pdf', 'Conservar documentos PDF');
rejects(fn() => encode_media(str_repeat('x', 10 * 1024 * 1024 + 1)));

$dir = sys_get_temp_dir() . '/fermagri-test-' . bin2hex(random_bytes(8));
mkdir($dir);
mkdir($dir . '/media');
try {
    $media = store_media($dir, $bytes, 'webp');
    check(file_get_contents($dir . '/' . $media) === $bytes, 'Guardar archivo completo');
    check(store_media($dir, $bytes, 'webp') === $media, 'Deduplicar un archivo verificado');
    file_put_contents($dir . '/' . $media, '');
    rejects(fn() => store_media($dir, $bytes, 'webp'));
    atomic_json($dir . '/catalogo.json', ['version'=>1, 'productos'=>[['id'=>1]]]);
    $before = file_get_contents($dir . '/catalogo.json');
    rejects(fn() => atomic_json($dir . '/catalogo.json', ['invalid'=>"\xB1"]));
    check(file_get_contents($dir . '/catalogo.json') === $before, 'Preservar respaldo al fallar');
} finally {
    foreach (glob($dir . '/media/*') as $file) unlink($file);
    rmdir($dir . '/media');
    foreach (glob($dir . '/*') as $file) unlink($file);
    rmdir($dir);
}
echo "OK: datos públicos, archivos válidos, compresión y publicación atómica\n";

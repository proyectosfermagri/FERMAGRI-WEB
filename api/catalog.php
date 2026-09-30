<?php
declare(strict_types=1);
require __DIR__ . '/catalog-lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header('Allow: POST');
        throw new RuntimeException('Método no permitido.', 405);
    }
    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer ([A-Za-z0-9._-]+)$/D', $authorization, $match)) {
        throw new RuntimeException('Inicia sesión para publicar.', 401);
    }
    if (!is_file(__DIR__ . '/config.php')) throw new RuntimeException('Falta configurar la publicación en el alojamiento.', 503);
    $config = require __DIR__ . '/config.php';
    if (empty($config['supabase_key']) || empty($config['admin_ids']) || empty($config['site_origin'])) {
        throw new RuntimeException('Falta configurar el acceso de administradores.', 503);
    }
    if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] !== $config['site_origin']) {
        throw new RuntimeException('Origen no permitido.', 403);
    }
    $token = $match[1];
    $user = supabase_request($config, '/auth/v1/user', $token);
    if (empty($user['id']) || !in_array($user['id'], $config['admin_ids'], true)) {
        throw new RuntimeException('Tu cuenta no tiene permiso para publicar.', 403);
    }
    $action = $_GET['action'] ?? '';
    $root = dirname(__DIR__);
    if ($action === 'publish') {
        $result = publish_catalog($config, $token, $root);
    } elseif ($action === 'upload') {
        $file = $_FILES['file'] ?? null;
        if (!$file || !is_int($file['error']) || $file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('No se recibió el archivo completo. Comprueba su tamaño.', 422);
        }
        if (filesize($file['tmp_name']) > 10 * 1024 * 1024) throw new RuntimeException('Archivo mayor de 10 MB.', 413);
        [$bytes, $extension] = encode_media(file_get_contents($file['tmp_name']));
        $relative = store_media($root, $bytes, $extension);
        $result = ['url'=>$relative];
    } else {
        throw new RuntimeException('Acción no permitida.', 400);
    }
    echo json_encode($result, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    $status = $error instanceof RuntimeException && $error->getCode() >= 400 && $error->getCode() <= 599 ? $error->getCode() : 500;
    http_response_code($status);
    if ($status === 500) error_log((string)$error);
    echo json_encode(['error'=>$status === 500 ? 'Error al publicar. Se conserva la copia anterior; revisa el registro del servidor.' : $error->getMessage()], JSON_UNESCAPED_UNICODE);
}

<?php
// Local development/static-preview router. Never deploy this file.
declare(strict_types=1);
$path = (string)parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($path, '/api/') || str_starts_with($path, '/uploads/')) {
    if (str_starts_with($path, '/api/_') || str_contains($path, '/.')) { http_response_code(404); exit; }
    require dirname(__DIR__) . '/directadmin/api/index.php';
    return true;
}
if (preg_match('#^/trang-phuc/([a-z0-9-]{1,100})/?$#D', $path, $match)) {
    header('Location: /chi-tiet-trang-phuc/?slug=' . $match[1], true, 302); return true;
}
$root = realpath($_SERVER['DOCUMENT_ROOT']);
$file = realpath($root . rawurldecode($path));
if ($file !== false && ($file === $root || str_starts_with($file, $root . DIRECTORY_SEPARATOR))) {
    if (is_dir($file)) $file .= '/index.html';
    if (is_file($file) && strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== 'php') {
        if (str_ends_with($file, '.html')) { header('Content-Type: text/html; charset=utf-8'); readfile($file); return true; }
        return false;
    }
}
http_response_code(404);
return true;

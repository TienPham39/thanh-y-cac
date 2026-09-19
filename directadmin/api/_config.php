<?php

$passwordFile = __DIR__ . '/.db-password';
$filePassword = is_file($passwordFile) ? trim((string) file_get_contents($passwordFile)) : '';

return [
    'host' => getenv('DB_HOST') ?: 'localhost',
    'port' => (int) (getenv('DB_PORT') ?: 3306),
    'database' => getenv('DB_NAME') ?: 'thanhyca6aae_tyc',
    'username' => getenv('DB_USER') ?: 'thanhyca6aae_tyc',
    // Điền mật khẩu trong file .db-password trên DirectAdmin, không sửa trực tiếp PHP.
    'password' => getenv('DB_PASSWORD') ?: $filePassword,
];

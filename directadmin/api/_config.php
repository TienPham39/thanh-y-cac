<?php

$passwordFile = __DIR__ . '/.db-password';
$filePassword = is_file($passwordFile) ? trim((string) file_get_contents($passwordFile)) : '';
$privateDirectory = getenv('TYC_PRIVATE_DIR') ?: dirname(__DIR__, 2) . '/tyc-private';
$privateFile = $privateDirectory . '/config.php';
$private = is_file($privateFile) ? require $privateFile : [];
$environmentHash = getenv('ADMIN_PASSWORD_HASH') ?: '';
// A legacy Node scrypt hash must not shadow a PHP credential configured locally.
$usePrivateAdmin = isset($private['adminPasswordHash']) && !password_get_info($environmentHash)['algo'];

return [
    'payosClientId' => getenv('PAYOS_CLIENT_ID') ?: ($private['payosClientId'] ?? ''),
    'payosApiKey' => getenv('PAYOS_API_KEY') ?: ($private['payosApiKey'] ?? ''),
    'payosChecksumKey' => getenv('PAYOS_CHECKSUM_KEY') ?: ($private['payosChecksumKey'] ?? ''),
    'paymentBank' => $private['paymentBank'] ?? 'BIDV',
    'paymentAccount' => $private['paymentAccount'] ?? '7411028927',
    'paymentAccountName' => $private['paymentAccountName'] ?? 'Phạm Gia Tiến',
    'host' => getenv('DB_HOST') ?: ($private['host'] ?? 'localhost'),
    'port' => (int) (getenv('DB_PORT') ?: ($private['port'] ?? 3306)),
    'database' => getenv('DB_NAME') ?: ($private['database'] ?? 'thanhyca6aae_tyc'),
    'username' => getenv('DB_USER') ?: ($private['username'] ?? 'thanhyca6aae_tyc'),
    // Điền mật khẩu trong file .db-password trên DirectAdmin, không sửa trực tiếp PHP.
    'password' => getenv('DB_PASSWORD') ?: ($private['password'] ?? $filePassword),
    'privateDirectory' => $privateDirectory,
    'environment' => getenv('APP_ENV') ?: 'production',
    'appOrigin' => getenv('APP_ORIGIN') ?: ($private['appOrigin'] ?? 'https://thanhycac.com'),
    'adminEmail' => $usePrivateAdmin ? ($private['adminEmail'] ?? '') : (getenv('ADMIN_EMAIL') ?: ($private['adminEmail'] ?? '')),
    'adminPasswordHash' => $usePrivateAdmin ? $private['adminPasswordHash'] : ($environmentHash ?: ($private['adminPasswordHash'] ?? '')),
];

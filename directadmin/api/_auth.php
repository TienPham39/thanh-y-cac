<?php
declare(strict_types=1);

function adminCredentials(): array
{
    $config = appConfig();
    $email = strtolower(trim($config['adminEmail'] ?? ''));
    $hash = $config['adminPasswordHash'] ?? '';
    if (!$email || !password_get_info($hash)['algo']) fail(503, 'AUTH_NOT_CONFIGURED', 'Đăng nhập quản trị chưa được cấu hình.');
    return [$email, $hash];
}

function startSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $directory = appConfig()['privateDirectory'] . '/sessions';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Cannot create session directory');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '28800');
    session_save_path($directory);
    session_name('tyc_php_session');
    session_set_cookie_params(['lifetime' => 28800, 'path' => '/', 'secure' => str_starts_with(origin(), 'https://'), 'httponly' => true, 'samesite' => 'Lax']);
    if (!session_start()) throw new RuntimeException('Cannot start session');
}

function requireAdmin(): string
{
    [$email, $hash] = adminCredentials();
    startSession();
    $valid = ($_SESSION['email'] ?? null) === $email
        && ($_SESSION['expiresAt'] ?? 0) > time()
        && hash_equals(hash('sha256', $hash), (string)($_SESSION['credentialVersion'] ?? ''));
    session_write_close();
    if (!$valid) fail(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập lại.');
    return $email;
}

function authSession(): never
{
    $method = requireMethod('GET', 'POST', 'DELETE');
    if ($method === 'GET') respond(['data' => ['email' => requireAdmin()]]);
    requireOrigin();
    if ($method === 'DELETE') {
        startSession();
        $_SESSION = [];
        session_destroy();
        setcookie('tyc_php_session', '', ['expires' => 1, 'path' => '/', 'secure' => str_starts_with(origin(), 'https://'), 'httponly' => true, 'samesite' => 'Lax']);
        respond(['data' => ['signedOut' => true]]);
    }
    [$email, $hash] = adminCredentials();
    $body = input(4000);
    if (!is_string($body['identifier'] ?? null) || !is_string($body['password'] ?? null)
        || strlen($body['identifier']) > 191 || strlen($body['password']) > (password_get_info($hash)['algoName'] === 'bcrypt' ? 72 : 256)) fail(422, 'INVALID_REQUEST', 'Vui lòng nhập đúng email và mật khẩu.');
    // Never trust client-supplied X-Forwarded-For for throttling.
    rateLimit(database(), 'login:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 5, 900);
    $matches = password_verify($body['password'], $hash);
    if (!$matches || strtolower(trim($body['identifier'])) !== $email) fail(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
    startSession();
    session_regenerate_id(true);
    $_SESSION = ['email' => $email, 'expiresAt' => time() + 28800, 'credentialVersion' => hash('sha256', $hash)];
    session_write_close();
    sql(database(), 'DELETE FROM ApiRateLimit WHERE `key` = ?', [hash('sha256', 'login:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'))]);
    respond(['data' => ['email' => $email]]);
}

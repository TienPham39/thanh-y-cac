<?php
declare(strict_types=1);

final class ApiError extends RuntimeException
{
    public function __construct(public int $status, public string $errorCode, string $message) { parent::__construct($message); }
}

function fail(int $status, string $code, string $message): never { throw new ApiError($status, $code, $message); }
function respond(array $body, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function appConfig(): array
{
    static $config;
    return $config ??= require __DIR__ . '/_config.php';
}

function database(): PDO
{
    static $db;
    if ($db) return $db;
    $c = appConfig();
    foreach (['host', 'port', 'database', 'username', 'password'] as $key) {
        if (!isset($c[$key]) || $c[$key] === '' || $c[$key] === 'CHANGE_ME') throw new RuntimeException('Database is not configured');
    }
    $db = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['host'], $c['port'], $c['database']), $c['username'], $c['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $db->exec("SET time_zone = '+00:00'");
    return $db;
}

function sql(PDO $db, string $query, array $values = []): PDOStatement
{
    $statement = $db->prepare($query);
    $statement->execute($values);
    return $statement;
}

function input(int $max = 32000): array
{
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') fail(415, 'INVALID_REQUEST', 'Yêu cầu phải dùng JSON.');
    $raw = file_get_contents('php://input', false, null, 0, $max + 1);
    if ($raw === false || strlen($raw) > $max) fail(413, 'INVALID_REQUEST', 'Dữ liệu quá lớn.');
    try { $body = json_decode($raw, true, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException) { fail(400, 'INVALID_REQUEST', 'Dữ liệu không hợp lệ.'); }
    if (!is_array($body) || !str_starts_with(ltrim($raw), '{')) fail(400, 'INVALID_REQUEST', 'Dữ liệu không hợp lệ.');
    return $body;
}

function origin(): string
{
    $configured = rtrim(appConfig()['appOrigin'] ?? '', '/');
    if ($configured !== '') return $configured;
    // Local development only; production must have a pinned HTTPS origin.
    if ((appConfig()['environment'] ?? '') === 'development') return 'http://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    throw new RuntimeException('APP_ORIGIN is not configured');
}

function requireOrigin(): void
{
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== origin()) fail(403, 'INVALID_ORIGIN', 'Địa chỉ gửi yêu cầu không khớp với website.');
}

function requireMethod(string ...$methods): string
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        fail(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
    }
    return $method;
}

// One row per subject/window; a transaction makes limits reliable across PHP workers.
function rateLimit(PDO $db, string $subject, int $limit, int $window): void
{
    $key = hash('sha256', $subject);
    $db->beginTransaction();
    try {
        sql($db, 'INSERT INTO ApiRateLimit (`key`, hits, expiresAt) VALUES (?, 0, ?) ON DUPLICATE KEY UPDATE `key` = `key`', [$key, time() + $window]);
        $row = sql($db, 'SELECT hits, expiresAt FROM ApiRateLimit WHERE `key` = ? FOR UPDATE', [$key])->fetch();
        $expired = (int)$row['expiresAt'] <= time();
        $count = $expired ? 0 : (int)$row['hits'];
        $expires = $expired ? time() + $window : (int)$row['expiresAt'];
        if ($count >= $limit) {
            $db->rollBack();
            header('Retry-After: ' . max(1, $expires - time()));
            fail(429, 'TOO_MANY_ATTEMPTS', 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
        }
        sql($db, 'UPDATE ApiRateLimit SET hits = ?, expiresAt = ? WHERE `key` = ?', [$count + 1, $expires, $key]);
        $db->commit();
        // Bounded cleanup prevents expired subjects accumulating indefinitely.
        sql($db, 'DELETE FROM ApiRateLimit WHERE expiresAt < ? LIMIT 100', [time()]);
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
}

function uuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 15) | 64);
    $bytes[8] = chr((ord($bytes[8]) & 63) | 128);
    $hex = bin2hex($bytes);
    return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4) . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
}

function today(): string { return (new DateTimeImmutable('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('Y-m-d'); }

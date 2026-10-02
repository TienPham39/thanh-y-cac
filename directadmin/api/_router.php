<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
require __DIR__ . '/_core.php';
require __DIR__ . '/_auth.php';
require __DIR__ . '/_validation.php';
require __DIR__ . '/_catalog.php';
require __DIR__ . '/_admin-products.php';
require __DIR__ . '/_rentals.php';
require __DIR__ . '/_pricing.php';
require __DIR__ . '/_categories.php';
require __DIR__ . '/_dashboard.php';
require __DIR__ . '/_users.php';
require __DIR__ . '/_payments.php';
$path = rtrim((string)parse_url($_SERVER['REQUEST_URI'] ?? '/api', PHP_URL_PATH), '/');
$stringError = in_array($path, ['/api/rental-requests', '/api/admin/rental-requests', '/api/products/availability'], true);
try {
    if ($path === '/api/health') { requireMethod('GET'); respond(['status' => 'ok', 'service' => 'thanh-y-cac-php']); }
    if ($path === '/api/auth/session') authSession();
    if ($path === '/api/admin/products') adminProducts();
    if ($path === '/api/admin/dashboard') adminDashboard();
    if ($path === '/api/admin/users') adminUsers();
    if ($path === '/api/checkout') checkoutApi();
    if ($path === '/api/checkout/lookup') checkoutLookup();
    if ($path === '/api/payments/webhook') paymentWebhook();
    if ($path === '/api/admin/categories') adminCategories();
    if ($path === '/api/admin/products/publication') adminProducts(true);
    if ($path === '/api/admin/uploads') uploadImage();
    if ($path === '/api/admin/rental-requests') adminRentals();
    if ($path === '/api/rental-requests') createRental();
    if ($path === '/api/products/availability') availability();
    if (preg_match('#^/(?:api/)?uploads/([^/]+)$#D', $path, $match)) serveUpload($match[1]);
    if ($path === '/api/ready') {
        requireMethod('GET');
        $db = database();
        $db->query('SELECT codePrefix FROM ProductCategory LIMIT 0');
        $db->query('SELECT images, extraDay, deposit, accessoryFee FROM CostumeProduct LIMIT 0');
        $db->query('SELECT priceSnapshot FROM RentalRequest LIMIT 0');
        $db->query('SELECT status, depositConfirmedAt, returnedAt FROM RentalRequest LIMIT 0');
        $db->query('SELECT day FROM RentalReservedDay LIMIT 0');
        $db->query('SELECT hits FROM ApiRateLimit LIMIT 0');
        foreach (sql($db, "SELECT TABLE_NAME, ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('RentalRequest', 'RentalReservedDay', 'ApiRateLimit', 'CostumeProduct')")->fetchAll() as $table) {
            if (strtoupper($table['ENGINE']) !== 'INNODB') throw new RuntimeException('Transactional tables must use InnoDB');
        }
        respond(['status' => 'ok']);
    }
    if ($path === '/api/products') { requireMethod('GET'); listProducts(database()); }
    if ($path === '/api/product-categories') { requireMethod('GET'); listCategories(database()); }
    if (preg_match('#^/api/products/([^/]+)$#D', $path, $matches)) { requireMethod('GET'); productDetail(database(), $matches[1]); }
    fail(404, 'NOT_FOUND', 'Không tìm thấy API.');
} catch (ApiError $e) {
    respond(['error' => $stringError ? $e->getMessage() : ['code' => $e->errorCode, 'message' => $e->getMessage()]], $e->status);
} catch (InvalidArgumentException $e) {
    respond(['error' => ['code' => 'INVALID_QUERY', 'message' => $e->getMessage()]], 400);
} catch (Throwable $e) {
    error_log('Thanh Y Cac API failure: ' . get_class($e) . ' code=' . $e->getCode());
    $message = 'Chưa kết nối được dữ liệu. Vui lòng thử lại.';
    respond(['error' => $stringError ? $message : ['code' => 'SERVICE_UNAVAILABLE', 'message' => $message]], 503);
}

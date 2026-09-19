<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

function respond(array $body, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function database(): PDO
{
    $config = require __DIR__ . '/_config.php';
    foreach (['host', 'port', 'database', 'username', 'password'] as $key) {
        if (!isset($config[$key]) || $config[$key] === '' || $config[$key] === 'CHANGE_ME') {
            throw new RuntimeException('Database is not configured');
        }
    }
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $config['host'],
        (int) $config['port'],
        $config['database'],
    );
    return new PDO($dsn, $config['username'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function queryParameters(): array
{
    $result = [];
    foreach (explode('&', $_SERVER['QUERY_STRING'] ?? '') as $part) {
        if ($part === '') continue;
        [$rawKey, $rawValue] = array_pad(explode('=', $part, 2), 2, '');
        $key = urldecode($rawKey);
        $value = urldecode($rawValue);
        $result[$key] ??= [];
        $result[$key][] = $value;
    }
    return $result;
}

function firstValue(array $params, string $key, string $fallback = ''): string
{
    return isset($params[$key][0]) ? (string) $params[$key][0] : $fallback;
}

function option(array $params, string $key, array $allowed, string $fallback = ''): string
{
    $value = firstValue($params, $key, $fallback);
    if ($value !== '' && !in_array($value, $allowed, true)) {
        throw new InvalidArgumentException("Tham số {$key} không hợp lệ.");
    }
    return $value;
}

function positiveInteger(array $params, string $key, int $fallback, int $max): int
{
    $value = firstValue($params, $key);
    if ($value === '') return $fallback;
    if (!preg_match('/^\d+$/', $value) || (int) $value < 1 || (int) $value > $max) {
        throw new InvalidArgumentException("Tham số {$key} không hợp lệ.");
    }
    return (int) $value;
}

function product(array $row): array
{
    return [
        'slug' => $row['slug'],
        'code' => $row['code'],
        'name' => $row['name'],
        'description' => $row['description'],
        'image' => $row['image'],
        'price' => (int) $row['price'],
        'categorySlug' => $row['categorySlug'],
        'gender' => $row['gender'],
        'availability' => $row['availability'],
        'minHeight' => (int) $row['minHeight'],
        'maxHeight' => (int) $row['maxHeight'],
        'minWeight' => (int) $row['minWeight'],
        'maxWeight' => (int) $row['maxWeight'],
        'tags' => json_decode($row['tags'], true) ?: [],
        'accessories' => json_decode($row['accessories'], true) ?: [],
        'badge' => $row['badge'],
        'badgeTone' => $row['badgeTone'],
    ];
}

function listProducts(PDO $db): never
{
    $params = queryParameters();
    $allowedKeys = ['q', 'category', 'gender', 'price', 'availability', 'height', 'accessory', 'sort', 'page', 'pageSize'];
    foreach (array_keys($params) as $key) {
        if (!in_array($key, $allowedKeys, true)) {
            throw new InvalidArgumentException("Tham số {$key} không được hỗ trợ.");
        }
    }

    $where = ['cp.published = 1'];
    $bindings = [];
    $q = trim(firstValue($params, 'q'));
    $qLength = function_exists('mb_strlen') ? mb_strlen($q) : strlen($q);
    if ($qLength > 100) throw new InvalidArgumentException('Từ khóa tối đa 100 ký tự.');
    if ($q !== '') {
        $where[] = '(cp.name LIKE :searchName OR cp.code LIKE :searchCode OR cp.description LIKE :searchDescription OR pc.name LIKE :searchCategory)';
        foreach (['searchName', 'searchCode', 'searchDescription', 'searchCategory'] as $key) {
            $bindings[$key] = '%' . $q . '%';
        }
    }

    $categories = array_values(array_filter($params['category'] ?? [], fn($value) => $value !== ''));
    if (count($categories) > 10) throw new InvalidArgumentException('Danh mục không hợp lệ.');
    foreach ($categories as $index => $category) {
        if (!preg_match('/^[a-z0-9-]{1,80}$/', $category)) throw new InvalidArgumentException('Danh mục không hợp lệ.');
        $key = "category{$index}";
        $bindings[$key] = $category;
    }
    if ($categories) {
        $where[] = 'cp.categorySlug IN (' . implode(', ', array_map(fn($i) => ":category{$i}", array_keys($categories))) . ')';
    }

    $gender = option($params, 'gender', ['female', 'male', 'unisex']);
    if ($gender !== '') { $where[] = 'cp.gender = :gender'; $bindings['gender'] = $gender; }
    $availability = option($params, 'availability', ['available', 'advance']);
    if ($availability !== '') { $where[] = 'cp.availability = :availability'; $bindings['availability'] = $availability; }

    $price = option($params, 'price', ['under300', '300to500', 'over500']);
    if ($price === 'under300') $where[] = 'cp.price < 300000';
    if ($price === '300to500') $where[] = 'cp.price BETWEEN 300000 AND 500000';
    if ($price === 'over500') $where[] = 'cp.price > 500000';

    $height = option($params, 'height', ['under155', '155to165', '165to175', 'over175']);
    $ranges = ['under155' => [0, 154], '155to165' => [155, 165], '165to175' => [166, 175], 'over175' => [176, 250]];
    if ($height !== '') {
        $where[] = 'cp.minHeight <= :heightMax AND cp.maxHeight >= :heightMin';
        $bindings['heightMax'] = $ranges[$height][1];
        $bindings['heightMin'] = $ranges[$height][0];
    }

    $accessories = $params['accessory'] ?? [];
    if (count($accessories) > 4) throw new InvalidArgumentException('Phụ kiện không hợp lệ.');
    foreach ($accessories as $index => $accessory) {
        if (!in_array($accessory, ['hairpin', 'fan', 'sword', 'embroidered'], true)) {
            throw new InvalidArgumentException('Phụ kiện không hợp lệ.');
        }
        $key = "accessory{$index}";
        $where[] = "JSON_CONTAINS(cp.accessories, :{$key})";
        $bindings[$key] = json_encode([$accessory]);
    }

    $sort = option($params, 'sort', ['popular', 'newest', 'price-asc', 'price-desc'], 'popular');
    $orders = [
        'popular' => 'cp.popularity DESC',
        'newest' => 'cp.createdAt DESC',
        'price-asc' => 'cp.price ASC',
        'price-desc' => 'cp.price DESC',
    ];
    $page = positiveInteger($params, 'page', 1, 10000);
    $pageSize = positiveInteger($params, 'pageSize', 9, 24);
    $whereSql = implode(' AND ', $where);

    $count = $db->prepare("SELECT COUNT(*) FROM CostumeProduct cp JOIN ProductCategory pc ON pc.slug = cp.categorySlug WHERE {$whereSql}");
    $count->execute($bindings);
    $total = (int) $count->fetchColumn();

    $fields = 'cp.slug, cp.code, cp.name, cp.description, cp.image, cp.price, cp.categorySlug, cp.gender, cp.availability, cp.minHeight, cp.maxHeight, cp.minWeight, cp.maxWeight, cp.tags, cp.accessories, cp.badge, cp.badgeTone';
    $statement = $db->prepare("SELECT {$fields} FROM CostumeProduct cp JOIN ProductCategory pc ON pc.slug = cp.categorySlug WHERE {$whereSql} ORDER BY {$orders[$sort]}, cp.slug ASC LIMIT :limit OFFSET :offset");
    foreach ($bindings as $key => $value) $statement->bindValue(":" . $key, $value);
    $statement->bindValue(':limit', $pageSize, PDO::PARAM_INT);
    $statement->bindValue(':offset', ($page - 1) * $pageSize, PDO::PARAM_INT);
    $statement->execute();
    respond([
        'data' => array_map('product', $statement->fetchAll()),
        'pagination' => ['page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'totalPages' => (int) ceil($total / $pageSize)],
    ]);
}

function listCategories(PDO $db): never
{
    $rows = $db->query('SELECT pc.slug, pc.name, COUNT(cp.slug) AS productCount FROM ProductCategory pc LEFT JOIN CostumeProduct cp ON cp.categorySlug = pc.slug AND cp.published = 1 GROUP BY pc.slug, pc.name, pc.position ORDER BY pc.position ASC')->fetchAll();
    respond(['data' => array_map(fn($row) => ['slug' => $row['slug'], 'name' => $row['name'], 'count' => (int) $row['productCount']], $rows)]);
}

function productDetail(PDO $db, string $slug): never
{
    if (!preg_match('/^[a-z0-9-]{1,100}$/', $slug)) respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Không tìm thấy trang phục.']], 404);
    $statement = $db->prepare('SELECT slug, code, name, description, image, price, categorySlug, gender, availability, minHeight, maxHeight, minWeight, maxWeight, tags, accessories, badge, badgeTone FROM CostumeProduct WHERE slug = :slug AND published = 1 LIMIT 1');
    $statement->execute(['slug' => $slug]);
    $row = $statement->fetch();
    if (!$row) respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Không tìm thấy trang phục.']], 404);
    respond(['data' => product($row)]);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    respond(['error' => ['code' => 'METHOD_NOT_ALLOWED', 'message' => 'Phương thức không được hỗ trợ.']], 405);
}

$path = rtrim((string) parse_url($_SERVER['REQUEST_URI'] ?? '/api', PHP_URL_PATH), '/');
try {
    if ($path === '/api/health') respond(['status' => 'ok']);
    $db = database();
    if ($path === '/api/ready') { $db->query('SELECT 1'); respond(['status' => 'ok']); }
    if ($path === '/api/products') listProducts($db);
    if ($path === '/api/product-categories') listCategories($db);
    if (preg_match('#^/api/products/([^/]+)$#', $path, $matches)) productDetail($db, $matches[1]);
    respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Không tìm thấy API.']], 404);
} catch (InvalidArgumentException $error) {
    respond(['error' => ['code' => 'INVALID_QUERY', 'message' => $error->getMessage()]], 400);
} catch (Throwable $error) {
    error_log('Thanh Y Cac API: ' . $error->getMessage());
    respond(['error' => ['code' => 'DATABASE_UNAVAILABLE', 'message' => 'Chưa kết nối được dữ liệu.']], 503);
}

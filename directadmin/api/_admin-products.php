<?php
declare(strict_types=1);

function adminProducts(bool $publicationOnly = false): never
{
    requireAdmin();
    $method = $publicationOnly ? requireMethod('GET', 'PATCH') : requireMethod('GET', 'POST', 'PATCH', 'DELETE');
    $db = database();
    if ($method === 'GET') {
        $rows = sql($db, "SELECT p.*, c.name AS categoryName, EXISTS(SELECT 1 FROM RentalRequest r WHERE r.productSlug = p.slug AND r.status = 'confirmed') AS isRented FROM CostumeProduct p JOIN ProductCategory c ON c.slug = p.categorySlug ORDER BY p.createdAt DESC, p.slug ASC")->fetchAll();
        respond(['data' => array_map(fn($row) => $publicationOnly
            ? ['code' => $row['code'], 'published' => (bool)$row['published']]
            : [...product($row), 'rentalStatus' => $row['isRented'] ? 'rented' : 'ready', 'categoryName' => $row['categoryName'], 'published' => (bool)$row['published']], $rows)]);
    }
    requireOrigin();
    if ($method === 'DELETE') {
        $codes = input(5000)['codes'] ?? null;
        if (!is_array($codes) || !array_is_list($codes) || count($codes) < 1 || count($codes) > 100) fail(422, 'INVALID_REQUEST', 'Danh sách mã không hợp lệ.');
        foreach ($codes as $code) if (!is_string($code) || !preg_match('/^[A-Za-z0-9-]{1,40}$/D', $code)) fail(422, 'INVALID_REQUEST', 'Mã trang phục không hợp lệ.');
        $codes = array_values(array_unique($codes));
        $marks = implode(',', array_fill(0, count($codes), '?'));
        $count = sql($db, "DELETE FROM CostumeProduct WHERE code IN ({$marks})", $codes)->rowCount();
        respond(['data' => ['deletedCount' => $count, 'codes' => $codes]]);
    }
    $body = input();
    $categoryMap = [];
    foreach ($db->query('SELECT name, slug FROM ProductCategory')->fetchAll() as $category) $categoryMap[$category['name']] = $category['slug'];
    $data = publication($body, $categoryMap);
    $db->beginTransaction();
    try {
        $existing = sql($db, 'SELECT code FROM CostumeProduct WHERE code = ? FOR UPDATE', [$data['code']])->fetch();
        if ($existing) {
            if ($method === 'POST') fail(409, 'CONFLICT', 'Mã trang phục đã tồn tại. Vui lòng tạo mã khác.');
            // Publication toggles intentionally do not overwrite stored product details.
            $changes = $publicationOnly ? ['published' => $data['published']] : $data;
            $sets = implode(', ', array_map(fn($key) => "`{$key}` = ?", array_keys($changes)));
            sql($db, "UPDATE CostumeProduct SET {$sets}, updatedAt = UTC_TIMESTAMP(3) WHERE code = ?", [...array_values($changes), $data['code']]);
        } elseif ($publicationOnly || $method === 'POST') {
            $columns = '`' . implode('`,`', array_keys($data)) . '`';
            $marks = implode(',', array_fill(0, count($data), '?'));
            sql($db, "INSERT INTO CostumeProduct ({$columns}, createdAt, updatedAt) VALUES ({$marks}, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))", array_values($data));
        } else fail(404, 'NOT_FOUND', 'Không tìm thấy trang phục cần cập nhật.');
        $row = sql($db, "SELECT p.*, c.name AS categoryName, EXISTS(SELECT 1 FROM RentalRequest r WHERE r.productSlug = p.slug AND r.status = 'confirmed') AS isRented FROM CostumeProduct p JOIN ProductCategory c ON c.slug = p.categorySlug WHERE p.code = ?", [$data['code']])->fetch();
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($e instanceof PDOException && in_array((int)($e->errorInfo[1] ?? 0), [1062, 1213], true)) fail(409, 'CONFLICT', 'Mã hoặc đường dẫn trang phục đã tồn tại. Vui lòng tải lại.');
        throw $e;
    }
    respond(['data' => $publicationOnly ? ['code' => $row['code'], 'published' => (bool)$row['published']] : [...product($row), 'published' => (bool)$row['published']]]);
}

function uploadImage(): never
{
    requireAdmin();
    requireMethod('POST');
    requireOrigin();
    if (str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data')) {
        $file = $_FILES['image'] ?? null;
        if (!is_array($file) || ($file['error'] ?? -1) !== UPLOAD_ERR_OK
            || !is_string($file['tmp_name'] ?? null) || !is_uploaded_file($file['tmp_name'])
            || !is_int($file['size'] ?? null) || $file['size'] < 1 || $file['size'] > 750000) {
            fail(422, 'INVALID_IMAGE', 'Ảnh không hợp lệ hoặc vượt quá dung lượng cho phép.');
        }
        $bytes = file_get_contents($file['tmp_name']);
        $info = $bytes !== false ? @getimagesizefromstring($bytes) : false;
        $format = match ($info['mime'] ?? '') { 'image/jpeg' => 'jpeg', 'image/png' => 'png', 'image/webp' => 'webp', default => '' };
    } else {
        // Keep older deployed frontend clients compatible during rollout.
        $image = input(1500000)['image'] ?? null;
        if (!is_string($image) || !preg_match('~^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$~D', $image, $matches)) fail(422, 'INVALID_IMAGE', 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
        $bytes = base64_decode($matches[2], true);
        $format = $matches[1];
    }
    $info = $bytes !== false ? @getimagesizefromstring($bytes) : false;
    if (!$bytes || strlen($bytes) > 750000 || !$info || $format === '' || ($info['mime'] ?? '') !== 'image/' . $format
        || $info[0] > 12000 || $info[1] > 12000) fail(422, 'INVALID_IMAGE', 'Ảnh không hợp lệ hoặc vượt quá dung lượng cho phép.');
    $directory = appConfig()['privateDirectory'] . '/uploads';
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Cannot create uploads directory');
    $filename = uuid() . '.' . ($format === 'jpeg' ? 'jpg' : $format);
    $handle = fopen($directory . '/' . $filename, 'xb');
    if (!$handle) throw new RuntimeException('Cannot store upload');
    try { if (fwrite($handle, $bytes) !== strlen($bytes)) throw new RuntimeException('Incomplete upload'); }
    finally { fclose($handle); }
    respond(['data' => ['url' => '/uploads/' . $filename]], 201);
}

function serveUpload(string $filename): never
{
    requireMethod('GET', 'HEAD');
    if (!preg_match('/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/iD', $filename, $match)) fail(404, 'NOT_FOUND', 'Không tìm thấy ảnh.');
    $file = appConfig()['privateDirectory'] . '/uploads/' . $filename;
    if (!is_file($file)) fail(404, 'NOT_FOUND', 'Không tìm thấy ảnh.');
    $type = strtolower($match[1]);
    header('Content-Type: image/' . (in_array($type, ['jpg', 'jpeg'], true) ? 'jpeg' : $type));
    header('Cache-Control: public, max-age=2592000, immutable');
    header("Content-Security-Policy: default-src 'none'; sandbox");
    header('Content-Length: ' . filesize($file));
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') readfile($file);
    exit;
}

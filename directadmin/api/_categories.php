<?php
declare(strict_types=1);

function adminCategories(): never
{
    requireAdmin();
    $method = requireMethod('GET', 'POST', 'PATCH', 'DELETE');
    $db = database();
    if ($method === 'GET') {
        $rows = $db->query('SELECT c.slug, c.name, c.codePrefix, c.position, COUNT(p.slug) AS productCount FROM ProductCategory c LEFT JOIN CostumeProduct p ON p.categorySlug = c.slug GROUP BY c.slug, c.name, c.codePrefix, c.position ORDER BY c.position, c.name')->fetchAll();
        respond(['data' => $rows]);
    }
    requireOrigin();
    $body = input(64000);
    $db->beginTransaction();
    try {
        $current = $db->query('SELECT slug FROM ProductCategory ORDER BY position, name FOR UPDATE')->fetchAll(PDO::FETCH_COLUMN);
        if ($method === 'PATCH' && array_key_exists('order', $body)) {
            $order = $body['order'];
            if (!is_array($order) || !array_is_list($order) || count(array_filter($order, 'is_string')) !== count($order)
                || count(array_unique($order)) !== count($order)) fail(422, 'INVALID_REQUEST', 'Thứ tự danh mục không hợp lệ.');
            $expected = $current; $actual = $order; sort($expected); sort($actual);
            if ($expected !== $actual) fail(409, 'CONFLICT', 'Danh sách danh mục đã thay đổi. Vui lòng tải lại trước khi sắp xếp.');
            foreach ($order as $position => $item) sql($db, 'UPDATE ProductCategory SET position = ? WHERE slug = ?', [$position, $item]);
            $db->commit();
            respond(['data' => ['order' => $order]]);
        }
    $slug = $body['slug'] ?? null;
    if (!is_string($slug) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 80) fail(422, 'INVALID_REQUEST', 'Đường dẫn danh mục không hợp lệ.');
        if ($method === 'DELETE') {
            // The product foreign key also guards against concurrent product creation.
            $count = sql($db, 'DELETE FROM ProductCategory WHERE slug = ?', [$slug])->rowCount();
            if (!$count) fail(404, 'NOT_FOUND', 'Không tìm thấy danh mục.');
        } else {
            $name = is_string($body['name'] ?? null) ? trim($body['name']) : '';
            $prefix = is_string($body['codePrefix'] ?? null) ? strtoupper(trim($body['codePrefix'])) : '';
            $position = $body['position'] ?? 0;
            if ($name === '' || textLength($name) > 191 || !preg_match('/^[A-Z]{2,10}$/D', $prefix) || !is_int($position) || $position < 0 || $position > 9999) fail(422, 'INVALID_REQUEST', 'Nhập tên, tiền tố 2–10 chữ cái và thứ tự từ 0–9999.');
            if ($method === 'POST') {
                foreach ($current as $index => $item) sql($db, 'UPDATE ProductCategory SET position = ? WHERE slug = ?', [$index + 1, $item]);
                sql($db, 'INSERT INTO ProductCategory (slug, name, codePrefix, position) VALUES (?, ?, ?, 0)', [$slug, $name, $prefix]);
            }
            else {
                if (!sql($db, 'SELECT slug FROM ProductCategory WHERE slug = ?', [$slug])->fetch()) fail(404, 'NOT_FOUND', 'Không tìm thấy danh mục.');
                sql($db, 'UPDATE ProductCategory SET name = ?, codePrefix = ? WHERE slug = ?', [$name, $prefix, $slug]);
            }
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if (!$e instanceof PDOException) throw $e;
        if ((int)($e->errorInfo[1] ?? 0) === 1062) fail(409, 'CONFLICT', 'Đường dẫn hoặc tiền tố mã đã tồn tại.');
        if ((int)($e->errorInfo[1] ?? 0) === 1451) fail(409, 'CATEGORY_IN_USE', 'Danh mục đang có trang phục. Hãy chuyển trang phục sang danh mục khác trước khi xóa.');
        throw $e;
    }
    respond(['data' => ['slug' => $slug]], $method === 'POST' ? 201 : 200);
}

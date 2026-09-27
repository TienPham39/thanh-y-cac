<?php
declare(strict_types=1);

function availability(): never
{
    requireMethod('GET');
    $slug = $_GET['slug'] ?? '';
    if (!is_string($slug) || !preg_match('/^[a-z0-9-]{1,100}$/D', $slug)) fail(422, 'INVALID_REQUEST', 'Mã trang phục không hợp lệ.');
    $db = database();
    if (!sql($db, 'SELECT slug FROM CostumeProduct WHERE slug = ? AND published = 1', [$slug])->fetch()) fail(404, 'NOT_FOUND', 'Không tìm thấy trang phục.');
    respond(['data' => sql($db, 'SELECT start, end FROM RentalRequest WHERE productSlug = ? AND status = ? AND end >= ? ORDER BY start ASC', [$slug, 'confirmed', today()])->fetchAll()]);
}

function createRental(): never
{
    requireMethod('POST');
    requireOrigin();
    $data = rentalInput(input(10000), today());
    $db = database();
    rateLimit($db, 'rental-phone:' . $data['phone'], 10, 600);
    rateLimit($db, 'rental-ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 30, 600);
    $db->beginTransaction();
    try {
        // Retries may reuse the same ID only with the identical request payload.
        $existing = sql($db, 'SELECT * FROM RentalRequest WHERE id = ? FOR UPDATE', [$data['id']])->fetch();
        if ($existing) {
            foreach ($data as $key => $value) if ((string)$existing[$key] !== (string)$value) fail(409, 'CONFLICT', 'Mã yêu cầu đã được dùng cho thông tin khác.');
            $db->commit();
            respond(['id' => $existing['id']], 201);
        }
        $product = sql($db, 'SELECT code, name, price, extraDay, deposit, accessoryFee FROM CostumeProduct WHERE slug = ? AND published = 1 FOR UPDATE', [$data['productSlug']])->fetch();
        if (!$product) fail(404, 'NOT_FOUND', 'Trang phục không còn nhận yêu cầu thuê.');
        if (sql($db, 'SELECT day FROM RentalReservedDay WHERE productSlug = ? AND day BETWEEN ? AND ? LIMIT 1', [$data['productSlug'], $data['start'], $data['end']])->fetch()) fail(409, 'CONFLICT', 'Khoảng ngày này đã được đặt. Vui lòng chọn ngày khác.');
        $data['productCode'] = $product['code'];
        $data['productName'] = $product['name'];
        $data['priceSnapshot'] = json_encode(rentalQuote($product, $data['start'], $data['end']), JSON_THROW_ON_ERROR);
        $columns = '`' . implode('`,`', array_keys($data)) . '`';
        $marks = implode(',', array_fill(0, count($data), '?'));
        sql($db, "INSERT INTO RentalRequest ({$columns}) VALUES ({$marks})", array_values($data));
        $db->commit();
        respond(['id' => $data['id']], 201);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($e instanceof PDOException && in_array((int)($e->errorInfo[1] ?? 0), [1062, 1213], true)) fail(409, 'CONFLICT', 'Yêu cầu vừa thay đổi. Vui lòng thử lại.');
        throw $e;
    }
}

function serializeRental(array $row): array
{
    $row['priceSnapshot'] = isset($row['priceSnapshot']) ? json_decode($row['priceSnapshot'], true, 32, JSON_THROW_ON_ERROR) : null;
    foreach (['readAt', 'createdAt', 'depositConfirmedAt', 'returnedAt'] as $key) if (isset($row[$key])) $row[$key] = (new DateTimeImmutable($row[$key], new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');
    foreach (['height', 'weight'] as $key) if (isset($row[$key])) $row[$key] = (int)$row[$key];
    return $row;
}

function adminRentals(): never
{
    requireAdmin();
    $method = requireMethod('GET', 'PATCH');
    $db = database();
    if ($method === 'GET') {
        $productCode = $_GET['productCode'] ?? '';
        if (!is_string($productCode) || strlen($productCode) > 40) fail(422, 'INVALID_REQUEST', 'Mã trang phục không hợp lệ.');
        if ($productCode !== '') respond(['data' => sql($db, 'SELECT id, start, end, name, phone FROM RentalRequest WHERE productCode = ? AND status = ? ORDER BY start ASC', [$productCode, 'confirmed'])->fetchAll()]);
        $unread = (int)sql($db, 'SELECT COUNT(*) FROM RentalRequest WHERE readAt IS NULL')->fetchColumn();
        if (($_GET['count'] ?? '') === '1') respond(['unread' => $unread]);
        $requestId = $_GET['requestId'] ?? '';
        if (!is_string($requestId) || strlen($requestId) > 36) fail(422, 'INVALID_REQUEST', 'Mã yêu cầu không hợp lệ.');
        if ($requestId !== '') {
            $rows = sql($db, 'SELECT * FROM RentalRequest WHERE id = ?', [$requestId])->fetchAll();
            respond(['data' => array_map('serializeRental', $rows), 'total' => count($rows), 'unread' => $unread, 'page' => 1, 'pageSize' => 6]);
        }
        $size = filter_var($_GET['pageSize'] ?? 6, FILTER_VALIDATE_INT) ?: 6;
        if (!in_array($size, [6, 12, 20, 50], true)) $size = 6;
        $total = (int)sql($db, 'SELECT COUNT(*) FROM RentalRequest')->fetchColumn();
        $page = min(max(1, (int)ceil($total / $size)), max(1, filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT) ?: 1));
        $offset = ($page - 1) * $size;
        $rows = sql($db, "SELECT * FROM RentalRequest ORDER BY createdAt DESC, id DESC LIMIT {$size} OFFSET {$offset}")->fetchAll();
        respond(['data' => array_map('serializeRental', $rows), 'total' => $total, 'unread' => $unread, 'page' => $page, 'pageSize' => $size]);
    }
    requireOrigin();
    $body = input(1000);
    $id = $body['id'] ?? null;
    $action = $body['action'] ?? 'read';
    if (!is_string($id) || strlen($id) !== 36 || !in_array($action, ['read', 'confirm', 'cancel', 'return'], true)) fail(422, 'INVALID_REQUEST', 'Yêu cầu không hợp lệ.');
    $db->beginTransaction();
    try {
        // Serialize confirm/cancel on the same request; unique days arbitrate different requests.
        $row = sql($db, 'SELECT * FROM RentalRequest WHERE id = ? FOR UPDATE', [$id])->fetch();
        if (!$row) fail(404, 'NOT_FOUND', 'Không tìm thấy yêu cầu.');
        if ($action === 'read') sql($db, 'UPDATE RentalRequest SET readAt = COALESCE(readAt, UTC_TIMESTAMP(3)) WHERE id = ?', [$id]);
        elseif ($action === 'cancel') {
            if ($row['status'] === 'completed') fail(409, 'CONFLICT', 'Đơn đã nhận lại đồ, không thể hủy.');
            sql($db, "UPDATE RentalRequest SET status = 'cancelled', readAt = COALESCE(readAt, UTC_TIMESTAMP(3)) WHERE id = ?", [$id]);
            sql($db, 'DELETE FROM RentalReservedDay WHERE requestId = ?', [$id]);
        } elseif ($action === 'return') {
            if (!in_array($row['status'], ['confirmed', 'completed'], true)) fail(409, 'CONFLICT', 'Chỉ nhận lại đồ của đơn đã chốt.');
            if ($row['status'] === 'confirmed') {
                sql($db, "UPDATE RentalRequest SET status = 'completed', returnedAt = UTC_TIMESTAMP(3), readAt = COALESCE(readAt, UTC_TIMESTAMP(3)) WHERE id = ?", [$id]);
                sql($db, 'DELETE FROM RentalReservedDay WHERE requestId = ? AND day >= ?', [$id, today()]);
            }
        } elseif ($row['status'] !== 'confirmed') {
            if ($row['status'] !== 'pending') fail(409, 'CONFLICT', 'Đơn đã hủy hoặc hoàn tất, không thể chốt lại.');
            if ($row['start'] < today()) fail(422, 'INVALID_REQUEST', 'Ngày nhận đã qua. Vui lòng tạo yêu cầu mới.');
            $days = reservationDays($row['start'], $row['end']);
            foreach ($days as $day) sql($db, 'INSERT INTO RentalReservedDay (productSlug, day, requestId) VALUES (?, ?, ?)', [$row['productSlug'], $day, $id]);
            sql($db, "UPDATE RentalRequest SET status = 'confirmed', depositConfirmedAt = UTC_TIMESTAMP(3), readAt = COALESCE(readAt, UTC_TIMESTAMP(3)) WHERE id = ?", [$id]);
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        if ($e instanceof PDOException && in_array((int)($e->errorInfo[1] ?? 0), [1062, 1213, 1205], true)) fail(409, 'CONFLICT', 'Lịch thuê bị trùng hoặc vừa được người khác xác nhận. Hãy tải lại lịch.');
        throw $e;
    }
    respond(['ok' => true, 'data' => serializeRental(sql($db, 'SELECT * FROM RentalRequest WHERE id = ?', [$id])->fetch())]);
}

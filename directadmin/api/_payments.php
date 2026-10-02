<?php
// Payment requests/webhooks use the payOS payment-requests HMAC format.
function paymentSignature(array $data, string $key): string
{
    ksort($data);
    $pairs = [];
    foreach ($data as $name => $value) {
        if ($value === null || $value === 'null' || $value === 'undefined') $value = '';
        if (is_array($value)) {
            $value = array_map(function ($entry) {
                if (is_array($entry) && !array_is_list($entry)) ksort($entry);
                return $entry;
            }, $value);
            $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        }
        $pairs[] = $name . '=' . (string)$value;
    }
    return hash_hmac('sha256', implode('&', $pairs), $key);
}
function verifiedPayment(array $data, string $signature): bool
{
    return preg_match('/^[a-f0-9]{64}$/iD', $signature) === 1 && hash_equals(paymentSignature($data, appConfig()['payosChecksumKey']), strtolower($signature));
}
function paymentReady(): bool
{
    $c = appConfig();
    return $c['payosClientId'] !== '' && $c['payosApiKey'] !== '' && $c['payosChecksumKey'] !== '' && function_exists('curl_init');
}
function paymentHold(PDO $db, string $slug, string $start, string $end): bool
{
    try { return (bool)sql($db, 'SELECT day FROM RentalPaymentHold WHERE productSlug = ? AND day BETWEEN ? AND ? AND expiresAt > UTC_TIMESTAMP(3) LIMIT 1', [$slug, $start, $end])->fetch(); }
    catch (PDOException $e) { if ((int)($e->errorInfo[1] ?? 0) === 1146) return false; throw $e; }
}
function checkoutInput(array $body): array
{
    $id = $body['id'] ?? ''; $token = $body['token'] ?? '';
    if (!is_string($id) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $id) || !is_string($token) || !preg_match('/^[a-f0-9]{64}$/D', $token)) fail(422, 'INVALID_REQUEST', 'Thông tin thanh toán không hợp lệ.');
    $items = $body['items'] ?? null;
    if (!is_array($items) || !array_is_list($items) || count($items) < 1 || count($items) > 8) fail(422, 'INVALID_REQUEST', 'Giỏ hàng tối đa 8 trang phục.');
    $rows = [];
    foreach ($items as $item) {
        if (!is_array($item)) fail(422, 'INVALID_REQUEST', 'Trang phục không hợp lệ.');
        $rental = rentalInput([...$body, ...$item, 'id' => $id], today());
        if (isset($rows[$rental['productSlug']])) fail(422, 'INVALID_REQUEST', 'Mỗi trang phục chỉ chọn một lần.');
        $rows[$rental['productSlug']] = $rental;
    }
    ksort($rows);
    return [$id, $token, $rows];
}
function checkoutApi(): never
{
    $method = requireMethod('GET', 'POST');
    if ($method === 'GET') respond(['enabled' => paymentReady(), 'mode' => 'deposit', 'bank' => bankDetails()]);
    requireOrigin();
    $body = input(24000);
    [$id, $token, $rows] = checkoutInput($body);
    $selected = $body['method'] ?? 'bank_transfer';
    if (!in_array($selected, ['payos', 'bank_transfer'], true)) fail(422, 'INVALID_REQUEST', 'Phương thức không hợp lệ.');
    $hash = hash('sha256', json_encode([$rows, $selected], JSON_THROW_ON_ERROR));
    $db = database();
    rateLimit($db, 'checkout-ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 20, 600);
    rateLimit($db, 'checkout-phone:' . reset($rows)['phone'], 10, 600);
    $db->beginTransaction();
    try {
        $existing = sql($db, 'SELECT * FROM RentalCheckout WHERE id = ? FOR UPDATE', [$id])->fetch();
        if ($existing) {
            if (!hash_equals($existing['tokenHash'], hash('sha256', $token)) || !hash_equals($existing['payloadHash'], $hash)) fail(409, 'CONFLICT', 'Mã thanh toán đã dùng cho thông tin khác.');
            $db->commit();
            if ($existing['state'] === 'pending' && !$existing['checkoutUrl'] && strtotime($existing['expiresAt'] . ' UTC') > time()) createPayosLink($existing);
            checkoutResponse($id, $token);
        }
        $total = 0; $amount = 0; $products = [];
        foreach ($rows as $slug => $rental) {
            $product = sql($db, 'SELECT code, name, price, extraDay, deposit, accessoryFee FROM CostumeProduct WHERE slug = ? AND published = 1 FOR UPDATE', [$slug])->fetch();
            if (!$product) fail(404, 'NOT_FOUND', 'Trang phục không còn nhận thuê.');
            if (sql($db, 'SELECT day FROM RentalReservedDay WHERE productSlug = ? AND day BETWEEN ? AND ? LIMIT 1', [$slug, $rental['start'], $rental['end']])->fetch() || paymentHold($db, $slug, $rental['start'], $rental['end'])) fail(409, 'CONFLICT', 'Lịch của ' . $product['name'] . ' vừa được đặt. Chọn ngày khác.');
            $quote = rentalQuote($product, $rental['start'], $rental['end']);
            $products[$slug] = [$product, $quote]; $total += $quote['total']; $amount += $quote['deposit'];
        }
        $online = $amount > 0 && $selected === 'payos';
        if ($online && !paymentReady()) fail(503, 'PAYMENT_NOT_CONFIGURED', 'Thanh toán online chưa được mở. Vui lòng chọn chuyển khoản thủ công.');
        // Stay within the provider's integer amount range.
        if ($amount > 2147483647) fail(422, 'INVALID_PRICE', 'Tổng cọc vượt giới hạn thanh toán.');
        $orderCode = (int)(microtime(true) * 1000) * 1000 + random_int(0, 999);
        $expires = gmdate('Y-m-d H:i:s', time() + 900);
        sql($db, 'INSERT INTO RentalCheckout (id, tokenHash, payloadHash, orderCode, amount, total, state, paymentMethod, expiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [$id, hash('sha256', $token), $hash, $orderCode, $amount, $total, $online ? 'pending' : 'manual', $selected, $expires]);
        foreach ($rows as $slug => $rental) {
            [$product, $quote] = $products[$slug]; $rental['id'] = uuid();
            $rental['productCode'] = $product['code']; $rental['productName'] = $product['name']; $rental['priceSnapshot'] = json_encode($quote, JSON_THROW_ON_ERROR);
            $columns = '`' . implode('`,`', array_keys($rental)) . '`'; $marks = implode(',', array_fill(0, count($rental), '?'));
            sql($db, "INSERT INTO RentalRequest ({$columns}) VALUES ({$marks})", array_values($rental));
            sql($db, 'INSERT INTO RentalCheckoutItem (checkoutId, requestId, online) VALUES (?, ?, ?)', [$id, $rental['id'], (int)($online && $quote['deposit'] > 0)]);
            if ($online && $quote['deposit'] > 0) {
                sql($db, 'DELETE FROM RentalPaymentHold WHERE productSlug = ? AND expiresAt <= UTC_TIMESTAMP(3)', [$slug]);
                foreach (reservationDays($rental['start'], $rental['end']) as $day) sql($db, 'INSERT INTO RentalPaymentHold (productSlug, day, checkoutId, expiresAt) VALUES (?, ?, ?, ?)', [$slug, $day, $id, $expires]);
            }
        }
        $db->commit();
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); if ($e instanceof PDOException && in_array((int)($e->errorInfo[1] ?? 0), [1062, 1213, 1205], true)) fail(409, 'CONFLICT', 'Lịch vừa thay đổi. Vui lòng thử lại.'); throw $e; }
    if ($online) createPayosLink(sql($db, 'SELECT * FROM RentalCheckout WHERE id = ?', [$id])->fetch());
    checkoutResponse($id, $token);
}
function createPayosLink(array $checkout): void
{
    $c = appConfig();
    $return = rtrim($c['appOrigin'], '/') . '/ket-qua-thanh-toan/?id=' . rawurlencode($checkout['id']);
    $fields = ['amount' => (int)$checkout['amount'], 'cancelUrl' => $return, 'description' => 'TYC' . substr(str_replace('-', '', $checkout['id']), 0, 6), 'orderCode' => (int)$checkout['orderCode'], 'returnUrl' => $return];
    $payload = [...$fields, 'expiredAt' => strtotime($checkout['expiresAt'] . ' UTC'), 'signature' => paymentSignature($fields, $c['payosChecksumKey'])];
    $ch = curl_init('https://api-merchant.payos.vn/v2/payment-requests');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR), CURLOPT_TIMEOUT => 15, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-client-id: ' . $c['payosClientId'], 'x-api-key: ' . $c['payosApiKey']]]);
    $raw = curl_exec($ch); $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    $result = json_decode((string)$raw, true); $data = $result['data'] ?? null;
    if ($status < 200 || $status >= 300 || ($result['code'] ?? '') !== '00' || !is_array($data) || !is_string($result['signature'] ?? null) || !verifiedPayment($data, $result['signature']) || (int)($data['amount'] ?? -1) !== (int)$checkout['amount'] || (int)($data['orderCode'] ?? 0) !== (int)$checkout['orderCode']) {
        // Recover a link created before a response was lost. Never create another order code.
        $ch = curl_init('https://api-merchant.payos.vn/v2/payment-requests/' . $checkout['orderCode']);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_HTTPHEADER => ['x-client-id: ' . $c['payosClientId'], 'x-api-key: ' . $c['payosApiKey']]]);
        $raw = curl_exec($ch); $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
        $result = json_decode((string)$raw, true); $data = $result['data'] ?? null;
        if ($status === 200 && ($result['code'] ?? '') === '00' && is_array($data) && is_string($result['signature'] ?? null) && verifiedPayment($data, $result['signature']) && (int)($data['amount'] ?? -1) === (int)$checkout['amount'] && (int)($data['orderCode'] ?? 0) === (int)$checkout['orderCode'] && is_string($data['id'] ?? null) && preg_match('/^[a-f0-9]{32}$/D', $data['id'])) {
            sql(database(), 'UPDATE RentalCheckout SET checkoutUrl = ? WHERE id = ?', ['https://pay.payos.vn/web/' . $data['id'], $checkout['id']]);
            return;
        }
        fail(502, 'PAYMENT_UNAVAILABLE', 'Chưa lấy được liên kết payOS. Đơn đang giữ tạm 15 phút. Hãy thử lại cùng đơn hoặc liên hệ cửa hàng, không tạo đơn mới.');
    }
    $url = $data['checkoutUrl'] ?? '';
    if (!is_string($url) || parse_url($url, PHP_URL_SCHEME) !== 'https' || parse_url($url, PHP_URL_HOST) !== 'pay.payos.vn' || empty($data['qrCode'])) fail(502, 'INVALID_PAYMENT', 'Thông tin thanh toán không hợp lệ.');
    sql(database(), 'UPDATE RentalCheckout SET checkoutUrl = ?, qrCode = ? WHERE id = ?', [$url, $data['qrCode'], $checkout['id']]);
}
function checkoutResponse(string $id, string $token): never
{
    $db = database();
    $row = sql($db, 'SELECT * FROM RentalCheckout WHERE id = ?', [$id])->fetch();
    if (!$row || !hash_equals($row['tokenHash'], hash('sha256', $token))) fail(404, 'NOT_FOUND', 'Không tìm thấy đơn thanh toán.');
    $state = $row['state'] === 'pending' && strtotime($row['expiresAt'] . ' UTC') <= time() ? 'expired' : $row['state'];
    $items = sql($db, 'SELECT r.id, r.productSlug, r.productCode, r.productName, r.start, r.end, r.status, r.priceSnapshot, i.online FROM RentalCheckoutItem i JOIN RentalRequest r ON r.id = i.requestId WHERE i.checkoutId = ?', [$id])->fetchAll();
    foreach ($items as &$item) { $item['priceSnapshot'] = json_decode($item['priceSnapshot'], true); $item['online'] = (bool)$item['online']; } unset($item);
    if ($state === 'manual' && count(array_filter($items, fn($i) => in_array($i['status'], ['confirmed', 'completed'], true))) === count($items)) $state = 'confirmed';
    if ($state === 'manual' && count(array_filter($items, fn($i) => $i['status'] === 'cancelled')) > 0) {
        $state = count(array_filter($items, fn($i) => $i['status'] === 'cancelled')) === count($items) ? 'cancelled' : 'review';
        $row['reviewReason'] = $state === 'review' ? 'Đơn có trang phục đã hủy. Liên hệ cửa hàng xác nhận lại số tiền trước khi chuyển khoản.' : $row['reviewReason'];
    }
    respond(['data' => ['id' => $id, 'state' => $state, 'paymentMethod' => $row['paymentMethod'], 'amount' => (int)$row['amount'], 'total' => (int)$row['total'], 'remaining' => (int)$row['total'] - (int)$row['amount'], 'expiresAt' => str_replace(' ', 'T', $row['expiresAt']) . 'Z', 'checkoutUrl' => $state === 'pending' ? $row['checkoutUrl'] : null, 'qrCode' => $state === 'pending' ? $row['qrCode'] : null, 'reviewReason' => $row['reviewReason'], 'bank' => bankDetails(), 'transferContent' => 'TYC ' . $row['orderCode'], 'items' => $items]]);
}
function bankDetails(): array
{
    $c = appConfig();
    return ['name' => $c['paymentBank'], 'account' => $c['paymentAccount'], 'holder' => $c['paymentAccountName']];
}
function checkoutLookup(): never
{
    requireMethod('POST'); requireOrigin(); $body = input(1000);
    if (!is_string($body['id'] ?? null) || strlen($body['id']) > 36 || !is_string($body['token'] ?? null) || !preg_match('/^[a-f0-9]{64}$/D', $body['token'])) fail(422, 'INVALID_REQUEST', 'Thiếu mã truy cập đơn.');
    rateLimit(database(), 'payment-lookup:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 120, 60);
    if (($body['retry'] ?? false) === true) {
        $row = sql(database(), 'SELECT * FROM RentalCheckout WHERE id = ?', [$body['id']])->fetch();
        if (!$row || !hash_equals($row['tokenHash'], hash('sha256', $body['token']))) fail(404, 'NOT_FOUND', 'Không tìm thấy đơn thanh toán.');
        if ($row['state'] === 'pending' && !$row['checkoutUrl'] && strtotime($row['expiresAt'] . ' UTC') > time()) {
            rateLimit(database(), 'payment-retry:' . $row['id'], 10, 600);
            createPayosLink($row);
        }
    }
    checkoutResponse($body['id'], $body['token']);
}
function paymentWebhook(): never
{
    requireMethod('POST');
    if (!paymentReady()) fail(503, 'PAYMENT_NOT_CONFIGURED', 'Chưa cấu hình thanh toán.');
    $body = input(16000); $data = $body['data'] ?? null;
    if (!is_array($data) || !is_string($body['signature'] ?? null) || !verifiedPayment($data, $body['signature'])) fail(401, 'INVALID_SIGNATURE', 'Chữ ký không hợp lệ.');
    if (($data['code'] ?? '') !== '00' || ($data['currency'] ?? '') !== 'VND') respond(['ok' => true]);
    if (!is_int($data['orderCode'] ?? null) || !is_int($data['amount'] ?? null) || !is_string($data['reference'] ?? null) || strlen($data['reference']) < 1 || strlen($data['reference']) > 191) fail(422, 'INVALID_PAYMENT', 'Giao dịch không hợp lệ.');
    settleCheckout($data);
    respond(['ok' => true]);
}
function settleCheckout(array $data): void
{
    $db = database(); $db->beginTransaction();
    try {
        $checkout = sql($db, 'SELECT * FROM RentalCheckout WHERE orderCode = ? FOR UPDATE', [$data['orderCode']])->fetch();
        if (!$checkout) { $db->commit(); return; } // payOS webhook validation sample.
        if ((int)$checkout['amount'] !== $data['amount']) fail(422, 'AMOUNT_MISMATCH', 'Số tiền không khớp.');
        if (in_array($checkout['state'], ['paid', 'review'], true)) {
            if ($checkout['transactionRef'] !== $data['reference']) fail(409, 'DUPLICATE_PAYMENT', 'Đơn đã nhận một giao dịch khác.');
            $db->commit(); return;
        }
        $rows = sql($db, 'SELECT r.* FROM RentalCheckoutItem i JOIN RentalRequest r ON r.id = i.requestId WHERE i.checkoutId = ? AND i.online = 1 ORDER BY r.productSlug', [$checkout['id']])->fetchAll();
        $valid = $checkout['state'] === 'pending' && strtotime($checkout['expiresAt'] . ' UTC') > time();
        foreach ($rows as $row) {
            sql($db, 'SELECT slug FROM CostumeProduct WHERE slug = ? FOR UPDATE', [$row['productSlug']]);
            $current = sql($db, 'SELECT status FROM RentalRequest WHERE id = ? FOR UPDATE', [$row['id']])->fetchColumn();
            $days = reservationDays($row['start'], $row['end']);
            $holds = (int)sql($db, 'SELECT COUNT(*) FROM RentalPaymentHold WHERE checkoutId = ? AND productSlug = ? AND expiresAt > UTC_TIMESTAMP(3)', [$checkout['id'], $row['productSlug']])->fetchColumn();
            if ($current !== 'pending' || $row['start'] < today() || $holds !== count($days) || sql($db, 'SELECT day FROM RentalReservedDay WHERE productSlug = ? AND day BETWEEN ? AND ? LIMIT 1', [$row['productSlug'], $row['start'], $row['end']])->fetch()) $valid = false;
        }
        if ($valid) foreach ($rows as $row) {
            foreach (reservationDays($row['start'], $row['end']) as $day) sql($db, 'INSERT INTO RentalReservedDay (productSlug, day, requestId) VALUES (?, ?, ?)', [$row['productSlug'], $day, $row['id']]);
            sql($db, "UPDATE RentalRequest SET status = 'confirmed', depositConfirmedAt = UTC_TIMESTAMP(3) WHERE id = ?", [$row['id']]);
        }
        sql($db, 'UPDATE RentalCheckout SET state = ?, transactionRef = ?, reviewReason = ? WHERE id = ?', [$valid ? 'paid' : 'review', $data['reference'], $valid ? null : 'Đã nhận tiền nhưng lịch hết hạn hoặc đơn đã thay đổi. Cần đối soát/hoàn tiền.', $checkout['id']]);
        sql($db, 'DELETE FROM RentalPaymentHold WHERE checkoutId = ?', [$checkout['id']]);
        $db->commit();
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
}

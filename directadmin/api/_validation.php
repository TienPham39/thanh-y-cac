<?php
declare(strict_types=1);

function textLength(string $text): int { return function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text); }
function safeImage(mixed $value): bool { return is_string($value) && strlen($value) <= 500 && preg_match('~^/(?:images|uploads)/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)$~iD', $value) === 1; }

function publication(array $row, ?array $categoryMap = null): array
{
    $categories = ['Cung đình' => 'duong-trieu', 'Tiên hiệp' => 'kiem-hiep', 'Cổ phục' => 'minh-trieu', 'Hỷ phục' => 'han-trieu', 'Dân Quốc' => 'dan-quoc', 'Kiếm hiệp' => 'kiem-hiep'];
    if ($categoryMap !== null) $categories = $categoryMap + array_filter($categories, fn($slug) => in_array($slug, $categoryMap, true));
    $badges = ['Nổi bật' => 'red', 'Mẫu mới' => 'green', 'Được yêu thích' => 'gold'];
    foreach (['code', 'slug', 'name', 'description', 'category', 'gender', 'status', 'tags', 'badge'] as $key) {
        if (!is_string($row[$key] ?? null)) fail(422, 'INVALID_REQUEST', 'Thông tin trang phục không hợp lệ.');
    }
    if (!preg_match('/^[A-Za-z0-9-]{1,40}$/D', $row['code']) || !preg_match('/^[a-z0-9-]{1,100}$/D', $row['slug'])
        || !is_bool($row['published'] ?? null) || trim($row['name']) === '' || textLength($row['name']) > 191
        || textLength($row['description']) > 10000 || !is_int($row['price'] ?? null) || $row['price'] < 0 || $row['price'] > 2147483647
        || !isset($categories[$row['category']]) || !in_array($row['gender'], ['Nữ', 'Nam', 'Unisex'], true)
        || textLength($row['tags']) > 1000 || textLength($row['badge']) > 80
        || (isset($row['accessories']) && (!is_string($row['accessories']) || textLength($row['accessories']) > 1000))) fail(422, 'INVALID_REQUEST', 'Thông tin trang phục không hợp lệ.');
    foreach (['minHeight', 'maxHeight', 'minWeight', 'maxWeight'] as $key) {
        if (!is_int($row[$key] ?? null) || $row[$key] < 0 || $row[$key] > 300) fail(422, 'INVALID_REQUEST', 'Số đo không hợp lệ.');
    }
    if ($row['minHeight'] > $row['maxHeight'] || $row['minWeight'] > $row['maxWeight']) fail(422, 'INVALID_REQUEST', 'Khoảng số đo không hợp lệ.');
    if (array_key_exists('images', $row) && (!is_array($row['images']) || !array_is_list($row['images']) || count($row['images']) < 1 || count($row['images']) > 8 || count(array_filter($row['images'], 'safeImage')) !== count($row['images']))) fail(422, 'INVALID_REQUEST', 'Danh sách ảnh không hợp lệ.');
    $images = isset($row['images']) ? array_values(array_unique($row['images'])) : null;
    $split = fn(string $s) => array_values(array_filter(array_map('trim', explode(',', $s)), fn($v) => $v !== ''));
    $result = [
        'code' => $row['code'], 'slug' => $row['slug'], 'name' => trim($row['name']), 'description' => $row['description'],
        'image' => $images[0] ?? (safeImage($row['image'] ?? null) ? $row['image'] : '/images/logo.png'),
        'price' => $row['price'], 'categorySlug' => $categories[$row['category']],
        'gender' => ['Nữ' => 'female', 'Nam' => 'male', 'Unisex' => 'unisex'][$row['gender']],
        'availability' => 'available',
        'minHeight' => $row['minHeight'], 'maxHeight' => $row['maxHeight'], 'minWeight' => $row['minWeight'], 'maxWeight' => $row['maxWeight'],
        'tags' => json_encode($split($row['tags']), JSON_THROW_ON_ERROR), 'accessories' => json_encode($split($row['accessories'] ?? ''), JSON_THROW_ON_ERROR),
        'badge' => $row['badge'], 'badgeTone' => $badges[$row['badge']] ?? 'red', 'published' => (int)$row['published'],
    ];
    if ($images !== null) $result['images'] = json_encode($images, JSON_THROW_ON_ERROR);
    foreach (['extraDay', 'deposit', 'accessoryFee'] as $key) {
        if (!array_key_exists($key, $row)) continue;
        if (!is_int($row[$key]) || $row[$key] < 0 || $row[$key] > 2147483647) fail(422, 'INVALID_REQUEST', 'Giá thuê, phụ thu và cọc phải là số nguyên không âm.');
        $result[$key] = $row[$key];
    }
    if (isset($row['deposit']) && $row['deposit'] > $row['price'] + ($row['accessoryFee'] ?? 0)) fail(422, 'INVALID_REQUEST', 'Cọc giữ lịch không được vượt tổng tiền thuê một ngày.');
    return $result;
}

function validDate(string $value): bool
{
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value, new DateTimeZone('UTC'));
    return preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value) === 1 && $date && $date->format('Y-m-d') === $value;
}

function reservationDays(string $start, string $end): array
{
    if (!validDate($start) || !validDate($end) || $end < $start) fail(422, 'INVALID_REQUEST', 'Ngày thuê không hợp lệ.');
    $from = new DateTimeImmutable($start, new DateTimeZone('UTC'));
    $count = (int)$from->diff(new DateTimeImmutable($end, new DateTimeZone('UTC')))->days + 1;
    if ($count > 366) fail(422, 'INVALID_REQUEST', 'Khoảng thuê tối đa 366 ngày.');
    $days = [];
    for ($i = 0; $i < $count; $i++) $days[] = $from->modify("+{$i} days")->format('Y-m-d');
    return $days;
}

function rentalInput(array $v, string $today): array
{
    $result = [];
    foreach (['id', 'productSlug', 'name', 'phone', 'start', 'end', 'note'] as $key) $result[$key] = is_string($v[$key] ?? null) ? trim($v[$key]) : '';
    $result['phone'] = preg_replace('/[\s().-]/', '', $result['phone']);
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $result['id'])
        || !preg_match('/^[a-z0-9-]{1,100}$/D', $result['productSlug']) || $result['name'] === '' || textLength($result['name']) > 120
        || !preg_match('/^(0\d{9}|\+84\d{9})$/D', $result['phone']) || $result['start'] < $today || textLength($result['note']) > 2000) fail(422, 'INVALID_REQUEST', 'Kiểm tra họ tên, số điện thoại và ngày thuê.');
    reservationDays($result['start'], $result['end']);
    foreach (['height' => [100, 230], 'weight' => [25, 200]] as $key => [$min, $max]) {
        $value = $v[$key] ?? null;
        if ($value === null || $value === '') { $result[$key] = null; continue; }
        if ((!is_int($value) && !is_string($value)) || !is_numeric($value) || (float)$value !== (float)(int)$value || (int)$value < $min || (int)$value > $max) fail(422, 'INVALID_REQUEST', 'Số đo không hợp lệ.');
        $result[$key] = (int)$value;
    }
    return $result;
}

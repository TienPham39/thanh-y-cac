<?php
function adminDashboard(): never
{
    requireAdmin();
    requireMethod('GET');
    $db = database();
    $zone = new DateTimeZone('Asia/Ho_Chi_Minh');
    $start = $_GET['start'] ?? today(); $end = $_GET['end'] ?? today();
    foreach ([$start, $end] as $date) {
        if (!is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date)) fail(422, 'INVALID_QUERY', 'Ngày không hợp lệ.');
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date, $zone);
        if (!$parsed || $parsed->format('Y-m-d') !== $date) fail(422, 'INVALID_QUERY', 'Ngày không hợp lệ.');
    }
    $from = new DateTimeImmutable($start, $zone); $to = new DateTimeImmutable($end, $zone);
    if ($from > $to || $from->diff($to)->days > 730) fail(422, 'INVALID_QUERY', 'Chọn khoảng ngày tối đa 2 năm.');
    $daily = $from->diff($to)->days <= 31;
    $states = ['pending' => 0, 'confirmed' => 0, 'completed' => 0, 'cancelled' => 0];
    $months = [];
    for ($cursor = $daily ? $from : $from->modify('first day of this month'); $cursor <= $to; $cursor = $cursor->modify($daily ? '+1 day' : '+1 month')) {
        $months[$cursor->format($daily ? 'Y-m-d' : 'Y-m')] = ['month' => $cursor->format($daily ? 'd/m' : 'm/Y'), 'value' => 0, 'orders' => 0];
    }
    $value = 0; $deposit = 0; $missing = 0; $top = [];
    $utc = new DateTimeZone('UTC');
    $rows = sql($db, 'SELECT productCode, productName, status, priceSnapshot, createdAt FROM RentalRequest WHERE createdAt >= ? AND createdAt < ?', [$from->setTimezone($utc)->format('Y-m-d H:i:s'), $to->modify('+1 day')->setTimezone($utc)->format('Y-m-d H:i:s')]);
    while ($row = $rows->fetch()) {
        $states[$row['status']]++;
        $month = (new DateTimeImmutable($row['createdAt'], $utc))->setTimezone($zone)->format($daily ? 'Y-m-d' : 'Y-m');
        $months[$month]['orders']++;
        if (!in_array($row['status'], ['confirmed', 'completed'], true)) continue;
        $snapshot = $row['priceSnapshot'] ? json_decode($row['priceSnapshot'], true, 32, JSON_THROW_ON_ERROR) : null;
        if (!$snapshot) $missing++;
        $amount = (int)($snapshot['total'] ?? 0);
        $value += $amount;
        $deposit += (int)($snapshot['deposit'] ?? 0);
        $months[$month]['value'] += $amount;
        $code = $row['productCode'];
        if (!isset($top[$code])) $top[$code] = ['code' => $code, 'name' => $row['productName'], 'orders' => 0];
        $top[$code]['orders']++;
    }
    usort($top, fn($a, $b) => $b['orders'] <=> $a['orders'] ?: strcmp($a['code'], $b['code']));
    respond(['start' => $start, 'end' => $end, 'total' => array_sum($states), 'value' => $value, 'deposit' => $deposit, 'missing' => $missing, 'states' => $states, 'months' => array_values($months), 'top' => array_slice($top, 0, 5)]);
}

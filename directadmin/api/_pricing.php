<?php
declare(strict_types=1);

function rentalQuote(array $product, string $start, string $end): array
{
    $days = max(1, (int)(new DateTimeImmutable($start))->diff(new DateTimeImmutable($end))->days);
    $price = (int)$product['price'];
    $extraDay = (int)($product['extraDay'] ?? $price);
    $accessoryFee = (int)($product['accessoryFee'] ?? 0);
    $total = $price + ($days - 1) * $extraDay + $accessoryFee;
    $deposit = (int)($product['deposit'] ?? 0);
    if ($deposit > $total) fail(422, 'INVALID_PRICE', 'Tiền cọc vượt tổng tiền thuê. Vui lòng liên hệ cửa hàng.');
    return ['days' => $days, 'price' => $price, 'extraDay' => $extraDay, 'accessoryFee' => $accessoryFee, 'total' => $total, 'deposit' => $deposit, 'remaining' => $total - $deposit];
}

<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
require dirname(__DIR__) . '/directadmin/api/_core.php';
$db = database();
$exists = sql($db, "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct'")->fetchColumn();
if (!$exists) {
    if (!in_array('--bootstrap', $argv, true)) throw new RuntimeException('Import directadmin/database.sql first, or use --bootstrap for a new database');
    $db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/database.sql'));
}
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/001-php-api.sql'));
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/002-categories.sql'));
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/003-rental-return.sql'));
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/004-rental-pricing.sql'));
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/005-product-components.sql'));

$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/006-product-statistics.sql'));
echo "PHP API schema migration complete.\n";
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/007-internal-users.sql'));
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/008-payos-checkout.sql'));

<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
$name = getenv('DB_NAME');
if (!preg_match('/^tyc_test_[a-f0-9]{12}$/D', $name ?: '')) throw new RuntimeException('Only isolated test databases are allowed');
$db = new PDO(sprintf('mysql:host=%s;port=%d;charset=utf8mb4', getenv('DB_HOST') ?: '127.0.0.1', (int)(getenv('DB_PORT') ?: 3306)), getenv('DB_USER'), getenv('DB_PASSWORD'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if (($argv[1] ?? '') === 'drop') { $db->exec("DROP DATABASE IF EXISTS `{$name}`"); exit; }
if (($argv[1] ?? '') === 'payment-fixture') {
    $db->exec("USE `{$name}`");
    // Exercise signed webhook settlement without contacting a payment provider.
    $id = $argv[2];
    $db->beginTransaction();
    $s = $db->prepare("UPDATE RentalCheckout SET state = 'pending', paymentMethod = 'payos', expiresAt = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 15 MINUTE) WHERE id = ?"); $s->execute([$id]);
    $s = $db->prepare('SELECT r.* FROM RentalCheckoutItem i JOIN RentalRequest r ON r.id = i.requestId WHERE i.checkoutId = ?'); $s->execute([$id]);
    foreach ($s->fetchAll(PDO::FETCH_ASSOC) as $row) {
        if (json_decode($row['priceSnapshot'], true)['deposit'] === 0) continue;
        $q = $db->prepare('UPDATE RentalCheckoutItem SET online = 1 WHERE requestId = ?'); $q->execute([$row['id']]);
        for ($day = $row['start']; $day <= $row['end']; $day = gmdate('Y-m-d', strtotime($day . ' UTC') + 86400)) {
            $q = $db->prepare('INSERT INTO RentalPaymentHold (productSlug, day, checkoutId, expiresAt) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 15 MINUTE))'); $q->execute([$row['productSlug'], $day, $id]);
        }
    }
    if (($argv[3] ?? '') === 'expired') { $s = $db->prepare('UPDATE RentalCheckout SET expiresAt = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 MINUTE) WHERE id = ?'); $s->execute([$id]); }
    $db->commit(); exit;
}
$db->exec("CREATE DATABASE `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$db->exec("USE `{$name}`");
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/database.sql'));
// Starting with the old schema also checks the upgrade path; running twice checks repeatability.
$migration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/001-php-api.sql');
$db->exec($migration);
$db->exec($migration);
$categoriesMigration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/002-categories.sql');
$db->exec($categoriesMigration);
$db->exec($categoriesMigration);
$returnMigration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/003-rental-return.sql');
$db->exec($returnMigration);
$db->exec($returnMigration);
$componentsMigration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/005-product-components.sql');
$db->exec($componentsMigration);
$db->exec($componentsMigration);
$pricingMigration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/004-rental-pricing.sql');
$db->exec($pricingMigration);
$db->exec($pricingMigration);
$statisticsMigration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/006-product-statistics.sql');
$db->exec($statisticsMigration);
$db->exec($statisticsMigration);
$directory = getenv('TYC_PRIVATE_DIR');
$usersMigration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/007-internal-users.sql');
$db->exec($usersMigration);
$db->exec($usersMigration);
$paymentMigration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/008-payos-checkout.sql');
$db->exec($paymentMigration);
$db->exec($paymentMigration);
if (!is_dir($directory)) mkdir($directory, 0700, true);
file_put_contents($directory . '/config.php', '<?php return ' . var_export([
    'adminEmail' => 'test@example.com', 'adminPasswordHash' => password_hash('local-test-password', PASSWORD_DEFAULT),
], true) . ';');

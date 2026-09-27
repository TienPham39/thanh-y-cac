<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit(1);
$name = getenv('DB_NAME');
if (!preg_match('/^tyc_test_[a-f0-9]{12}$/D', $name ?: '')) throw new RuntimeException('Only isolated test databases are allowed');
$db = new PDO(sprintf('mysql:host=%s;port=%d;charset=utf8mb4', getenv('DB_HOST') ?: '127.0.0.1', (int)(getenv('DB_PORT') ?: 3306)), getenv('DB_USER'), getenv('DB_PASSWORD'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
if (($argv[1] ?? '') === 'drop') { $db->exec("DROP DATABASE IF EXISTS `{$name}`"); exit; }
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
$pricingMigration = file_get_contents(dirname(__DIR__) . '/directadmin/migrations/004-rental-pricing.sql');
$db->exec($pricingMigration);
$db->exec($pricingMigration);
$directory = getenv('TYC_PRIVATE_DIR');
if (!is_dir($directory)) mkdir($directory, 0700, true);
file_put_contents($directory . '/config.php', '<?php return ' . var_export([
    'adminEmail' => 'test@example.com', 'adminPasswordHash' => password_hash('local-test-password', PASSWORD_DEFAULT),
], true) . ';');

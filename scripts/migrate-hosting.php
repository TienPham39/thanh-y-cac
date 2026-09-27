<?php
declare(strict_types=1);
// CLI only: use the existing hosting configuration; never expose a web migrator.
if (PHP_SAPI !== 'cli') exit(1);
$api = $argv[1] ?? '';
if (!is_file($api . '/_core.php') || !is_file($api . '/_config.php')) throw new RuntimeException('Existing hosting API configuration was not found');
require $api . '/_core.php';
$db = database();
if ((int)$db->query("SELECT GET_LOCK('tyc_schema_migration', 60)")->fetchColumn() !== 1) throw new RuntimeException('Another migration is running');
try {
    $db->exec('CREATE TABLE IF NOT EXISTS SchemaMigration (name VARCHAR(191) PRIMARY KEY, appliedAt DATETIME NOT NULL) ENGINE=InnoDB');
    foreach (glob(__DIR__ . '/migrations/*.sql') as $file) {
        $name = basename($file);
        if (sql($db, 'SELECT name FROM SchemaMigration WHERE name = ?', [$name])->fetch()) continue;
        echo "Applying {$name}\n";
        $db->exec(file_get_contents($file));
        sql($db, 'INSERT INTO SchemaMigration (name, appliedAt) VALUES (?, UTC_TIMESTAMP())', [$name]);
    }
    echo "Hosting migrations complete.\n";
} finally { $db->query("SELECT RELEASE_LOCK('tyc_schema_migration')"); }

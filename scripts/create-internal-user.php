<?php
if (PHP_SAPI !== 'cli') exit(1);
require dirname(__DIR__) . '/directadmin/api/_core.php';
$email = strtolower(trim($argv[1] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Valid email required');
$password = rtrim(stream_get_contents(STDIN), "\r\n");
if (strlen($password) < 10 || strlen($password) > 72) throw new RuntimeException('Password must be 10 to 72 bytes');
$db = database();
$db->exec(file_get_contents(dirname(__DIR__) . '/directadmin/migrations/007-internal-users.sql'));
if (sql($db, 'SELECT email FROM InternalUser WHERE email = ?', [$email])->fetch()) { echo "Account already exists; unchanged.\n"; exit; }
sql($db, 'INSERT INTO InternalUser (email, name, passwordHash) VALUES (?, ?, ?)', [$email, $argv[2] ?? 'Manager', password_hash($password, PASSWORD_DEFAULT)]);
echo "Internal manager account created.\n";

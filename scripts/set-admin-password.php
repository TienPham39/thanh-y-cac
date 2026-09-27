<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$email = strtolower(trim($argv[1] ?? ''));
$password = rtrim((string)fgets(STDIN), "\r\n");
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12 || strlen($password) > 72) {
    fwrite(STDERR, "Email khong hop le hoac mat khau khong nam trong 12-72 byte.\n"); exit(1);
}
$directory = getenv('TYC_PRIVATE_DIR') ?: dirname(__DIR__) . '/tyc-private';
if (!is_dir($directory) && !mkdir($directory, 0700, true)) throw new RuntimeException('Cannot create private directory');
$file = $directory . '/config.php';
$config = is_file($file) ? require $file : [];
$config['adminEmail'] = $email;
$config['adminPasswordHash'] = password_hash($password, PASSWORD_DEFAULT);
$temporary = tempnam($directory, '.admin-');
if ($temporary === false) throw new RuntimeException('Cannot create config');
try {
    chmod($temporary, 0600);
    if (file_put_contents($temporary, "<?php\nreturn " . var_export($config, true) . ";\n") === false || !rename($temporary, $file)) throw new RuntimeException('Cannot save config');
} finally { if (is_file($temporary)) unlink($temporary); }
echo "Da luu mat khau admin PHP. Ban co the dang nhap lai.\n";

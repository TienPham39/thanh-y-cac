<?php
// Generate locally and upload outside public_html. No hosting SSH required.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if (count($argv) !== 4) { fwrite(STDERR, "Usage: php scripts/php-admin-config.php EMAIL HTTPS_ORIGIN OUTPUT_FILE\nPassword is read from stdin (not command arguments).\n"); exit(1); }
[$script, $email, $origin, $output] = $argv;
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('~^https://[a-zA-Z0-9.-]+(?::[0-9]+)?$~D', $origin)) { fwrite(STDERR, "Invalid email or HTTPS origin.\n"); exit(1); }
$password = rtrim((string)fgets(STDIN), "\r\n");
if (strlen($password) < 12 || strlen($password) > 72) { fwrite(STDERR, "Password must be 12-72 bytes.\n"); exit(1); }
$config = ['appOrigin' => $origin, 'adminEmail' => strtolower($email), 'adminPasswordHash' => password_hash($password, PASSWORD_DEFAULT)];
$handle = fopen($output, 'xb');
if (!$handle) { fwrite(STDERR, "Output must be a new private file.\n"); exit(1); }
chmod($output, 0600);
fwrite($handle, "<?php\nreturn " . var_export($config, true) . ";\n");
fclose($handle);
fwrite(STDOUT, "Private config created. Upload outside public_html; do not commit it.\n");

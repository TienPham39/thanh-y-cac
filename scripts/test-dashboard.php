<?php
function requireAdmin() {} function requireMethod(...$methods) {} function database() { return null; } function today() { return '2026-10-02'; }
function fail($status, $code, $message) { throw new RuntimeException($message); }
function sql($db, $query, $params) {
    if ($params !== ['2026-10-01 17:00:00', '2026-10-02 17:00:00']) throw new RuntimeException('Incorrect timezone boundaries');
    return new class {
        private int $i = 0;
        function fetch() { return [
            ['productCode'=>'A','productName'=>'A','status'=>'confirmed','priceSnapshot'=>'{"total":100,"deposit":20}','createdAt'=>'2026-10-01 18:00:00'],
            ['productCode'=>'B','productName'=>'B','status'=>'cancelled','priceSnapshot'=>'{"total":900,"deposit":90}','createdAt'=>'2026-10-02 00:00:00'],
            ['productCode'=>'A','productName'=>'A','status'=>'completed','priceSnapshot'=>null,'createdAt'=>'2026-10-02 01:00:00'],
        ][$this->i++] ?? false; }
    };
}
function respond($data) {
    if ($data['total'] !== 3 || $data['value'] !== 100 || $data['deposit'] !== 20 || $data['missing'] !== 1 || $data['months'][0]['orders'] !== 3 || $data['top'][0]['orders'] !== 2) throw new RuntimeException('Incorrect dashboard totals');
    echo "Dashboard aggregation and Vietnam date boundaries passed\n"; exit(0);
}
$_GET = ['start'=>'2026-10-02','end'=>'2026-10-02'];
require __DIR__ . '/../directadmin/api/_dashboard.php';
adminDashboard();

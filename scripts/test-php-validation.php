<?php
declare(strict_types=1);
require dirname(__DIR__) . '/directadmin/api/_core.php';
require dirname(__DIR__) . '/directadmin/api/_validation.php';
require dirname(__DIR__) . '/directadmin/api/_catalog.php';
function check(bool $condition): void { if (!$condition) throw new RuntimeException('Validation assertion failed'); }
check(!validDate('2026-02-29'));
check(validDate('2028-02-29'));
check(reservationDays('2026-12-31', '2027-01-01') === ['2026-12-31', '2027-01-01']);
check(count(reservationDays('2026-01-01', '2027-01-01')) === 366);
try { reservationDays('2026-01-01', '2027-01-02'); throw new RuntimeException('Oversized range accepted'); } catch (ApiError $e) { check($e->status === 422); }
$row = ['slug'=>'test','code'=>'T','name'=>'Test','description'=>'','image'=>'/images/logo.png','price'=>1,'categorySlug'=>'test','gender'=>'female','availability'=>'available','minHeight'=>1,'maxHeight'=>2,'minWeight'=>1,'maxWeight'=>2,'tags'=>'["valid",42,null]','accessories'=>'{"object":"invalid"}','badge'=>'','badgeTone'=>'red','popularity'=>0,'images'=>'"legacy-scalar"'];
$serialized = product($row);
check($serialized['tags'] === ['valid']);
check($serialized['accessories'] === []);
check($serialized['images'] === ['/images/logo.png']);
$rental = ['id'=>uuid(),'productSlug'=>'test','name'=>' Test ','phone'=>'090 123 4567','start'=>'2028-02-29','end'=>'2028-02-29','height'=>'160','weight'=>'50'];
$parsed = rentalInput($rental, '2028-02-01');
check($parsed['phone'] === '0901234567' && $parsed['height'] === 160 && $parsed['name'] === 'Test');
foreach ([['start'=>'2028-02-30'], ['phone'=>'not-a-phone'], ['height'=>[]], ['id'=>'bad']] as $invalid) {
    try { rentalInput([...$rental, ...$invalid], '2028-02-01'); throw new RuntimeException('Invalid input accepted'); }
    catch (ApiError $e) { check($e->status === 422); }
}
echo "PASS PHP validation: dates, inclusive bounds, legacy JSON, rental normalization and rejected inputs.\n";

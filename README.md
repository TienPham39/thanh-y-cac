# Thanh Y Các

Frontend Next.js 15 / React 19 xuất tĩnh, API PHP 8.1+ và MariaDB 10.6+ / MySQL 8.
Node.js 22 chỉ cần để phát triển và build frontend. Hosting không chạy Node, Prisma hoặc Redis.

## Triển khai DirectAdmin

Xem [hướng dẫn PHP](docs/deploy-directadmin-php.md) và [CI/CD](docs/auto-deploy-directadmin.md).
Trước bản chuyển đổi này: sao lưu database, import `directadmin/migrations/001-php-api.sql`,
và tạo cấu hình admin trong thư mục `tyc-private` cạnh `public_html`.
Không tự chạy migration production khi push; cần hoàn tất migration trước khi deploy code.

```sh
npm ci
npm run build:directadmin
```

Upload nội dung `dist/`, gồm các file ẩn. Giữ lại mật khẩu DB, thư mục riêng và ảnh upload.
Frontend cùng origin với PHP; không cần CORS. Chi tiết sản phẩm dùng `/chi-tiet-trang-phuc/?slug=...`.

## Phát triển local

Cần Node 22, PHP 8.1+ với `pdo_mysql`, MySQL/MariaDB. Import `directadmin/database.sql`
vào database local mới rồi import `directadmin/migrations/001-php-api.sql`.
Lệnh `npm run dev` tự đọc `.env`: đặt DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD,
TYC_PRIVATE_DIR (đường dẫn tuyệt đối), APP_ORIGIN=http://localhost:3000 và APP_ENV=development
trong `.env` hoặc môi trường. DATABASE_URL cũ cũng được chuyển sang cấu hình PHP
nếu chưa có các biến DB_* tương ứng. Đặt ADMIN_EMAIL và ADMIN_PASSWORD_HASH
(hash PHP), hoặc dùng config.php riêng như hướng dẫn deploy.

Chạy một lệnh để khởi động PHP và frontend cùng nhau:

```sh
npm run dev
```

Mở http://localhost:3000. Next dev chuyển `/api/*` và `/uploads/*` tới PHP cổng 8787.
Lệnh sẽ báo lỗi nếu cổng PHP đã bị chiếm, tránh kết nối nhầm Apache khác.
Nếu muốn chạy riêng, dùng `npm run dev:api` và `npm run dev:web` ở hai terminal.
Nếu dùng hostname/cổng khác, APP_ORIGIN phải khớp chính xác origin trình duyệt.
`npm start` phục vụ bản đã build bằng PHP local; đặt APP_ORIGIN=http://127.0.0.1:8080.
PHP development server chỉ dùng local; production dùng Apache/PHP trên hosting.

## Kiểm tra

```sh
npm test
npm run lint
npm run typecheck
npm run build:directadmin
npm run test:php
```

`test:php` cần DB_HOST/DB_PORT/DB_USER/DB_PASSWORD trỏ tới máy chủ database test;
tài khoản phải có CREATE/DROP DATABASE. Test chỉ tạo/xóa database ngẫu nhiên `tyc_test_*`,
kiểm tra migration lặp lại, auth/CSRF, upload, CRUD, idempotency và xác nhận cọc đồng thời.
CI chạy PHP 8.1 + MariaDB 10.11. Không chạy test bằng tài khoản production.

Để kiểm tra rewrite/quyền file trên Apache, đặt PHP_SMOKE_BASE_URL trỏ tới website
cần kiểm tra rồi chạy `node scripts/test-php-deployment.mjs` (chỉ đọc dữ liệu).

## Docker local (tùy chọn)

`docker compose --env-file .env.example up -d --build` dùng PHP/Apache và MySQL,
giữ volume `mysql_data` cũ. Tạo trước `tyc-private/config.php` và cho user Apache
quyền đọc/ghi thư mục này. Không dùng `down -v` nếu cần giữ dữ liệu.
Service migrate tự bootstrap dữ liệu mẫu chỉ khi chưa có bảng sản phẩm;
database có sẵn chỉ chạy migration cộng thêm. Đổi mật khẩu mẫu trước khi dùng ngoài máy local.

## Mã API

Mã PHP ở `directadmin/api`; xem [hợp đồng API](docs/catalog-api.md).
`/api/health` kiểm tra PHP; `/api/ready` kiểm tra kết nối, schema và InnoDB.
Session admin hết hạn sau 8 giờ. Xác nhận cọc mới giữ ngày thuê; khóa cả ngày nhận và trả.
Các file `prisma/` được giữ làm lịch sử schema, không dùng để chạy hay migrate ứng dụng.

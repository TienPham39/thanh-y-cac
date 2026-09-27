# Phạm vi hiện tại

Frontend Next.js xuất HTML/CSS/JS tĩnh. Backend PHP 8.1+ dùng PDO với MariaDB/MySQL,
không dùng runtime Node.js, Prisma hoặc Redis. Node 22 chỉ dùng build/phát triển frontend.

API hỗ trợ danh mục, chi tiết, bộ ảnh, auth/session, quản trị sản phẩm,
upload ảnh, yêu cầu thuê và xác nhận/hủy cọc. Thông báo nằm trong trang quản trị.
Lịch giữ đồ dùng transaction và unique theo sản phẩm/ngày, bao gồm ngày nhận và trả.

Triển khai chính: DirectAdmin Apache/PHP, API và frontend cùng origin.
Database và cấu hình admin cần migration/bootstrap trước khi deploy code.
Xem README.md, docs/catalog-api.md và docs/deploy-directadmin-php.md.

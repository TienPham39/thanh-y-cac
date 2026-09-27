# Quản lý danh mục

Trang quản trị: /admin/danh-muc/. API PHP: /api/admin/categories.

- GET: danh sách gồm tên, slug, tiền tố mã, thứ tự, số trang phục (kể cả đang ẩn).
- POST: tạo danh mục; PATCH: sửa tên, tiền tố, thứ tự theo slug.
- DELETE: xóa theo slug, chỉ khi không có trang phục liên kết.
- API yêu cầu phiên quản trị PHP; mọi thao tác ghi kiểm tra Origin.
- Tiền tố gồm 2–10 chữ cái, không trùng nhau. Mã trang phục đã lưu giữ nguyên.
- Form trang phục và bộ lọc lấy danh mục từ database.

Trước khi triển khai lên hosting, sao lưu database rồi chạy
directadmin/migrations/002-categories.sql (hoặc scripts/php-migrate.php,
với biến môi trường kết nối database). Migration bổ sung codePrefix,
có thể chạy lại và không đổi mã hay danh mục của trang phục hiện có.
Local đã được cập nhật; hosting cần chạy migration riêng.

Tên và nhóm danh mục cũ trong database được giữ lại. Có thể thêm nhóm
mới, chẳng hạn Tiên hiệp với tiền tố TH, rồi chuyển trang phục sang nhóm đó.

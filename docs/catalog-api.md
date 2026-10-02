# API PHP

Tất cả endpoint chạy PHP 8.1+ / PDO MariaDB, cùng origin với frontend tĩnh.
Danh mục công khai chỉ trả sản phẩm published=true; API quản trị luôn kiểm tra session.

| Endpoint | Hành vi |
| --- | --- |
| GET /api/health | Kiểm tra PHP |
| GET /api/ready | Kiểm tra DB, schema migration và InnoDB |
| POST /api/auth/session | JSON identifier/password; tạo cookie HttpOnly, SameSite=Lax, Secure trên HTTPS |
| GET /api/auth/session | Email admin hoặc 401 |
| DELETE /api/auth/session | Hủy session phía server và cookie |
| GET /api/products | data và pagination (page, pageSize, total, totalPages) |
| GET /api/products/:slug | data; 404 khi ẩn/không tồn tại |
| GET /api/product-categories | data gồm slug/name/count sản phẩm công khai |
| GET /api/products/availability?slug=... | Chỉ start/end đã xác nhận, không trả thông tin khách |
| POST /api/rental-requests | Tạo pending, trả {id}, HTTP 201 |
| GET /api/admin/products | Tất cả sản phẩm, gồm published và bộ ảnh |
| PATCH /api/admin/products | Cập nhật sản phẩm theo code; 404 nếu chưa tồn tại |
| DELETE /api/admin/products | {codes: string[]}, tối đa 100 mã |
| GET /api/admin/products/publication | data gồm code/published |
| PATCH /api/admin/products/publication | Mã đã có: chỉ đổi published; mã mới: tạo từ payload |
| POST /api/admin/uploads | {image: data URL}; JPG/PNG/WebP tối đa 750000 byte; trả data.url |
| GET /uploads/:filename | Ảnh đã upload; không thực thi nội dung file |
| GET /api/admin/rental-requests | Danh sách, phân trang, unread; hỗ trợ count=1, requestId, productCode |
| POST /api/admin/rental-requests | Admin tạo đơn thuê trực tiếp (hotline/tại cửa hàng), cùng payload với API đặt thuê công khai; trả {id}, HTTP 201. Cho phép chọn trang phục chưa mở bán. Đơn tạo ở trạng thái pending, xác nhận cọc bằng PATCH để khóa lịch. |
| PATCH /api/admin/rental-requests | {id, action: read/confirm/cancel}; trả {ok:true} |

Các thao tác ghi yêu cầu Origin khớp APP_ORIGIN và application/json.
Session hết hạn tuyệt đối sau 8 giờ; thay hash mật khẩu sẽ làm session cũ mất hiệu lực.
Đăng nhập tối đa 5 lần/15 phút theo IP kết nối. Không tin X-Forwarded-For từ client.
Nếu hosting dùng proxy, giới hạn này tính theo IP proxy; cấu hình ở hosting để tránh chia sẻ IP cho mọi khách.

API sản phẩm/auth trả lỗi {error:{code,message}}; API yêu cầu thuê/lịch trả {error:string}.
Lỗi backend không tiết lộ SQL hay thông tin kết nối. Response dữ liệu dùng Cache-Control: no-store.

## Danh sách sản phẩm

q tối đa 100 ký tự; category có thể lặp; gender=female/male/unisex;
price=under300/300to500/over500; availability=available/advance;
height=under155/155to165/165to175/over175; accessory=hairpin/fan/sword/embroidered có thể lặp;
sort=popular/newest/price-asc/price-desc; page=1..10000; pageSize=1..24 (mặc định 9).
Tham số không hợp lệ trả 400. Trang vượt số trang trả mảng rỗng.

Payload quản trị giữ các trường code, slug, name, description, price, category (nhãn tiếng Việt),
gender (Nữ/Nam/Unisex), status, tags, accessories, badge, minHeight/maxHeight/minWeight/maxWeight,
published và images (1–8 URL nội bộ). Ảnh đầu tiên làm image đại diện.

## Đặt thuê và xác nhận cọc

Ngày theo YYYY-MM-DD, ngày hiện tại tính theo Việt Nam. Bao gồm cả ngày nhận và trả,
tối đa 366 ngày. Yêu cầu mới không giữ kho. Xác nhận cọc mới ghi RentalReservedDay.
Giao dịch InnoDB và unique(productSlug, day) bảo đảm hai admin không giữ trùng ngày.
Hủy giải phóng ngày đã giữ; yêu cầu đã hủy không được xác nhận lại.

UUID dùng cho retry: cùng ID và cùng payload trả lại ID; đổi payload với ID cũ trả 409.
Giới hạn MariaDB: 10 lần/10 phút theo điện thoại, 30 lần/10 phút theo IP.
Thông báo là thông báo trong trang quản trị, không gửi SMS/email/Zalo.

## Migration và kiểm thử

Database mới: import directadmin/database.sql rồi directadmin/migrations/001-php-api.sql.
Database cũ: backup, chỉ import migration. File có thể chạy lại, không xóa dữ liệu.
Hash scrypt cũ phải được thay bằng hash PHP. Xem deploy-directadmin-php.md.

npm run test:php kiểm tra API thật trên database test riêng, gồm xác nhận đồng thời.
Node.js chỉ dùng chạy frontend tooling/test harness; không có Node API server.

### Admin dashboard
GET /api/admin/dashboard?start=2026-10-01&end=2026-10-31 requires an admin session. Dates are inclusive in Asia/Ho_Chi_Minh, default to today, and allow at most 730 days between boundaries. Returns order counts, confirmed/completed order value and snapshot deposits, daily series for ranges up to 31 days and monthly series for longer ranges, and the top five rented products. Uses order creation date. Cancelled orders are excluded from financial totals; missing snapshots are reported. These values do not represent settled revenue or refunds.


### Internal accounts

`GET/POST/PATCH /api/admin/users` is restricted to the configured system administrator. Internal accounts are Managers with access to business APIs, not user administration. POST accepts name, email, password (10–72 bytes). PATCH accepts email and active (boolean). Lock/unlock rotates the credential version so previous sessions remain invalid. Password hashes are never returned. No public registration endpoint is provided.

Apply `directadmin/migrations/007-internal-users.sql` before deploying this API. Existing configured admin credentials remain supported. Create an initial Manager using the CLI-only `scripts/create-internal-user.php EMAIL NAME`, providing the password on stdin in the configured PHP environment. The script leaves an existing account unchanged. Never commit passwords or include them in a frontend bundle. Accounts created locally are not automatically copied to hosting.

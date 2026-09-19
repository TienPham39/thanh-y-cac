# Triển khai toàn bộ website trên DirectAdmin

Kiến trúc triển khai:

```text
Frontend tĩnh (HTML/CSS/JS) → PHP API → MariaDB localhost
```

Không cần Vercel. Database dùng trực tiếp:

- Database: `thanhyca6aae_tyc`
- User: `thanhyca6aae_tyc`
- Host: `localhost`
- Port: `3306`

Không ghi mật khẩu database vào source hoặc gửi mật khẩu qua tin nhắn.

## 1. Import bảng và dữ liệu mẫu

1. Vào **Account Manager → Databases**.
2. Ở database `thanhyca6aae_tyc`, bấm **Manage**.
3. Trong **Database Operations**, bấm **Import**.
4. Chọn file `directadmin/database.sql` từ máy tính.
5. Bấm Import và chờ thông báo hoàn tất.
6. Quay lại trang database. Mục **Tables** phải hiện `3`, gồm `AppSetting`, `ProductCategory` và `CostumeProduct`.

Nếu nút Import báo lỗi, mở **phpMyAdmin → chọn database `thanhyca6aae_tyc` → Import**, chọn đúng file SQL, giữ charset UTF-8 và chạy. File SQL dùng `CREATE TABLE IF NOT EXISTS` và `INSERT IGNORE`, nên nhập lại không xóa dữ liệu đang có.

Dữ liệu trong file là 10 sản phẩm minh họa từ source hiện tại, chưa phải thông tin tồn kho đã xác nhận.

## 2. Sao lưu website cũ

1. Vào **System Info & Files → File Manager**.
2. Mở `domains/thanhycac.com/public_html`.
3. Nếu thư mục đang có website, tải bản sao lưu hoặc di chuyển các file cũ sang một thư mục backup bên ngoài `public_html`.
4. Chưa xóa backup cho đến khi website mới hoạt động ổn định.

## 3. Upload bộ deploy mới

1. Upload file `dist.zip` vào `public_html`.
2. Chọn file ZIP và bấm **Extract**.
3. Sau khi giải nén, `index.html`, `_next`, `images`, `api`, `.htaccess` phải nằm trực tiếp trong `public_html`.
4. Không để thành `public_html/dist/index.html`.
5. Bật **Show hidden files** trong File Manager để thấy `.htaccess` và `.db-password`.

Cấu trúc đúng:

```text
public_html/
├── index.html
├── .htaccess
├── deployment.json
├── _next/
├── images/
├── trang-phuc/
└── api/
    ├── index.php
    ├── _config.php
    ├── .db-password
    └── .htaccess
```

## 4. Điền mật khẩu database

1. Mở `public_html/api/.db-password` bằng trình sửa file.
2. Xóa `CHANGE_ME` và nhập đúng mật khẩu của user database `thanhyca6aae_tyc` trên một dòng duy nhất.
3. Không thêm dấu nháy, dấu cách hoặc tên biến.
4. Lưu file.

Ví dụ định dạng, không dùng chuỗi này làm mật khẩu:

```text
mat-khau-thuc-cua-ban
```

File `api/.htaccess` chặn trình duyệt tải `_config.php` và `.db-password`. Không đưa file `.db-password` đã điền mật khẩu trở lại Git hoặc gửi cho người khác.

Nếu tên database/user thực tế thay đổi, sửa hai dòng `database` và `username` trong `public_html/api/_config.php`. Với database trong ảnh hiện tại thì không cần sửa.

## 5. Chọn PHP

Trong DirectAdmin, nếu có **PHP Version Selector**, chọn PHP 8.1 trở lên cho `thanhycac.com`. PHP cần extension `PDO` và `pdo_mysql`; hosting DirectAdmin thông thường đã bật sẵn.

## 6. Kiểm tra theo đúng thứ tự

Mở các URL sau bằng tab ẩn danh:

1. `https://thanhycac.com/api/health`
   - Kết quả đúng: `{"status":"ok"}`.
   - Nếu 404: `.htaccess` hoặc `mod_rewrite` chưa hoạt động.
2. `https://thanhycac.com/api/.db-password`
   - Bắt buộc phải trả **403 Forbidden**. Nếu nhìn thấy mật khẩu, xóa mật khẩu khỏi file ngay và yêu cầu hosting bật quy tắc `.htaccess` trước khi tiếp tục.
3. `https://thanhycac.com/api/ready`
   - Kết quả đúng: `{"status":"ok"}`.
   - Nếu 503: kiểm tra mật khẩu, database/user và extension `pdo_mysql`.
4. `https://thanhycac.com/api/products`
   - Phải trả JSON có `data` và danh sách sản phẩm.
5. `https://thanhycac.com/trang-phuc/`
   - Thử tìm kiếm, lọc, chuyển trang và mở chi tiết sản phẩm.
6. Mở trang chủ `https://thanhycac.com/`, kiểm tra ảnh, font và các liên kết.

Sau khi mọi kiểm tra đạt, xóa `dist.zip` khỏi `public_html`; website không cần file ZIP để chạy.

## Xử lý lỗi thường gặp

### Website trả 500 ngay sau khi upload

Một số hosting cấm chỉ thị `Options`. Mở `public_html/.htaccess` và `public_html/api/.htaccess`, xóa riêng dòng `Options -Indexes`, lưu rồi thử lại.

### `/api/health` trả 404

Kiểm tra file `.htaccess` đã được giải nén. Nếu file có mặt mà vẫn 404, gửi hosting yêu cầu bật `mod_rewrite`/rewrite rules cho domain. Đây là tính năng web routing, không phải mở database ra Internet.

### `/api/ready` trả 503

- Mật khẩu trong `.db-password` chưa đúng hoặc còn `CHANGE_ME`.
- Tên database/user không khớp.
- Database chưa import SQL.
- PHP chưa bật `pdo_mysql`.

PHP ghi lỗi kỹ thuật vào error log của hosting nhưng API chỉ trả thông báo chung, không làm lộ thông tin kết nối.

### Trang danh sách báo chưa kết nối được dữ liệu

Kiểm tra `/api/ready` và `/api/products` trước. Nếu hai URL này đúng, tải lại trang bằng `Ctrl+F5` hoặc xóa cache trình duyệt.

## Cập nhật website lần sau

Tại máy phát triển:

```powershell
npm run build:directadmin
Compress-Archive -Path .\dist\* -DestinationPath .\dist.zip -Force
```

Mỗi lần build mới, `.db-password` trong `dist` trở lại `CHANGE_ME`. Khi cập nhật hosting, giữ lại file `.db-password` production hoặc điền lại sau khi giải nén. Backup website và database trước khi cập nhật.

## Hoàn tác

Nếu website mới lỗi, đưa các file mới ra khỏi `public_html` và khôi phục bản backup ở bước 2. Không xóa database để hoàn tác giao diện; database và frontend được khôi phục độc lập.

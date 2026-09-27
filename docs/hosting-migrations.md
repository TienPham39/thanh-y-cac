# Migration trước deploy

Workflow chạy migration PHP qua SSH trước khi upload website. Không có endpoint
migration công khai. Script dùng cấu hình database hiện có trong API trên hosting.
Database phải tồn tại; migration không import dữ liệu mẫu.

Cấu hình GitHub environment production:

- Secret DIRECTADMIN_SSH_HOST: hostname SSH.
- Secret DIRECTADMIN_SSH_USER: tài khoản SSH.
- Secret DIRECTADMIN_SSH_KEY: private key của tài khoản deploy.
- Secret DIRECTADMIN_SSH_KNOWN_HOSTS: host key đã xác minh từ nhà cung cấp.
- Variable DIRECTADMIN_API_PATH: đường dẫn tuyệt đối tới public_html/api trên hosting.

SSH mặc định dùng cổng 22, PHP CLI cần pdo_mysql và quyền đọc cấu hình hiện có.
Database user cần quyền ALTER, CREATE, SELECT, INSERT, UPDATE.
Sao lưu database hosting trước lần nâng cấp đầu tiên.

Script khóa bằng GET_LOCK và lưu lịch sử trong SchemaMigration. Chỉ ghi thành công
sau khi toàn bộ SQL của một file chạy xong. Nếu lỗi DDL, MySQL có thể đã áp dụng
một phần; các migration hiện tại hỗ trợ chạy lại. Không tự rollback DDL.

Nếu hosting không có SSH, cần chạy các SQL trong directadmin/migrations theo thứ tự
qua phpMyAdmin; không bỏ kiểm tra readiness để che lỗi. Workflow SSH cần được điều
chỉnh theo phương thức triển khai được hosting hỗ trợ.

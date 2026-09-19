# Tự động deploy DirectAdmin từ GitHub

Workflow `.github/workflows/deploy-directadmin.yml` kiểm tra và build khi có pull request vào `main`. Sau mỗi lần push lên `main`, nếu kiểm tra thành công, workflow kiểm tra đăng nhập API, chia bản build thành các gói nhỏ, tải chúng lên **DirectAdmin HTTPS API (cổng 2222)** bằng `multipart/form-data` rồi giải nén vào `public_html`. Việc chia nhỏ tránh giới hạn kích thước request của proxy hosting. Website vẫn chạy frontend tĩnh, PHP API và MariaDB trên DirectAdmin; GitHub chỉ build và upload, không chạy Node.js trên hosting.

## 1. Kiểm tra tài khoản FTP trong DirectAdmin

1. Dùng tài khoản chính đăng nhập DirectAdmin, có quyền ghi vào `public_html` của `thanhycac.com`.
2. Ghi lại hostname DirectAdmin, username và password. Hostname không gồm `https://` hoặc `:2222`.
3. Xác định đường dẫn từ home của tài khoản đến `public_html`, ví dụ `domains/thanhycac.com/public_html`.

## 2. Cài thông tin vào GitHub

Trong repo GitHub, mở **Settings → Environments → New environment**, tạo environment tên `production`. Trong environment này, thêm **Environment secrets**:

| Tên | Giá trị |
| --- | --- |
| `DIRECTADMIN_FTP_HOST` | Host DirectAdmin, chỉ hostname, không có `https://` hoặc `:2222` |
| `DIRECTADMIN_FTP_USER` | Username đăng nhập DirectAdmin |
| `DIRECTADMIN_FTP_PASSWORD` | Mật khẩu đăng nhập DirectAdmin |

Thêm **Environment variable**:

| Tên | Giá trị |
| --- | --- |
| `DIRECTADMIN_FTP_PATH` | Đường dẫn từ home đến `public_html`, ví dụ `domains/thanhycac.com/public_html` |

Không đưa các giá trị này vào source, commit hoặc tin nhắn. Workflow không cần mật khẩu MariaDB: file `public_html/api/.db-password` hiện có trên server được giữ nguyên.

## 3. Đưa source và workflow lên GitHub

Đảm bảo source PHP API, script build, ảnh banner và workflow đều được commit cùng nhau. `dist/` và file `.db-password` không được commit. Nếu đã kiểm tra thay đổi và đứng trên nhánh `main`, chạy:

```powershell
git status
git add .github/workflows/deploy-directadmin.yml scripts/deploy-directadmin.sh scripts/build-directadmin.mjs directadmin/api docs/auto-deploy-directadmin.md README.md .gitignore
# Thêm các file source và ảnh còn thiếu của bản website đang muốn triển khai.
git diff --cached --stat
git commit -m "ci: deploy DirectAdmin automatically from main"
git push origin main
```

Lần push này sẽ kích hoạt workflow. Những lần sau, commit và push code mới vào `main` là đủ; không cần tự tạo hay upload `dist.zip`.

## 4. Theo dõi lần deploy đầu

1. Vào tab **Actions** của repo, mở **Build and deploy DirectAdmin** cho commit mới.
2. Job `build` phải qua lint, typecheck và build. Job `deploy` phải upload và giải nén thành công qua DirectAdmin API.
3. Mở `https://thanhycac.com/` để kiểm tra banner, `https://thanhycac.com/trang-phuc/` để kiểm tra danh mục, rồi `https://thanhycac.com/api/ready` để kiểm tra kết nối database.
4. Xác nhận `https://thanhycac.com/api/.db-password` vẫn trả **403 Forbidden**. Nếu không, dừng sử dụng site và sửa quyền truy cập trên hosting ngay.

Workflow không xóa file trên server. Vì vậy mật khẩu database, dữ liệu upload hoặc file chỉ có trên server không bị xóa; các asset cũ có thể còn trên hosting. Khi cần hoàn tác code, dùng `git revert` commit gây lỗi rồi push `main` để workflow triển khai bản trước. Database không được workflow tự thay đổi; nếu thay đổi schema, cập nhật SQL/backup và xử lý riêng.

Nếu job `deploy` báo thiếu biến, kiểm tra đúng tên environment `production` và 4 giá trị ở bước 2. Dòng `DirectAdmin API login verified` xác nhận host và tài khoản hoạt động; lỗi sau dòng này thuộc thao tác upload hoặc giải nén. Nếu báo `401`, cập nhật secret bằng mật khẩu đăng nhập DirectAdmin. Nếu lỗi chứng chỉ TLS, sửa hostname/chứng chỉ với nhà cung cấp hosting; không tắt xác thực TLS. Nếu giải nén sai đường dẫn, chỉnh `DIRECTADMIN_FTP_PATH` theo thư mục home thực tế của tài khoản.

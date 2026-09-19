# Tự động deploy DirectAdmin từ GitHub

Workflow `.github/workflows/deploy-directadmin.yml` kiểm tra và build khi có pull request vào `main`. Sau mỗi lần push lên `main`, nếu kiểm tra thành công, workflow tải bản build lên DirectAdmin bằng **FTPS (FTP qua TLS, cổng 21)**. Website vẫn chạy frontend tĩnh, PHP API và MariaDB trên DirectAdmin; GitHub chỉ build và upload, không chạy Node.js trên hosting.

## 1. Kiểm tra tài khoản FTP trong DirectAdmin

1. Vào **Account Manager → FTP Management** trong DirectAdmin. Dùng tài khoản FTP có quyền ghi vào `public_html` của `thanhycac.com`; nên tạo tài khoản riêng cho deploy và chỉ cấp quyền đến website này nếu hosting cho phép.
2. Ghi lại **FTP hostname**, **username** và **password**. Hostname thường do nhà cung cấp hosting cấp; không lấy URL trang quản trị có `:2222` làm FTP host nếu chưa kiểm tra.
3. Thử đăng nhập bằng FileZilla: protocol **FTP**, encryption **Require explicit FTP over TLS**, port **21**, transfer mode **Passive**. Xác nhận chứng chỉ TLS hợp lệ và mở được thư mục có `index.html` của website. Nếu hosting chỉ cấp FTP không mã hóa, yêu cầu nhà cung cấp bật FTPS hoặc dùng SSH/SFTP; workflow này không tự hạ xuống kết nối không mã hóa.
4. Xác định đường dẫn từ thư mục gốc của tài khoản FTP đến `public_html`. Ví dụ tài khoản FTP ở home directory: `domains/thanhycac.com/public_html`. Nếu tài khoản FTP đã bị giới hạn ngay trong `public_html`, dùng `.`. Đây là **đường dẫn FTP**, không phải đường dẫn tuyệt đối của File Manager.

## 2. Cài thông tin vào GitHub

Trong repo GitHub, mở **Settings → Environments → New environment**, tạo environment tên `production`. Trong environment này, thêm **Environment secrets**:

| Tên | Giá trị |
| --- | --- |
| `DIRECTADMIN_FTP_HOST` | Host FTP, chỉ hostname, không có `ftp://` hoặc `:21` |
| `DIRECTADMIN_FTP_USER` | Tên tài khoản FTP |
| `DIRECTADMIN_FTP_PASSWORD` | Mật khẩu tài khoản FTP |

Thêm **Environment variable**:

| Tên | Giá trị |
| --- | --- |
| `DIRECTADMIN_FTP_PATH` | Đường dẫn đến `public_html` nhìn từ FTP, ví dụ `domains/thanhycac.com/public_html` hoặc `.` |

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
2. Job `build` phải qua lint, typecheck và build. Job `deploy` phải upload thành công qua FTPS.
3. Mở `https://thanhycac.com/` để kiểm tra banner, `https://thanhycac.com/trang-phuc/` để kiểm tra danh mục, rồi `https://thanhycac.com/api/ready` để kiểm tra kết nối database.
4. Xác nhận `https://thanhycac.com/api/.db-password` vẫn trả **403 Forbidden**. Nếu không, dừng sử dụng site và sửa quyền truy cập trên hosting ngay.

Workflow không xóa file trên server. Vì vậy mật khẩu database, dữ liệu upload hoặc file chỉ có trên server không bị xóa; các asset cũ có thể còn trên hosting. Khi cần hoàn tác code, dùng `git revert` commit gây lỗi rồi push `main` để workflow triển khai bản trước. Database không được workflow tự thay đổi; nếu thay đổi schema, cập nhật SQL/backup và xử lý riêng.

Nếu job `deploy` báo thiếu biến, kiểm tra đúng tên environment `production` và 4 giá trị ở bước 2. Nếu lỗi chứng chỉ TLS, sửa hostname/chứng chỉ với nhà cung cấp hosting; không tắt xác thực TLS. Nếu lỗi `cd`, chỉnh `DIRECTADMIN_FTP_PATH` theo thư mục gốc thực tế của tài khoản FTP.

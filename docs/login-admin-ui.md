# Giao diện đăng nhập và quản trị

- `/login`: giao diện theo Login.png, hiện/ẩn mật khẩu, kiểm tra trường bắt buộc. Xác thực chưa kết nối; không gửi hoặc lưu mật khẩu. Đăng ký/khôi phục hướng dẫn liên hệ hỗ trợ.
- `/admin` và `/admin/trang-phuc`: bảng quản lý, thống kê từ dữ liệu đang có, tìm kiếm, lọc, phân trang, chọn nhiều, xóa có xác nhận, nhân bản và xuất JSON.
- `/admin/trang-phuc/chinh-sua?id=sample-0`: mở mẫu đầu tiên; `?id=new` mở form thêm mới.

Giao diện dùng Tailwind, Inter, đỏ #80151c, nền trắng/xám ấm; login giữ Noto Serif cho tiêu đề. Bố cục dựa trên các ảnh tham chiếu người dùng gửi. Hai ảnh example được dùng làm ảnh minh họa, không đại diện kho hàng thật.

## Dữ liệu và giới hạn

Hiện là bản giao diện có thao tác, lưu tại localStorage `thanh-y-cac-admin-drafts-v1`. Không có quyền quản trị thật, không ghi vào MySQL và không thay đổi catalog công khai. Các mục sidebar ngoài Trang phục chưa triển khai. Không dùng bản này để quản lý dữ liệu khách hàng.

Form gồm mã, slug, tên, danh mục, trạng thái, giới tính, mô tả ngắn/chi tiết, ảnh đại diện/thư viện, tags, nhãn ảnh, bộ sưu tập, giá 24h, phụ thu ngày tiếp, cọc, phí phụ kiện, ưu đãi, khoảng chiều cao/cân nặng, ghi chú kích thước, chất liệu, phụ kiện, thành phần bộ đồ, lịch trạng thái theo ngày, chính sách bảo quản/thuê/bồi hoàn, số liệu và tùy chọn hiển thị. Thông tin người thuê thuộc đơn đặt lịch, không thuộc bản ghi sản phẩm.

Ảnh JPG/PNG/WebP tối đa 750 KB mỗi ảnh, tối đa 8 ảnh. Khi localStorage đầy, UI báo lỗi và không thông báo lưu thành công. JSON hỏng khóa lưu để tránh ghi đè dữ liệu cũ. Xuất JSON trước khi xóa dữ liệu trình duyệt.

Để vận hành thật cần triển khai xác thực/phân quyền phía server, API CRUD được bảo vệ, upload ảnh và schema chi tiết sản phẩm cho cả Next.js/MySQL và backend PHP DirectAdmin. Không dùng cờ localStorage làm xác thực.

## Kiểm tra

Đã thử bằng trình duyệt: tìm mã sản phẩm, mở sửa, lưu nháp, công tắc ẩn sau lưu nháp, chọn ngày thuê, lưu thay đổi và mở/đóng xem trước. Kiểm tra bố cục desktop 1440px và mobile 390px.

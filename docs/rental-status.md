# Tình trạng thuê

Mỗi mã trang phục tương ứng một bộ. API PHP tính tình trạng từ đơn thuê:
chỉ cần còn một đơn confirmed thì hiển thị Đang cho thuê, kể cả lịch tương lai.
Không còn đơn confirmed thì hiển thị Sẵn sàng. Không chỉnh tay tình trạng.

Các khoảng không trùng lịch vẫn nhận yêu cầu và chốt đơn bình thường.
Nút Đã nhận lại đồ ở màn Đặt lịch thuê chuyển confirmed thành completed,
lưu returnedAt UTC và mở lịch từ ngày trả thực tế (giờ Việt Nam) trở đi.
Không cần bước vệ sinh. Các ngày lịch sử giữ lại; lịch của đơn khác không đổi.
Đơn completed không thể hủy/chốt lại. Gửi lại thao tác nhận đồ không đổi timestamp.

Trước khi triển khai hosting, chạy directadmin/migrations/003-rental-return.sql
hoặc scripts/php-migrate.php. Local đã được cập nhật. Không tự hoàn tất đơn cũ
theo ngày kết thúc: admin phải xác nhận thực tế đã nhận lại đồ.

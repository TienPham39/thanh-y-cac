# Giá thuê và cọc giữ lịch

Tổng thuê = giá ngày đầu + (số ngày - 1) × phụ thu ngày tiếp + phí phụ kiện một lần.
Cọc giữ lịch trừ vào tiền thuê, không cộng thêm. Số ngày là chênh lệch ngày nhận
và trả, tối thiểu 1; lịch hiện chỉ chọn ngày, chưa hỗ trợ giờ nhận/trả.

PHP tính giá từ database khi gửi yêu cầu và lưu priceSnapshot bất biến vào đơn.
Xác nhận cọc ghi nhận depositConfirmedAt. Trả sớm không đổi giá đã lưu.
Số còn thanh toán chỉ phản ánh tổng trừ cọc; chưa theo dõi thanh toán phần còn lại.

Chạy migration 004-rental-pricing.sql trước triển khai. Đơn cũ không được tự gán
giá mới. Sản phẩm chưa cấu hình dùng giá ngày tiếp bằng giá ngày đầu, cọc và
phí phụ kiện bằng 0. Giá từng lưu ở localStorage cần được admin kiểm tra rồi
Lưu thay đổi để đưa vào database; số 0 được giữ nguyên, không dùng giá mặc định.

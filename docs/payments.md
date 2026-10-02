# Giỏ hàng và thanh toán cọc

Khách thêm trang phục từ trang chi tiết vào `/gio-hang/`, chọn ngày nhận/trả cho từng bộ, nhập thông tin tại `/thanh-toan/` và theo dõi tại `/ket-qua-thanh-toan/`. Giỏ lưu trên trình duyệt, tối đa 8 bộ, mỗi bộ một lịch thuê. Giá được tính lại từ database khi tạo đơn; giá phía trình duyệt không quyết định số tiền thu.

Hệ thống chỉ thu **cọc giữ lịch**, trừ cọc vào tổng tiền thuê. Trang phục cọc 0đ vẫn là yêu cầu chờ cửa hàng xác nhận, kể cả khi các trang phục có cọc trong cùng giỏ đã thanh toán online.

## Chuyển khoản thủ công

Khi chưa có payOS, khách chuyển khoản đến **BIDV · 7411028927 · Phạm Gia Tiến**, với nội dung `TYC <mã thanh toán>` hiển thị trên màn kết quả. Khách có thể sao chép thông tin và mở Zalo để gửi biên lai. Cửa hàng kiểm tra tiền thực tế và xác nhận từng yêu cầu ở Đặt lịch thuê. Đơn chờ chuyển khoản thủ công chưa khóa lịch.

Thông tin ngân hàng có thể đổi bằng `paymentBank`, `paymentAccount`, `paymentAccountName` trong private `config.php`. Đây là thông tin do chủ hệ thống cung cấp; ứng dụng chưa xác minh với ngân hàng.

## Bật payOS

1. Chạy migration `directadmin/migrations/008-payos-checkout.sql` trên database hosting trước khi bật giao diện mới. Local đã được áp dụng. `scripts/php-migrate.php` và bộ kiểm tra API cũng bao gồm migration này.
2. Tạo kênh thanh toán **riêng của Thanh Y Các** và cấu hình `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` cho PHP. Trên DirectAdmin có thể dùng `payosClientId`, `payosApiKey`, `payosChecksumKey` trong private `config.php` ngoài document root. Không dùng biến `NEXT_PUBLIC_*`, không đưa khóa vào Git.
3. PHP cần 64 bit, PDO MySQL và cURL. Đặt `appOrigin`/`APP_ORIGIN` bằng domain HTTPS thực tế.
4. Cấu hình webhook trên kênh payOS: `https://thanhycac.com/api/payments/webhook` (đổi domain nếu triển khai nơi khác).
5. Kiểm tra thực tế tạo QR, chuyển tiền, webhook, trạng thái Đặt lịch thuê và lịch khả dụng trước khi mở thanh toán cho khách. Chưa có khóa payOS nên chưa kiểm tra được giao dịch ngân hàng thật.

Đơn online giữ tạm các ngày thuê có cọc trong **15 phút**. Số tiền, chữ ký HMAC SHA-256, mã đơn và mã giao dịch được kiểm tra trước khi chốt. Redirect của trang thanh toán không xác nhận đã thu tiền. Webhook lặp không chốt hai lần. Giao dịch tới sau khi hết hạn, lịch trùng, hoặc yêu cầu đã hủy được gắn **cần đối soát**, không tự giữ lịch. Việc hoàn tiền được cửa hàng xử lý thủ công. Không có chức năng tự hoàn tiền.

Nếu mất phản hồi khi tạo liên kết, gửi lại cùng mã checkout và token để lấy lại đơn; không tạo mã đơn mới. Token truy cập kết quả lưu trong `sessionStorage` của tab tạo đơn, không nằm trong URL. Mở kết quả ở trình duyệt khác cần liên hệ cửa hàng cùng mã đơn. Tra cứu không công khai thông tin liên hệ khách.

Admin thấy mã chuyển khoản, phương thức, mã giao dịch và lý do đối soát trong thẻ yêu cầu. Yêu cầu có cọc payOS được xác nhận bằng webhook; nút xác nhận thủ công chỉ dành cho các yêu cầu khác.

## Kiểm tra

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. `npm run test:php` cần tài khoản MySQL có quyền tạo/xóa database thử `tyc_test_*`; bộ kiểm tra tạo database riêng rồi dọn dẹp, kiểm tra retry, token, CSRF, giá từ server, giữ lịch, chữ ký, webhook lặp và giao dịch trễ. Khóa payOS thử chỉ dùng xác minh webhook trên database riêng; bộ kiểm tra không gọi provider và không chuyển tiền.

Tham chiếu: [payOS API](https://payos.vn/docs/api/) và [kiểm tra chữ ký webhook](https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/).

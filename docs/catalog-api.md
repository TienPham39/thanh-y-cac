# API trang phục

API đọc dữ liệu MySQL bằng Prisma. Chỉ trả sản phẩm `published=true`. API đổi trạng thái mở bán yêu cầu phiên quản trị hợp lệ.

Trang chủ lấy tối đa 4 sản phẩm qua `/api/products?pageSize=4&sort=popular`, thêm `category` khi lọc; danh mục lấy từ `/api/product-categories`. Ảnh, tên và nút đặt thuê dẫn tới `/trang-phuc/:slug`.

Ảnh sản phẩm: payload quản trị hỗ trợ `images` gồm 1–8 đường dẫn ảnh nội bộ, giữ nguyên thứ tự, ảnh đầu tiên là `image` đại diện. Cột JSON `CostumeProduct.images` được thêm bằng migration `20260926000000_product_gallery`. API đọc trả `images` khi đã lưu bộ ảnh; sản phẩm cũ chưa lưu bộ ảnh tiếp tục dùng `image`. Ảnh bổ sung từng lưu trong bản nháp trình duyệt cần được lưu lại từ trang quản trị. Sau migration, generate Prisma Client và khởi động lại server đang chạy.

Trang chi tiết hiển thị ảnh lớn, ảnh thu nhỏ và hộp xem phóng to (phím trái/phải, Escape để đóng). Lịch mở dạng bảng chọn ngày bên cạnh giá thuê, với Hủy/Áp dụng; form thông tin nằm riêng bên dưới vùng ảnh và thông tin sản phẩm. Lịch dương tiếng Việt bắt đầu từ Thứ Hai, ngày hiện tại theo giờ Việt Nam, không cho chọn quá khứ. Tiền tạm tính giữ quy tắc số ngày chênh lệch, tối thiểu một ngày; chưa có API lịch trống hay gửi đơn đặt lịch.

Ảnh upload `/uploads/:filename` được rewrite tới `/api/uploads/:filename` để đọc file trong `public/uploads` ngay cả khi file được tạo sau lúc server khởi động. Thư mục này cần được lưu bền vững và dùng chung với tiến trình nhận upload. Khi phát triển trên host, dùng overlay `compose.dev.yaml` để tránh container web cũ chiếm cổng 3000.

| Endpoint | Kết quả |
| --- | --- |
| GET /api/products | `{ data, pagination: { page, pageSize, total, totalPages } }` |
| GET /api/products/:slug | `{ data }`, 404 nếu không tồn tại hoặc chưa công khai |
| GET /api/product-categories | `{ data: [{ slug, name, count }] }`, count chỉ tính sản phẩm công khai |
| GET /api/admin/products | Danh sách sản phẩm từ MySQL, gồm cả sản phẩm đã ẩn; yêu cầu đăng nhập quản trị |
| DELETE /api/admin/products | Nhận `{ codes: string[] }`; xóa tối đa 100 sản phẩm khỏi MySQL; yêu cầu đăng nhập quản trị |
| GET /api/admin/products/publication | `{ data: [{ code, published }] }`, yêu cầu đăng nhập quản trị |
| PATCH /api/admin/products/publication | Nhận thông tin trang phục và `published: boolean`; cập nhật trạng thái trong MySQL, tạo sản phẩm nếu mã chưa tồn tại; yêu cầu đăng nhập quản trị |

Các tham số danh sách:

| Tham số | Giá trị |
| --- | --- |
| q | Tên, mã, mô tả hoặc tên danh mục; tối đa 100 ký tự |
| category | Slug danh mục; có thể lặp để chọn nhiều danh mục (OR) |
| gender | female, male, unisex |
| price | under300 (<300000), 300to500 (300000–500000), over500 (>500000) |
| availability | available, advance; trạng thái mẫu, không phải lịch trống theo ngày |
| height | under155, 155to165, 165to175, over175; lấy trang phục có khoảng chiều cao giao với khoảng chọn |
| accessory | hairpin, fan, sword, embroidered; có thể lặp, sản phẩm phải có tất cả phụ kiện chọn (AND) |
| sort | popular (mặc định), newest, price-asc, price-desc |
| page | Số nguyên 1–10000, mặc định 1 |
| pageSize | Số nguyên 1–24, mặc định 9 |

Tham số không hỗ trợ hoặc giá trị sai trả 400 `INVALID_QUERY`. Lỗi database trả 503 `DATABASE_UNAVAILABLE`. Trang vượt số trang trả mảng rỗng. Không tiết lộ lỗi database cho client.

Ví dụ: `/api/products?category=kiem-hiep&price=300to500&sort=price-asc&pageSize=9`.

## Migration và dữ liệu mẫu

```powershell
docker compose up -d --build app
docker compose run --rm --build seed
```

Compose tự chạy migration trước app. Seed là thao tác riêng, tạo 5 danh mục và 10 sản phẩm theo bản thiết kế; chạy lại không ghi đè sản phẩm đã chỉnh sửa. Giá, kích cỡ, tên, trạng thái và ảnh là dữ liệu mẫu cần xác nhận trước khi sử dụng kinh doanh. Hai sản phẩm chưa có ảnh dùng logo. Không seed tự động vào database production.

Local Node.js: sau khi MySQL chạy và DATABASE_URL đúng (cổng `3307` khi dùng `compose.dev.yaml`), `npm run db:deploy`, `npm run db:generate`, `npm run db:seed`, `npm run dev`. Danh sách quản trị đọc cùng nguồn MySQL với trang khách hàng, rồi thêm các bản nháp mới chưa có trên server. Chỉnh sửa thông tin trong form vẫn lưu bản nháp trong trình duyệt; riêng thao tác mở/ẩn bán cập nhật MySQL.

Kiểm tra API database với seed: `node scripts/test-catalog.mjs`; có thể đặt `CATALOG_BASE_URL` để kiểm tra server khác. Chạy riêng `npm run lint` và `npm run typecheck`.

## Rental requests

`POST /api/rental-requests` validates the published product, Vietnamese phone number, date-only pickup/return range and optional measurements. It stores a pending request before the client opens Zalo. UUID submission IDs deduplicate retries; Redis limits requests per phone to ten per ten minutes. Failed writes keep form input and do not navigate to Zalo.

Apply `prisma migrate deploy` and regenerate Prisma before running the updated application. Both MySQL and Redis must be available.

Authenticated admins use `/admin/dat-lich`. The header unread count and request list refresh every 15 seconds and the count refreshes on window focus. Marking a request read clears its notification; it does not confirm a reservation or block dates. These are in-app notifications, not Zalo/email/push delivery. Customer fields are returned only by the authenticated admin API, with no-store caching. No customer account is required.

### Agreed reservation rule
A request does not reserve inventory. Only admin confirmation of received deposit locks the rental dates. The first deposit confirmation wins; subsequent overlapping confirmations must be rejected atomically. Implemented: admin can confirm received deposit or cancel a request. Confirmation writes one RentalReservedDay per inclusive calendar date in the same transaction as the status change. The unique product/date key prevents concurrent overlapping confirmations; failure rolls the entire transaction back. Cancellation releases the reserved days. Cancelled requests cannot be confirmed again.

The customer form now has separate actions: submit the request (no Zalo redirect) and open Zalo (no submission). Successful submission shows a toast and resets all fields and the selected dates; errors preserve input for retry.


Public availability: GET /api/products/availability?slug=... returns only confirmed start/end dates, never customer data. The calendar refreshes every 15 seconds and on focus, shows booked ranges, blocks endpoints and ranges crossing reserved days, and disables applying dates when availability cannot load. The submission API rechecks reserved days; only admin confirmation actually locks them. Apply the reservation-days migration and regenerate/restart Prisma before using the feature. Each product is treated as one rentable outfit.

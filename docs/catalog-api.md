# API trang phục

API đọc dữ liệu MySQL bằng Prisma. Chỉ trả sản phẩm `published=true`. Chưa mở API ghi dữ liệu khi chưa có xác thực quản trị.

| Endpoint | Kết quả |
| --- | --- |
| GET /api/products | `{ data, pagination: { page, pageSize, total, totalPages } }` |
| GET /api/products/:slug | `{ data }`, 404 nếu không tồn tại hoặc chưa công khai |
| GET /api/product-categories | `{ data: [{ slug, name, count }] }`, count chỉ tính sản phẩm công khai |

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

Local Node.js: sau khi MySQL chạy và DATABASE_URL đúng, `npm run db:deploy`, `npm run db:generate`, `npm run db:seed`, `npm run dev`.

Kiểm tra API database với seed: `node scripts/test-catalog.mjs`; có thể đặt `CATALOG_BASE_URL` để kiểm tra server khác. Chạy riêng `npm run lint` và `npm run typecheck`.

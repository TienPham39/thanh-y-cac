# Thanh Y Các

Bộ khung Next.js 15, React 19, App Router, TypeScript, Tailwind CSS 3, Node.js 22, MySQL 8.4, Prisma ORM 6, Redis 7.4 và npm. Trang chủ hiện là trang chờ tiếng Việt; chưa có chức năng nghiệp vụ.

## Chạy toàn bộ bằng Docker

Yêu cầu Docker Desktop đang chạy (Linux containers), Docker Compose v2.

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

Trên macOS/Linux dùng `cp .env.example .env`. Không ghi đè `.env` nếu đã cấu hình.

Mở http://localhost:3000. Compose tự chờ MySQL/Redis sẵn sàng và chạy `prisma migrate deploy` trước khi khởi động app. Image ứng dụng dùng standalone output và chạy bằng user `node`.

```sh
docker compose ps -a
docker compose logs --tail=100 app migrate
docker compose down
```

`down` giữ dữ liệu MySQL trong named volume. Redis chỉ dùng làm cache, không lưu bền vững. Không dùng `down -v` nếu cần giữ database.

## Phát triển với npm

Yêu cầu Node.js 22 và npm. Dừng app Docker nếu cổng 3000 đang được sử dụng.

```sh
docker compose stop app
docker compose -f compose.yaml -f compose.dev.yaml up -d mysql redis
npm ci
npm run db:generate
npm run db:deploy
npm run dev
```

`.env.example` có URL localhost dành cho chế độ này. Docker tự thay hostname bằng `mysql` và `redis` trong mạng nội bộ. Các cổng database/cache của file dev chỉ bind localhost.

## Database

`prisma/schema.prisma` hiện có bảng cấu hình `AppSetting`. Khi thêm model:

```sh
npm run db:migrate -- --name ten_thay_doi
npm run db:generate
```

`migrate dev` cần quyền tạo shadow database; tài khoản MySQL mặc định chỉ có quyền trên database ứng dụng. Hãy cấp tài khoản phát triển phù hợp hoặc cấu hình shadow database riêng trước khi tạo migration. Chạy migration đã có bằng `db:deploy` không cần quyền này. Commit thư mục migration cùng source; không chạy `migrate dev` trên production.

## Kiểm tra

```sh
npm run lint
npm run typecheck
npm run build
docker compose config --quiet
```

- `GET /api/health`: liveness, trả 200 khi web server hoạt động.
- `GET /api/ready`: truy vấn MySQL qua Prisma và ping Redis; trả 200 khi cả hai hoạt động, 503 khi chưa sẵn sàng. Không công khai lỗi hay thông tin kết nối.
- `src/lib/prisma.ts`: Prisma Client dùng chung trong tiến trình.
- `src/lib/redis.ts`: tạo Redis client; gọi `connect()` trước khi dùng và `disconnect()` trong `finally`.

## Cấu hình triển khai

Mật khẩu mẫu chỉ dành cho máy local. Thay mật khẩu trong `.env` trước khi đưa lên server; dùng ký tự URL-safe cho MYSQL_PASSWORD vì Compose đưa giá trị này vào DATABASE_URL. Không commit `.env`. Thay mật khẩu env sau khi tạo volume không tự đổi mật khẩu tài khoản MySQL đã tồn tại.

App mặc định bind `127.0.0.1:3000`, phù hợp truy cập local hoặc reverse proxy trên host. Khi triển khai công khai cần cấu hình domain, HTTPS, reverse proxy và backup MySQL. Docker không publish cổng MySQL/Redis trừ khi dùng file dev.

Nguồn tham khảo: [Next.js self-hosting](https://nextjs.org/docs/15/app/guides/self-hosting), [Prisma ORM 6](https://docs.prisma.io/docs/orm/v6), [Docker Compose](https://docs.docker.com/compose/).

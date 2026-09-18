# Phạm vi khởi tạo

Tạo bộ khung Thanh Y Các theo stack đã yêu cầu: Next.js 15 / React 19 / App Router, TypeScript, Tailwind CSS, Node.js 22, MySQL, Prisma ORM 6, Redis, npm và Docker Compose.

- Trang chủ tiếng Việt responsive theo ảnh thiết kế người dùng cung cấp: banner, bộ sưu tập, quy trình thuê, CTA liên hệ, footer. Danh mục mẫu ở frontend; chưa kết nối nghiệp vụ đặt thuê.
- `src/app` chứa UI và API; `src/lib` chứa kết nối server-only; `prisma` chứa schema và migration.
- Health liveness không truy cập DB; readiness kiểm tra MySQL và Redis, trả 503 khi phụ thuộc không sẵn sàng.
- Docker: app chạy non-root, migration chạy một lần trước app, MySQL lưu volume, Redis là cache có thể xóa.
- Kiểm tra: npm run lint, npm run typecheck, npm run build, prisma validate, Docker Compose và HTTP smoke test khi môi trường cho phép.
- Chưa bao gồm đăng nhập, quản trị, bán hàng, dữ liệu nghiệp vụ hay triển khai lên máy chủ bên ngoài.

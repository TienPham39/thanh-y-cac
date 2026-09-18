# Trang chủ Thanh Y Các

Nguồn thiết kế: ảnh người dùng gửi, public/images/pages/Trang Chủ - Thanh Y Các.png.

- Nền #fff9f7, nền quy trình #fcf0ed, đỏ #80151c, đỏ CTA #590008, vàng #f4d49b.
- Toàn bộ giao diện dùng Noto Serif, gồm nội dung, menu, nút và tiêu đề; tải local các weight 400/500/600/700 và italic 400, hỗ trợ tiếng Việt. Hero 60px, section 38px; body 16px.
- Khung desktop 1256px, lề 50px tại 1356px. Header 86px, hero 750px. Bộ sưu tập 4 cột, quy trình 4 cột, footer 3 cột.
- Banner đầu banner-3, ảnh phụ banner-1 và banner-2. Ảnh sản phẩm dùng logo.png như mẫu.
- Mobile: menu thu gọn, grid 2 cột rồi 1 cột ở màn rất hẹp; footer dọc.
- Carousel thủ công; keyboard focus rõ, hỗ trợ reduced motion. Đặt lịch dẫn đến tư vấn, không giả lập thành công backend.

Cập nhật theo phản hồi: favicon /images/favicon.png; hero ba dòng Lựa Chọn / Trang Phục / Yêu Thích Của Bạn; tiêu đề sản phẩm và quy trình dùng Noto Serif 700 (latin + vietnamese, self-hosted từ @fontsource). Các hàng quy trình desktop dùng CSS subgrid để mô tả thẳng hàng. Họa tiết header neo vào header-actions thay vì mép viewport.


Menu điều hướng header (.main-nav) dùng riêng Be Vietnam Pro 500/600 với bộ ký tự tiếng Việt, áp dụng cả desktop và mobile. Các phần còn lại giữ Noto Serif.

Nền toàn bộ header dùng /images/bg-header.png, căn giữa và cover. Bỏ họa tiết bg-sakura neo phía sau nút đặt lịch.

Kích thước nền header giảm còn 80% chiều rộng, giữ tỉ lệ ảnh và căn giữa; cấu hình bằng Tailwind bg-[length:80%_auto], bg-center, bg-no-repeat.

Nền header gồm hai lớp trang trí rộng 50%, ảnh mỗi lớp rộng 80vw giữ tỉ lệ, neo bg-left và bg-right để họa tiết nhỏ luôn sát hai mép viewport.

Chỉnh sửa giao diện mới phải dùng Tailwind theo yêu cầu người dùng. Họa tiết active menu dùng hai đường 1px và hình thoi border qua Tailwind, bỏ pseudo-element ảnh line2 gây vỡ nét.

Nút header Đặt lịch ngay dùng Be Vietnam Pro, viền vàng đậm #B88632; calendar và arrow SVG màu #FFDEAC. Cấu hình bằng Tailwind.

Trang /trang-phuc: bộ lọc có tiêu đề và nút Mặc định cùng hàng, icon SVG nét; sidebar sticky không có vùng cuộn riêng. Search dạng pill viền đỏ, nút tìm đỏ liền khối trên hàng riêng. Nội dung card và bộ lọc 14px, thông tin phụ 12px, tên sản phẩm 20px. Phân trang mặc định 9 sản phẩm, seed 10 mẫu để hiển thị 2 trang.
`nCập nhật typography: Inter self-hosted thay Be Vietnam Pro trong nội dung, menu và controls; body dùng Inter, tiêu đề giữ Noto Serif. Catalog max-width 1600px, grid tự chia cột với card tối thiểu 300px; ảnh cao 260/280/300px, nút một dòng và CTA rộng hơn.
`nHiệu ứng hoa anh đào: một canvas tsParticles lazy-load toàn site, z-index 1 trên nền và dưới nội dung z-index 2, không nhận pointer. PNG local trong suốt, 22 cánh desktop/15 mobile, opacity 0.25–0.5, 60fps tối đa, không retina để giới hạn pixel, pause khi ẩn tab; respects prefers-reduced-motion. Dùng @tsparticles/react 3.0.0 + slim 3.9.1 vì React 4.4.0 khai báo exports.types tới lib/index.d.ts không có trong package.
`nProduct cards: IntersectionObserver reveal một lần mỗi mount, fade + translateY 16px trong 500ms, stagger theo hàng tối đa 210ms. Hover ảnh scale 1.06 trong 350ms, không đổi layout; reduced-motion tắt reveal/scale. Bỏ skip link Đến danh sách trang phục theo yêu cầu.
`nTinh chỉnh reveal: useLayoutEffect chuẩn bị trước paint, 600ms/20px, delay đầu 80ms + 100ms mỗi cột (tối đa thêm 300ms); reload remount chạy lại, scroll quay lại không lặp. Vùng hover bao toàn ảnh, scale 1.07, 350ms.
`nTrang catalog: header, banner title, toolbar, sidebar panels, status, pagination, rental heading/steps và footer columns reveal 550ms/14px, stagger tối đa 210ms; một lần mỗi DOM element, cleanup khi rời route, keyboard focus hiển thị ngay. Không transform phần tử sticky hoặc thêm wrapper thay layout.
`nTrang chủ dùng PageReveal chung: hero copy/actions/stats, carousel controls, collection heading/tabs/CTA, rental steps, contact và footer; chỉ reveal lần đầu vào viewport, hỗ trợ reduced motion. Menu Thuê trang phục active có cùng gạch ngang/hình thoi với Trang chủ.

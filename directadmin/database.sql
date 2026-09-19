-- Thanh Y Cac: schema va du lieu mau cho MariaDB/MySQL.
-- Co the import lai: CREATE TABLE IF NOT EXISTS + INSERT IGNORE khong xoa du lieu hien co.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `AppSetting` (
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ProductCategory` (
  `slug` VARCHAR(80) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `position` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CostumeProduct` (
  `slug` VARCHAR(100) NOT NULL,
  `code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `price` INT NOT NULL,
  `categorySlug` VARCHAR(80) NOT NULL,
  `gender` VARCHAR(20) NOT NULL,
  `availability` VARCHAR(20) NOT NULL,
  `minHeight` INT NOT NULL,
  `maxHeight` INT NOT NULL,
  `minWeight` INT NOT NULL,
  `maxWeight` INT NOT NULL,
  `tags` JSON NOT NULL,
  `accessories` JSON NOT NULL,
  `badge` VARCHAR(80) NOT NULL,
  `badgeTone` VARCHAR(20) NOT NULL DEFAULT 'red',
  `popularity` INT NOT NULL DEFAULT 0,
  `published` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`slug`),
  UNIQUE KEY `CostumeProduct_code_key` (`code`),
  KEY `CostumeProduct_published_categorySlug_price_idx` (`published`, `categorySlug`, `price`),
  CONSTRAINT `CostumeProduct_categorySlug_fkey` FOREIGN KEY (`categorySlug`) REFERENCES `ProductCategory` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `ProductCategory` (`slug`, `name`, `position`) VALUES
  ('duong-trieu', 'Cung Đình Đường Triều', 0),
  ('minh-trieu', 'Minh Triều & Cung Phi', 1),
  ('han-trieu', 'Hán Triều Cổ Phong', 2),
  ('kiem-hiep', 'Kiếm Hiệp & Tiên Hiệp', 3),
  ('dan-quoc', 'Dân Quốc Tân Thời', 4);

INSERT IGNORE INTO `CostumeProduct`
  (`slug`, `code`, `name`, `description`, `image`, `price`, `categorySlug`, `gender`, `availability`, `minHeight`, `maxHeight`, `minWeight`, `maxWeight`, `tags`, `accessories`, `badge`, `badgeTone`, `popularity`, `published`)
VALUES
  ('mau-don', 'TYC-CD01', 'Cung Trang Mẫu Đơn Phú Quý', 'Gấm đỏ thẫm tôn nét kiêu sa, dệt gấm sa 4 lớp thêu kim tuyến hoa mẫu đơn phú quý.', '/images/banner-1.png', 450000, 'duong-trieu', 'female', 'available', 155, 170, 45, 62, '["Cung đình", "Quý tộc"]', '["hairpin", "fan"]', 'Được thuê nhiều', 'red', 100, TRUE),
  ('lam-sac', 'TYC-TH12', 'Lam Sắc Cửu Vĩ Tiên Nhu', 'Sắc lam thanh nhã, nhẹ nhàng như mây khói, voan mỏng chuyển màu bay bổng.', '/images/banner-3.png', 380000, 'kiem-hiep', 'female', 'available', 152, 168, 42, 58, '["Tiên hiệp", "Cổ trang"]', '["hairpin", "fan"]', 'Mẫu mới', 'green', 99, TRUE),
  ('thuy-truc', 'TYC-MT05', 'Thúy Trúc Minh Triều Phi Phong', 'Áo choàng thêu tinh xảo, tôn dáng trang nhã kết hợp chân váy Mã Diện lấp lánh.', '/images/mong-co.jpg', 420000, 'minh-trieu', 'female', 'available', 155, 172, 45, 65, '["Cổ phục", "Mùa đông"]', '["hairpin", "embroidered"]', 'Được yêu thích', 'gold', 98, TRUE),
  ('phuong-hoang', 'TYC-HP03', 'Phượng Hoàng Vu Phi Hỷ Phục', 'Hỷ phục gấm đỏ thêu tay nổi Phượng Cửu Thiên, kết hợp mũ Cửu Phượng Quan.', '/images/banner-2.png', 680000, 'han-trieu', 'female', 'advance', 155, 168, 46, 60, '["Hỷ phục cưới", "Hoàng gia"]', '["hairpin", "embroidered"]', 'Hỷ Phục Đại Lễ', 'red', 97, TRUE),
  ('bich-ngoc', 'TYC-DQ02', 'Bích Ngọc Dân Quốc Kỳ Bào', 'Vải nhung xanh ngọc bích cao cấp may phom chuẩn tôn dáng, nút thắt cổ điển.', '/images/logo.png', 290000, 'dan-quoc', 'female', 'available', 158, 170, 46, 56, '["Dân Quốc", "Sườn xám"]', '["fan"]', 'Được yêu thích', 'green', 96, TRUE),
  ('nguyet-ha', 'TYC-KH08', 'Nguyệt Hạ Độc Hành Đạo Bào', 'Lụa gấm dệt trúc trầm mặc, kèm bao hộ cổ tay kiếm sĩ và đai lưng khắc hoa văn.', '/images/logo.png', 350000, 'kiem-hiep', 'male', 'available', 168, 182, 55, 78, '["Hào kiệt", "Đạo bào"]', '["sword"]', 'Kiếm Hiệp Nam Y', 'green', 95, TRUE),
  ('van-lien', 'TYC-DT07', 'Vân Liên Đường Triều', 'Trang phục mẫu sắc hồng dịu, tay áo mềm rủ phối chân váy nhiều lớp cho concept cung đình.', '/images/banner-1.png', 460000, 'duong-trieu', 'female', 'available', 153, 170, 43, 62, '["Đường triều", "Cung đình"]', '["hairpin", "fan"]', 'Mẫu mới', 'red', 94, TRUE),
  ('thanh-phong', 'TYC-KH09', 'Thanh Phong Kiếm Khách', 'Đạo bào mẫu dáng suông, phối đai lưng gọn gàng và kiếm cho concept kiếm khách cổ phong.', '/images/banner-3.png', 390000, 'kiem-hiep', 'unisex', 'available', 165, 185, 52, 80, '["Kiếm hiệp", "Cổ phong"]', '["sword"]', 'Mẫu mới', 'green', 93, TRUE),
  ('hong-lien', 'TYC-HT06', 'Hồng Liên Hán Phục', 'Hán phục mẫu tông đỏ ấm, tay áo rộng và đường thêu hoa phù hợp chụp ảnh cổ trang.', '/images/banner-2.png', 520000, 'han-trieu', 'female', 'advance', 155, 173, 45, 65, '["Hán phục", "Thêu hoa"]', '["hairpin", "embroidered"]', 'Mẫu mới', 'red', 92, TRUE),
  ('ngoc-diep', 'TYC-MT08', 'Ngọc Điệp Minh Triều', 'Trang phục mẫu phối áo choàng và chân váy dài, điểm hoa văn trang nhã cho concept Minh triều.', '/images/mong-co.jpg', 430000, 'minh-trieu', 'female', 'available', 150, 168, 42, 60, '["Minh triều", "Cổ phục"]', '["fan", "embroidered"]', 'Mẫu mới', 'gold', 91, TRUE);

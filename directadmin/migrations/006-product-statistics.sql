SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'likes') = 0, 'ALTER TABLE CostumeProduct ADD COLUMN likes INT NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'rating') = 0, 'ALTER TABLE CostumeProduct ADD COLUMN rating DECIMAL(2,1) NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'reviewCount') = 0, 'ALTER TABLE CostumeProduct ADD COLUMN reviewCount INT NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;

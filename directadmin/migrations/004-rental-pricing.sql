SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'extraDay') = 0, 'ALTER TABLE CostumeProduct ADD COLUMN extraDay INT NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'deposit') = 0, 'ALTER TABLE CostumeProduct ADD COLUMN deposit INT NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'accessoryFee') = 0, 'ALTER TABLE CostumeProduct ADD COLUMN accessoryFee INT NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RentalRequest' AND COLUMN_NAME = 'priceSnapshot') = 0, 'ALTER TABLE RentalRequest ADD COLUMN priceSnapshot JSON NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;

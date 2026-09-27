SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'components') = 0, 'ALTER TABLE CostumeProduct ADD COLUMN components TEXT NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'componentImages') = 0, 'ALTER TABLE CostumeProduct ADD COLUMN componentImages JSON NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;

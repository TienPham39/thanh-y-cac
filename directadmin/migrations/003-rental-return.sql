SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RentalRequest' AND COLUMN_NAME = 'returnedAt') = 0,
 'ALTER TABLE RentalRequest ADD COLUMN returnedAt DATETIME(3) NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;

SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProductCategory' AND COLUMN_NAME = 'codePrefix') = 0,
 'ALTER TABLE ProductCategory ADD COLUMN codePrefix VARCHAR(10) NULL, ADD UNIQUE KEY ProductCategory_codePrefix_key (codePrefix)', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
UPDATE ProductCategory SET codePrefix = CASE slug WHEN 'duong-trieu' THEN 'CD' WHEN 'minh-trieu' THEN 'CP' WHEN 'han-trieu' THEN 'HP' WHEN 'kiem-hiep' THEN 'KH' WHEN 'dan-quoc' THEN 'DQ' ELSE NULL END WHERE codePrefix IS NULL;

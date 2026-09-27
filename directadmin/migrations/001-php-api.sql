-- MariaDB 10.6+ / MySQL 8+. Back up first; run before deploying the PHP API.
-- Additive and repeatable: no customer/product rows are deleted.
SET NAMES utf8mb4;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CostumeProduct' AND COLUMN_NAME = 'images') = 0,
 'ALTER TABLE CostumeProduct ADD COLUMN images JSON NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
CREATE TABLE IF NOT EXISTS RentalRequest (
 id VARCHAR(36) NOT NULL PRIMARY KEY,
 productSlug VARCHAR(100) NOT NULL, productCode VARCHAR(40) NOT NULL, productName VARCHAR(191) NOT NULL,
 name VARCHAR(120) NOT NULL, phone VARCHAR(20) NOT NULL, start VARCHAR(10) NOT NULL, end VARCHAR(10) NOT NULL,
 height INT NULL, weight INT NULL, note TEXT NOT NULL, readAt DATETIME(3) NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'pending', depositConfirmedAt DATETIME(3) NULL,
 createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX RentalRequest_readAt_createdAt_idx (readAt, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RentalRequest' AND COLUMN_NAME = 'status') = 0,
 'ALTER TABLE RentalRequest ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''pending''', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
SET @tyc_sql = IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'RentalRequest' AND COLUMN_NAME = 'depositConfirmedAt') = 0,
 'ALTER TABLE RentalRequest ADD COLUMN depositConfirmedAt DATETIME(3) NULL', 'SELECT 1');
PREPARE tyc_stmt FROM @tyc_sql; EXECUTE tyc_stmt; DEALLOCATE PREPARE tyc_stmt;
ALTER TABLE CostumeProduct ENGINE=InnoDB;
ALTER TABLE RentalRequest ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS RentalReservedDay (
 productSlug VARCHAR(100) NOT NULL, day VARCHAR(10) NOT NULL, requestId VARCHAR(36) NOT NULL,
 PRIMARY KEY (productSlug, day), INDEX RentalReservedDay_requestId_idx (requestId),
 CONSTRAINT RentalReservedDay_requestId_fkey FOREIGN KEY (requestId) REFERENCES RentalRequest(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE RentalReservedDay ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ApiRateLimit (
 `key` CHAR(64) NOT NULL PRIMARY KEY, hits INT NOT NULL, expiresAt BIGINT NOT NULL,
 INDEX ApiRateLimit_expiresAt_idx (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Backfill confirmed bookings. Conflicts stop migration instead of losing reservations.
CREATE TEMPORARY TABLE tyc_days (n INT PRIMARY KEY);
INSERT INTO tyc_days (n)
SELECT a.n + 10*b.n + 100*c.n FROM
(SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
CROSS JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
CROSS JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) c
WHERE a.n + 10*b.n + 100*c.n <= 365;
INSERT INTO RentalReservedDay (productSlug, day, requestId)
SELECT r.productSlug, DATE_FORMAT(DATE_ADD(r.start, INTERVAL d.n DAY), '%Y-%m-%d'), r.id
FROM RentalRequest r JOIN tyc_days d ON d.n <= DATEDIFF(r.end, r.start)
WHERE r.status = 'confirmed' AND NOT EXISTS (
 SELECT 1 FROM RentalReservedDay existing WHERE existing.productSlug = r.productSlug
 AND existing.day = DATE_FORMAT(DATE_ADD(r.start, INTERVAL d.n DAY), '%Y-%m-%d') AND existing.requestId = r.id
);
DROP TEMPORARY TABLE tyc_days;

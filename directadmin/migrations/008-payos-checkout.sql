CREATE TABLE IF NOT EXISTS RentalCheckout (
 id VARCHAR(36) PRIMARY KEY, tokenHash CHAR(64) NOT NULL, payloadHash CHAR(64) NOT NULL,
 orderCode BIGINT NOT NULL UNIQUE, amount BIGINT NOT NULL, total BIGINT NOT NULL,
 state VARCHAR(20) NOT NULL DEFAULT 'pending', paymentMethod VARCHAR(20) NOT NULL, expiresAt DATETIME(3) NOT NULL,
 checkoutUrl TEXT NULL, qrCode TEXT NULL, transactionRef VARCHAR(191) NULL UNIQUE,
 reviewReason VARCHAR(500) NULL, createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS RentalCheckoutItem (
 checkoutId VARCHAR(36) NOT NULL, requestId VARCHAR(36) NOT NULL PRIMARY KEY,
 online TINYINT(1) NOT NULL,
 FOREIGN KEY (checkoutId) REFERENCES RentalCheckout(id),
 FOREIGN KEY (requestId) REFERENCES RentalRequest(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS RentalPaymentHold (
 productSlug VARCHAR(100) NOT NULL, day VARCHAR(10) NOT NULL, checkoutId VARCHAR(36) NOT NULL,
 expiresAt DATETIME(3) NOT NULL, PRIMARY KEY (productSlug, day),
 INDEX RentalPaymentHold_checkout (checkoutId),
 FOREIGN KEY (checkoutId) REFERENCES RentalCheckout(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

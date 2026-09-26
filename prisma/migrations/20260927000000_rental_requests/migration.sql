CREATE TABLE `RentalRequest` (
 `id` VARCHAR(36) NOT NULL,
 `productSlug` VARCHAR(100) NOT NULL,
 `productCode` VARCHAR(40) NOT NULL,
 `productName` VARCHAR(191) NOT NULL,
 `name` VARCHAR(120) NOT NULL,
 `phone` VARCHAR(20) NOT NULL,
 `start` VARCHAR(10) NOT NULL,
 `end` VARCHAR(10) NOT NULL,
 `height` INTEGER NULL,
 `weight` INTEGER NULL,
 `note` TEXT NOT NULL,
 `readAt` DATETIME(3) NULL,
 `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX `RentalRequest_readAt_createdAt_idx` (`readAt`, `createdAt`),
 PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

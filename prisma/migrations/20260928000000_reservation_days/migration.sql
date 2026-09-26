ALTER TABLE `RentalRequest` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'pending', ADD COLUMN `depositConfirmedAt` DATETIME(3) NULL;
CREATE TABLE `RentalReservedDay` (
 `productSlug` VARCHAR(100) NOT NULL,
 `day` VARCHAR(10) NOT NULL,
 `requestId` VARCHAR(36) NOT NULL,
 PRIMARY KEY (`productSlug`, `day`),
 INDEX `RentalReservedDay_requestId_idx` (`requestId`),
 CONSTRAINT `RentalReservedDay_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `RentalRequest` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

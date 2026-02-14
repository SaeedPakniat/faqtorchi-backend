-- AlterTable
ALTER TABLE `SellerProfile` ADD COLUMN `baseCurrency` ENUM('IRR', 'IRT', 'USD', 'EUR') NOT NULL DEFAULT 'IRT',
    ADD COLUMN `lowStockThreshold` INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN `notifyInvoiceIssued` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyInvoiceStatusChange` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyLowStock` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyPaymentReminder` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `ProductDiscount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sellerId` INTEGER NOT NULL,
    `productId` INTEGER NULL,
    `variantId` INTEGER NULL,
    `type` ENUM('PERCENT', 'FIXED') NOT NULL,
    `value` BIGINT NOT NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProductDiscount_sellerId_idx`(`sellerId`),
    INDEX `ProductDiscount_productId_idx`(`productId`),
    INDEX `ProductDiscount_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductDiscount` ADD CONSTRAINT `ProductDiscount_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `SellerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductDiscount` ADD CONSTRAINT `ProductDiscount_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductDiscount` ADD CONSTRAINT `ProductDiscount_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

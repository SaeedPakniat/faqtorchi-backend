-- AlterTable
ALTER TABLE `Invoice` ADD COLUMN `discountCodeId` INTEGER NULL,
    ADD COLUMN `extra` JSON NULL;

-- CreateTable
CREATE TABLE `DiscountCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sellerId` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('PERCENT', 'FIXED') NOT NULL,
    `value` BIGINT NOT NULL,
    `variantId` INTEGER NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DiscountCode_sellerId_idx`(`sellerId`),
    INDEX `DiscountCode_variantId_idx`(`variantId`),
    UNIQUE INDEX `DiscountCode_sellerId_code_key`(`sellerId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomerAccessToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CustomerAccessToken_phone_idx`(`phone`),
    INDEX `CustomerAccessToken_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `CustomerAccessToken_tokenHash_key`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Invoice_discountCodeId_idx` ON `Invoice`(`discountCodeId`);

-- AddForeignKey
ALTER TABLE `DiscountCode` ADD CONSTRAINT `DiscountCode_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `SellerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscountCode` ADD CONSTRAINT `DiscountCode_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_discountCodeId_fkey` FOREIGN KEY (`discountCodeId`) REFERENCES `DiscountCode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

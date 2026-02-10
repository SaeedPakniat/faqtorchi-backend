-- DropForeignKey
ALTER TABLE `Invoice` DROP FOREIGN KEY `Invoice_customerId_fkey`;

-- CreateTable
CREATE TABLE `SellerCustomer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sellerId` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SellerCustomer_sellerId_idx`(`sellerId`),
    UNIQUE INDEX `SellerCustomer_sellerId_phone_key`(`sellerId`, `phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SellerCustomer` ADD CONSTRAINT `SellerCustomer_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `SellerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `SellerCustomer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

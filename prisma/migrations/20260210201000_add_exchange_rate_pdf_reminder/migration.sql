-- AlterTable
ALTER TABLE `Invoice`
    ADD COLUMN `exchangeRateBase` ENUM('IRR', 'IRT', 'USD', 'EUR') NULL,
    ADD COLUMN `exchangeRateQuote` ENUM('IRR', 'IRT', 'USD', 'EUR') NULL,
    ADD COLUMN `exchangeRateValue` BIGINT NULL,
    ADD COLUMN `exchangeRateFetchedAt` DATETIME(3) NULL,
    ADD COLUMN `pdfKey` VARCHAR(191) NULL,
    ADD COLUMN `pdfToken` VARCHAR(191) NULL,
    ADD COLUMN `pdfGeneratedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `ExchangeRate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `base` ENUM('IRR', 'IRT', 'USD', 'EUR') NOT NULL,
    `quote` ENUM('IRR', 'IRT', 'USD', 'EUR') NOT NULL,
    `rate` BIGINT NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExchangeRate_base_quote_fetchedAt_idx`(`base`, `quote`, `fetchedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reminder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoiceId` INTEGER NOT NULL,
    `sellerId` INTEGER NOT NULL,
    `dueAt` DATETIME(3) NOT NULL,
    `remindAt` DATETIME(3) NOT NULL,
    `channel` ENUM('SMS', 'NOTIF') NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `message` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Reminder_sellerId_idx`(`sellerId`),
    INDEX `Reminder_invoiceId_idx`(`invoiceId`),
    INDEX `Reminder_remindAt_idx`(`remindAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `SellerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX `Invoice_pdfToken_key` ON `Invoice`(`pdfToken`);

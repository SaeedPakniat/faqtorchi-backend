-- CreateTable
CREATE TABLE `SellerMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sellerId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `canInvoices` BOOLEAN NOT NULL DEFAULT true,
    `canCustomers` BOOLEAN NOT NULL DEFAULT true,
    `canProducts` BOOLEAN NOT NULL DEFAULT false,
    `canSettings` BOOLEAN NOT NULL DEFAULT false,
    `canWarehouse` BOOLEAN NOT NULL DEFAULT false,
    `canReports` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SellerMember_userId_key`(`userId`),
    INDEX `SellerMember_sellerId_idx`(`sellerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SellerMemberWarehouse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sellerMemberId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,

    INDEX `SellerMemberWarehouse_warehouseId_idx`(`warehouseId`),
    UNIQUE INDEX `SellerMemberWarehouse_sellerMemberId_warehouseId_key`(`sellerMemberId`, `warehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SellerMemberAuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sellerId` INTEGER NOT NULL,
    `memberId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SellerMemberAuditLog_sellerId_memberId_idx`(`sellerId`, `memberId`),
    INDEX `SellerMemberAuditLog_memberId_createdAt_idx`(`memberId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SellerMember` ADD CONSTRAINT `SellerMember_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `SellerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerMember` ADD CONSTRAINT `SellerMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerMemberWarehouse` ADD CONSTRAINT `SellerMemberWarehouse_sellerMemberId_fkey` FOREIGN KEY (`sellerMemberId`) REFERENCES `SellerMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerMemberWarehouse` ADD CONSTRAINT `SellerMemberWarehouse_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerMemberAuditLog` ADD CONSTRAINT `SellerMemberAuditLog_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `SellerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerMemberAuditLog` ADD CONSTRAINT `SellerMemberAuditLog_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `SellerMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerMemberAuditLog` ADD CONSTRAINT `SellerMemberAuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

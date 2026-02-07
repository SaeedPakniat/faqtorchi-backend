-- AlterTable
ALTER TABLE `Invoice` ADD COLUMN `warehouseId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Invoice_warehouseId_idx` ON `Invoice`(`warehouseId`);

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `createdByUserId` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Invoice` ADD COLUMN `createdByUserId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `Invoice_createdByUserId_idx` ON `Invoice`(`createdByUserId`);

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `phone` VARCHAR(191) NOT NULL;

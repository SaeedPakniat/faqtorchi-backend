/*
  Warnings:

  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `passwordHash` VARCHAR(191) NOT NULL;

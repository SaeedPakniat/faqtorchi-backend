-- AlterTable
ALTER TABLE `ShippingMethod` ADD COLUMN `currency` ENUM('IRR', 'IRT', 'USD', 'EUR') NOT NULL DEFAULT 'IRT';

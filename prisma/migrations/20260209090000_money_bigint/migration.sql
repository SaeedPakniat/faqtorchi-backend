-- AlterTable
ALTER TABLE `ProductVariant` MODIFY `price` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `Payment` MODIFY `amount` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `Invoice`
    MODIFY `subtotal` BIGINT NOT NULL,
    MODIFY `discount` BIGINT NOT NULL DEFAULT 0,
    MODIFY `tax` BIGINT NOT NULL DEFAULT 0,
    MODIFY `total` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `InvoiceItem`
    MODIFY `unitPrice` BIGINT NOT NULL,
    MODIFY `lineTotal` BIGINT NOT NULL;

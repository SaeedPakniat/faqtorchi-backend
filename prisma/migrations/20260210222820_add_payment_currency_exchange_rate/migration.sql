-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `amountInvoiceCurrency` BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN `currency` ENUM('IRR', 'IRT', 'USD', 'EUR') NOT NULL DEFAULT 'IRR',
    ADD COLUMN `exchangeRateBase` ENUM('IRR', 'IRT', 'USD', 'EUR') NULL,
    ADD COLUMN `exchangeRateFetchedAt` DATETIME(3) NULL,
    ADD COLUMN `exchangeRateQuote` ENUM('IRR', 'IRT', 'USD', 'EUR') NULL,
    ADD COLUMN `exchangeRateValue` BIGINT NULL;

-- Backfill existing rows: treat recorded amounts as invoice currency
UPDATE `Payment` p
JOIN `Invoice` i ON i.id = p.invoiceId
SET
  p.currency = i.currency,
  p.amountInvoiceCurrency = p.amount,
  p.exchangeRateBase = NULL,
  p.exchangeRateQuote = NULL,
  p.exchangeRateValue = NULL,
  p.exchangeRateFetchedAt = NULL;

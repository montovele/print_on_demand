ALTER TABLE `Shipment`
    MODIFY `trackingNumber` VARCHAR(191) NULL,
    ADD COLUMN `upsShipmentIdentificationNumber` VARCHAR(191) NULL,
    ADD COLUMN `upsServiceCode` VARCHAR(40) NULL,
    ADD COLUMN `upsServiceName` VARCHAR(120) NULL,
    ADD COLUMN `labelStorageKeys` JSON NULL,
    ADD COLUMN `packageTrackingNumbers` JSON NULL,
    ADD COLUMN `trackingStatus` VARCHAR(191) NULL,
    ADD COLUMN `trackingUpdatedAt` DATETIME(3) NULL;

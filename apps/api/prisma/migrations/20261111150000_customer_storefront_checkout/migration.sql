ALTER TABLE `Tenant`
    ADD COLUMN `shippingFlatRate` DECIMAL(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE `TenantMembership`
    MODIFY `role` ENUM('owner', 'admin', 'editor', 'viewer', 'customer') NOT NULL DEFAULT 'owner';

ALTER TABLE `SupportTicketComment`
    MODIFY `authorRole` ENUM('owner', 'admin', 'editor', 'viewer', 'customer') NULL;

ALTER TABLE `ProductArtworkAsset`
    ADD COLUMN `uploadedByUserId` VARCHAR(191) NULL,
    ADD INDEX `ProductArtworkAsset_uploadedByUserId_idx` (`uploadedByUserId`),
    ADD CONSTRAINT `ProductArtworkAsset_uploadedByUserId_fkey`
        FOREIGN KEY (`uploadedByUserId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Order`
    ADD COLUMN `customerUserId` VARCHAR(191) NULL,
    ADD COLUMN `customerEmail` VARCHAR(191) NULL,
    ADD COLUMN `shippingAddress` JSON NULL,
    ADD COLUMN `shippingTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `paymentStatus` ENUM('not_required', 'pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'not_required',
    ADD COLUMN `stripeCheckoutSessionId` VARCHAR(191) NULL,
    ADD COLUMN `stripePaymentIntentId` VARCHAR(191) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL,
    ADD UNIQUE INDEX `Order_stripeCheckoutSessionId_key` (`stripeCheckoutSessionId`),
    ADD INDEX `Order_tenantId_customerUserId_createdAt_idx` (`tenantId`, `customerUserId`, `createdAt`),
    ADD INDEX `Order_tenantId_paymentStatus_createdAt_idx` (`tenantId`, `paymentStatus`, `createdAt`),
    ADD CONSTRAINT `Order_customerUserId_fkey`
        FOREIGN KEY (`customerUserId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `OrderItem`
    ADD COLUMN `variantName` VARCHAR(191) NULL,
    ADD COLUMN `designConfig` JSON NULL,
    ADD COLUMN `printInstructions` TEXT NULL,
    ADD COLUMN `artworkAssetId` CHAR(36) NULL,
    ADD UNIQUE INDEX `OrderItem_artworkAssetId_key` (`artworkAssetId`),
    ADD CONSTRAINT `OrderItem_artworkAssetId_fkey`
        FOREIGN KEY (`artworkAssetId`) REFERENCES `ProductArtworkAsset` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

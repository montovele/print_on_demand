-- AlterTable
ALTER TABLE `product` ADD COLUMN `artworkAssetId` VARCHAR(191) NULL,
    ADD COLUMN `designConfig` JSON NULL,
    ADD COLUMN `productType` VARCHAR(50) NOT NULL DEFAULT 'custom';

-- CreateTable
CREATE TABLE `ProductArtworkAsset` (
    `id` CHAR(36) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(100) NOT NULL,
    `mimeType` VARCHAR(40) NOT NULL,
    `fileSize` INTEGER UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProductArtworkAsset_storageKey_key`(`storageKey`),
    INDEX `ProductArtworkAsset_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Product_artworkAssetId_key` ON `Product`(`artworkAssetId`);

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_artworkAssetId_fkey` FOREIGN KEY (`artworkAssetId`) REFERENCES `ProductArtworkAsset`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductArtworkAsset` ADD CONSTRAINT `ProductArtworkAsset_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

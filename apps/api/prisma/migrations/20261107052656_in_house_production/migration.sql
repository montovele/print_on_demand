-- AlterTable
ALTER TABLE `product` ADD COLUMN `fulfillmentMode` ENUM('in_house', 'printful') NOT NULL DEFAULT 'in_house',
    ADD COLUMN `manufacturingNotes` TEXT NULL,
    ADD COLUMN `productionMethod` VARCHAR(100) NULL,
    ADD COLUMN `productionMinutes` INTEGER UNSIGNED NULL;

-- CreateTable
CREATE TABLE `Machine` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `technology` VARCHAR(100) NOT NULL,
    `status` ENUM('active', 'maintenance', 'inactive') NOT NULL DEFAULT 'active',
    `location` VARCHAR(191) NULL,
    `hourlyRate` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `maintenanceDueAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Machine_tenantId_status_idx`(`tenantId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `unit` VARCHAR(40) NOT NULL,
    `onHand` DECIMAL(14, 3) NOT NULL DEFAULT 0,
    `reorderPoint` DECIMAL(14, 3) NOT NULL DEFAULT 0,
    `unitCost` DECIMAL(12, 4) NOT NULL DEFAULT 0,
    `currency` CHAR(3) NOT NULL DEFAULT 'MXN',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Material_tenantId_isActive_name_idx`(`tenantId`, `isActive`, `name`),
    UNIQUE INDEX `Material_tenantId_sku_key`(`tenantId`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductMaterialRequirement` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(14, 3) NOT NULL,

    INDEX `ProductMaterialRequirement_materialId_idx`(`materialId`),
    UNIQUE INDEX `ProductMaterialRequirement_productId_materialId_key`(`productId`, `materialId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductionJob` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `machineId` VARCHAR(191) NULL,
    `code` VARCHAR(100) NOT NULL,
    `status` ENUM('queued', 'prepress', 'ready', 'in_production', 'quality_check', 'packed', 'shipped', 'completed', 'blocked', 'cancelled') NOT NULL DEFAULT 'queued',
    `quantity` INTEGER NOT NULL,
    `priority` TINYINT UNSIGNED NOT NULL DEFAULT 3,
    `productionMethod` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `blockedReason` TEXT NULL,
    `estimatedMinutes` INTEGER UNSIGNED NULL,
    `scheduledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `materialsConsumedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductionJob_orderItemId_key`(`orderItemId`),
    INDEX `ProductionJob_tenantId_status_priority_createdAt_idx`(`tenantId`, `status`, `priority`, `createdAt`),
    INDEX `ProductionJob_machineId_status_idx`(`machineId`, `status`),
    INDEX `ProductionJob_orderId_idx`(`orderId`),
    UNIQUE INDEX `ProductionJob_tenantId_code_key`(`tenantId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductionJobHistory` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `fromStatus` ENUM('queued', 'prepress', 'ready', 'in_production', 'quality_check', 'packed', 'shipped', 'completed', 'blocked', 'cancelled') NULL,
    `toStatus` ENUM('queued', 'prepress', 'ready', 'in_production', 'quality_check', 'packed', 'shipped', 'completed', 'blocked', 'cancelled') NOT NULL,
    `note` TEXT NULL,
    `actorUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductionJobHistory_jobId_createdAt_idx`(`jobId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StockMovement` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `type` ENUM('receipt', 'adjustment', 'consumption', 'return') NOT NULL,
    `quantity` DECIMAL(14, 3) NOT NULL,
    `note` VARCHAR(255) NULL,
    `actorUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StockMovement_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    INDEX `StockMovement_materialId_createdAt_idx`(`materialId`, `createdAt`),
    INDEX `StockMovement_jobId_idx`(`jobId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shipment` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productionJobId` VARCHAR(191) NOT NULL,
    `carrier` VARCHAR(100) NOT NULL,
    `trackingNumber` VARCHAR(191) NOT NULL,
    `trackingUrl` VARCHAR(2048) NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'shipped',
    `shippedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deliveredAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Shipment_productionJobId_key`(`productionJobId`),
    INDEX `Shipment_tenantId_shippedAt_idx`(`tenantId`, `shippedAt`),
    UNIQUE INDEX `Shipment_tenantId_carrier_trackingNumber_key`(`tenantId`, `carrier`, `trackingNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Machine` ADD CONSTRAINT `Machine_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Material` ADD CONSTRAINT `Material_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMaterialRequirement` ADD CONSTRAINT `ProductMaterialRequirement_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductMaterialRequirement` ADD CONSTRAINT `ProductMaterialRequirement_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionJob` ADD CONSTRAINT `ProductionJob_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionJob` ADD CONSTRAINT `ProductionJob_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionJob` ADD CONSTRAINT `ProductionJob_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionJob` ADD CONSTRAINT `ProductionJob_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionJob` ADD CONSTRAINT `ProductionJob_machineId_fkey` FOREIGN KEY (`machineId`) REFERENCES `Machine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionJobHistory` ADD CONSTRAINT `ProductionJobHistory_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `ProductionJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockMovement` ADD CONSTRAINT `StockMovement_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `ProductionJob`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shipment` ADD CONSTRAINT `Shipment_productionJobId_fkey` FOREIGN KEY (`productionJobId`) REFERENCES `ProductionJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

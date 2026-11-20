CREATE TABLE IF NOT EXISTS `CustomerAccount` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CustomerAccount_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `CustomerAccount` (`id`, `userId`, `createdAt`)
SELECT CONCAT('customer_', SUBSTRING(REPLACE(UUID(), '-', ''), 1, 24)), `userId`, CURRENT_TIMESTAMP(3)
FROM `TenantMembership`
WHERE `role` = 'customer'
GROUP BY `userId`;

ALTER TABLE `AuthSession`
    DROP FOREIGN KEY `AuthSession_tenantId_fkey`;

ALTER TABLE `AuthSession`
    MODIFY `tenantId` VARCHAR(191) NULL;

ALTER TABLE `AuthSession`
    ADD CONSTRAINT `AuthSession_tenantId_fkey`
        FOREIGN KEY (`tenantId`) REFERENCES `Tenant` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CustomerAccount`
    ADD CONSTRAINT `CustomerAccount_userId_fkey`
        FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

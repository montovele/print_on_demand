ALTER TABLE `SupportTicket`
    ADD COLUMN `productionJobId` VARCHAR(191) NULL,
    ADD COLUMN `firstResponseAt` DATETIME(3) NULL,
    ADD COLUMN `resolvedAt` DATETIME(3) NULL,
    ADD INDEX `SupportTicket_productionJobId_idx`(`productionJobId`),
    ADD INDEX `SupportTicket_tenantId_firstResponseAt_resolvedAt_idx`(`tenantId`, `firstResponseAt`, `resolvedAt`),
    ADD CONSTRAINT `SupportTicket_productionJobId_fkey`
        FOREIGN KEY (`productionJobId`) REFERENCES `ProductionJob`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `SupportTicketComment`
    ADD COLUMN `authorUserId` VARCHAR(191) NULL,
    ADD COLUMN `authorRole` ENUM('owner', 'admin', 'editor', 'viewer') NULL,
    ADD COLUMN `activityType` ENUM('created', 'comment', 'status_changed', 'priority_changed') NOT NULL DEFAULT 'comment',
    ADD COLUMN `previousStatus` ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') NULL,
    ADD COLUMN `newStatus` ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') NULL,
    ADD COLUMN `previousPriority` ENUM('low', 'normal', 'high', 'urgent') NULL,
    ADD COLUMN `newPriority` ENUM('low', 'normal', 'high', 'urgent') NULL,
    ADD INDEX `SupportTicketComment_authorUserId_createdAt_idx`(`authorUserId`, `createdAt`),
    ADD CONSTRAINT `SupportTicketComment_authorUserId_fkey`
        FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`)
        ON DELETE SET NULL ON UPDATE CASCADE;

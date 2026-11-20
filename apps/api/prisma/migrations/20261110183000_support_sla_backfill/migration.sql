UPDATE `SupportTicket` AS ticket
LEFT JOIN (
    SELECT `ticketId`, MIN(`createdAt`) AS `firstResponseAt`
    FROM `SupportTicketComment`
    GROUP BY `ticketId`
) AS first_comment ON first_comment.`ticketId` = ticket.`id`
SET ticket.`firstResponseAt` = first_comment.`firstResponseAt`
WHERE first_comment.`firstResponseAt` IS NOT NULL;

UPDATE `SupportTicket`
SET `resolvedAt` = `updatedAt`
WHERE `status` IN ('resolved', 'closed') AND `resolvedAt` IS NULL;

-- Etapa 8 — conflitos de sync offline (geometria, operações aprovadas, permissões)
CREATE TABLE IF NOT EXISTS `sync_conflicts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `actorUserId` int,
  `deviceId` varchar(80),
  `clientMutationId` varchar(64),
  `entity` varchar(60) NOT NULL,
  `action` varchar(40) NOT NULL,
  `resourceType` varchar(60),
  `resourceId` varchar(64),
  `reason` varchar(80) NOT NULL,
  `message` text,
  `payload` text,
  `syncConflictStatus` enum('aberto','resolvido','descartado') NOT NULL DEFAULT 'aberto',
  `resolvedByUserId` int,
  `resolvedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `sync_conflicts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sync_conflicts_organization_idx` ON `sync_conflicts` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `sync_conflicts_status_idx` ON `sync_conflicts` (`organizationId`, `syncConflictStatus`);
--> statement-breakpoint
CREATE INDEX `sync_conflicts_client_mutation_idx` ON `sync_conflicts` (`clientMutationId`);
--> statement-breakpoint
-- Versão de geometria também nos talhões (conflito offline)
ALTER TABLE `terrenos` ADD COLUMN `geometriaVersao` int DEFAULT 1;

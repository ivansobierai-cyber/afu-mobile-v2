CREATE TABLE IF NOT EXISTS `private_files` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `storageKey` varchar(512) NOT NULL,
  `fileCategory` enum('relatorio','diagnostico','laudo','documento','foto','outro') NOT NULL DEFAULT 'outro',
  `contentType` varchar(120),
  `originalName` varchar(255),
  `sizeBytes` int,
  `relatorioId` int,
  `diagnosticoId` int,
  `propriedadeId` int,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `private_files_id` PRIMARY KEY(`id`),
  UNIQUE KEY `private_files_storage_key_uidx` (`storageKey`),
  KEY `private_files_organization_idx` (`organizationId`),
  KEY `private_files_relatorio_idx` (`relatorioId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int,
  `actorUserId` int,
  `action` varchar(80) NOT NULL,
  `resourceType` varchar(60),
  `resourceId` varchar(64),
  `storageKey` varchar(512),
  `ip` varchar(64),
  `userAgent` varchar(255),
  `meta` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`),
  KEY `audit_logs_organization_idx` (`organizationId`),
  KEY `audit_logs_actor_idx` (`actorUserId`),
  KEY `audit_logs_action_idx` (`action`),
  KEY `audit_logs_created_idx` (`createdAt`)
);

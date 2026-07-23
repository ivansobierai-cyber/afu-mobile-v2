-- Cultivos V2 Etapa 1 — histórico fenológico + índices auxiliares em culturas
CREATE TABLE IF NOT EXISTS `cultivo_fase_eventos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `culturaId` int NOT NULL,
  `faseAnterior` varchar(100),
  `faseNova` varchar(100) NOT NULL,
  `dataEvento` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `origemFaseCultivo` enum('manual','api','backfill','sistema') NOT NULL DEFAULT 'manual',
  `userId` int,
  `observacao` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `cultivo_fase_eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cultivo_fase_org_idx` ON `cultivo_fase_eventos` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `cultivo_fase_cultura_idx` ON `cultivo_fase_eventos` (`culturaId`);
--> statement-breakpoint
CREATE INDEX `cultivo_fase_org_prop_idx` ON `cultivo_fase_eventos` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
CREATE INDEX `cultivo_fase_cultura_data_idx` ON `cultivo_fase_eventos` (`culturaId`,`dataEvento`);

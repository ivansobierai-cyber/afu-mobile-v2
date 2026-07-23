-- Etapa 7 Passo 1 — estoque agrícola inteligente (depósitos, lotes, reservas, colunas tenant)
CREATE TABLE IF NOT EXISTS `estoque_depositos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `nome` varchar(120) NOT NULL,
  `descricao` text,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `estoque_depositos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `estoque_depositos_org_idx` ON `estoque_depositos` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `estoque_depositos_org_prop_idx` ON `estoque_depositos` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `estoque_lotes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `itemId` int NOT NULL,
  `depositoId` int,
  `codigo` varchar(80) NOT NULL,
  `validade` timestamp NULL,
  `quantidadeInicial` decimal(14,3) NOT NULL DEFAULT '0',
  `bloqueado` tinyint(1) NOT NULL DEFAULT 0,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `estoque_lotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `estoque_lotes_org_idx` ON `estoque_lotes` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `estoque_lotes_org_prop_idx` ON `estoque_lotes` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
CREATE INDEX `estoque_lotes_item_idx` ON `estoque_lotes` (`itemId`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `estoque_reservas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `itemId` int NOT NULL,
  `loteId` int,
  `tarefaId` int,
  `quantidade` decimal(14,3) NOT NULL,
  `statusReservaEstoque` enum('ativa','consumida','liberada','cancelada') NOT NULL DEFAULT 'ativa',
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `estoque_reservas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `estoque_reservas_org_idx` ON `estoque_reservas` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `estoque_reservas_org_prop_idx` ON `estoque_reservas` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
CREATE INDEX `estoque_reservas_tarefa_idx` ON `estoque_reservas` (`tarefaId`);
--> statement-breakpoint
CREATE INDEX `estoque_reservas_item_idx` ON `estoque_reservas` (`itemId`);

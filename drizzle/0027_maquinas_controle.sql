-- Etapa 8 Passo 3 — controle operacional de máquinas
ALTER TABLE `maquinas_operacionais`
  MODIFY COLUMN `tipoMaquinaOperacional` enum('trator','pulverizador','colheitadeira','caminhao','implemento','irrigacao','outro') NOT NULL DEFAULT 'outro';
--> statement-breakpoint
ALTER TABLE `maquinas_operacionais` ADD COLUMN `combustivelLitros` decimal(12,2);
--> statement-breakpoint
ALTER TABLE `maquinas_operacionais` ADD COLUMN `ultimaManutencaoAt` timestamp NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `maquina_eventos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `maquinaId` int NOT NULL,
  `tipoEventoMaquina` enum('horimetro','combustivel','manutencao','disponibilidade') NOT NULL,
  `valor` decimal(14,3),
  `sentido` varchar(20),
  `descricao` varchar(255),
  `tarefaId` int,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `maquina_eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `maquina_eventos_org_idx` ON `maquina_eventos` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `maquina_eventos_maquina_idx` ON `maquina_eventos` (`maquinaId`);
--> statement-breakpoint
CREATE INDEX `maquina_eventos_org_prop_idx` ON `maquina_eventos` (`organizationId`,`propriedadeId`);

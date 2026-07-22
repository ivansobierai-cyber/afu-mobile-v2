CREATE TABLE IF NOT EXISTS `maquinas_operacionais` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int,
  `propriedadeId` int NOT NULL,
  `nome` varchar(120) NOT NULL,
  `tipoMaquinaOperacional` enum('trator','pulverizador','colheitadeira','implemento','irrigacao','outro') NOT NULL DEFAULT 'outro',
  `identificador` varchar(80),
  `statusMaquinaOperacional` enum('disponivel','em_uso','manutencao','inativa') NOT NULL DEFAULT 'disponivel',
  `horasUso` decimal(12,1),
  `notas` text,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `maquinas_operacionais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `maquinas_operacionais_org_idx` ON `maquinas_operacionais` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `maquinas_operacionais_org_prop_idx` ON `maquinas_operacionais` (`organizationId`,`propriedadeId`);

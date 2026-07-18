-- Etapa 2 correção — entidade persistente de safra (aditiva / nullable)
-- Aplicar após 0019. Backfill: npm run seed:safras (ou scripts/backfill-safras.ts)

CREATE TABLE IF NOT EXISTS `safras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `nome` varchar(80) NOT NULL,
  `anoInicio` int,
  `anoFim` int,
  `dataInicio` date,
  `dataFim` date,
  `status` enum('planejada','ativa','encerrada','arquivada') NOT NULL DEFAULT 'ativa',
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `createdByUserId` int,
  `closedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `safras_organization_idx` (`organizationId`),
  KEY `safras_org_prop_idx` (`organizationId`, `propriedadeId`),
  KEY `safras_org_prop_status_idx` (`organizationId`, `propriedadeId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- safraId nullable nas entidades de ciclo (não falha se coluna já existir em re-run parcial)
ALTER TABLE `culturas` ADD COLUMN `safraId` int NULL;
ALTER TABLE `tarefas_operacionais` ADD COLUMN `safraId` int NULL;
ALTER TABLE `ocorrencias_campo` ADD COLUMN `safraId` int NULL;
ALTER TABLE `orcamentos_safra` ADD COLUMN `safraId` int NULL;
ALTER TABLE `custos_operacao` ADD COLUMN `safraId` int NULL;
ALTER TABLE `atividade_propriedade` ADD COLUMN `safraId` int NULL;

CREATE INDEX `culturas_org_prop_safra_idx` ON `culturas` (`organizationId`, `propriedadeId`, `safraId`);
CREATE INDEX `tarefas_org_prop_safra_idx` ON `tarefas_operacionais` (`organizationId`, `propriedadeId`, `safraId`);
CREATE INDEX `ocorrencias_org_prop_safra_idx` ON `ocorrencias_campo` (`organizationId`, `propriedadeId`, `safraId`);
CREATE INDEX `orcamentos_org_prop_safra_idx` ON `orcamentos_safra` (`organizationId`, `propriedadeId`, `safraId`);

-- FASE 2E — operações agrícolas persistentes (sem backfill de calendário)
CREATE TABLE IF NOT EXISTS `operacoes_agricolas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `safraId` int NULL,
  `terrenoId` int NULL,
  `culturaId` int NULL,
  `tarefaId` int NULL,
  `eventoOrigemId` int NULL,
  `tipoOperacao` enum(
    'plantio','adubacao','irrigacao','pulverizacao','vistoria','analise','laboratorio',
    'amostragem','monitoramento','colheita','manutencao','outro'
  ) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descricao` text NULL,
  `status` enum('planejada','em_execucao','concluida','cancelada') NOT NULL DEFAULT 'planejada',
  `dataPrevista` timestamp NOT NULL,
  `createdByUserId` int NULL,
  `origem` enum('manual','evento_calendario','tarefa') NOT NULL DEFAULT 'manual',
  `tipoAtividadeLegado` varchar(40) NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `operacoes_evento_origem_unique` (`eventoOrigemId`),
  KEY `operacoes_org_idx` (`organizationId`),
  KEY `operacoes_org_prop_idx` (`organizationId`,`propriedadeId`),
  KEY `operacoes_org_prop_safra_idx` (`organizationId`,`propriedadeId`,`safraId`),
  KEY `operacoes_tarefa_idx` (`tarefaId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

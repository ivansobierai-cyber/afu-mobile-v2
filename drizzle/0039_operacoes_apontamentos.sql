-- FASE 2H — apontamento real de execução das operações agrícolas
-- Sem backfill. Sem movimento de estoque/custo.

CREATE TABLE IF NOT EXISTS `operacoes_agricolas_apontamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `safraId` int NULL,
  `operacaoAgricolaId` int NOT NULL,
  `talhaoId` int NULL,
  `inicioReal` timestamp NOT NULL,
  `fimReal` timestamp NULL,
  `areaExecutada` decimal(12,2) NULL,
  `areaUnidade` varchar(16) NULL DEFAULT 'ha',
  `operadorUserId` int NULL,
  `equipeTexto` varchar(200) NULL,
  `maquinaOperacionalId` int NULL,
  `implementoTexto` varchar(200) NULL,
  `condicoesObservadas` text NULL,
  `problemasPausas` text NULL,
  `resultadoImediato` enum('ok','parcial','problema') NULL DEFAULT 'ok',
  `observacoes` text NULL,
  `revision` int NOT NULL DEFAULT 0,
  `clientMutationId` varchar(64) NULL,
  `createdByUserId` int NULL,
  `updatedByUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `op_apont_client_mutation_unique` (`operacaoAgricolaId`, `clientMutationId`),
  KEY `op_apont_org_idx` (`organizationId`),
  KEY `op_apont_operacao_idx` (`operacaoAgricolaId`, `createdAt`),
  KEY `op_apont_org_prop_idx` (`organizationId`, `propriedadeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `operacoes_agricolas_apontamento_insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `apontamentoId` int NOT NULL,
  `estoqueItemId` int NULL,
  `descricao` varchar(200) NULL,
  `quantidade` decimal(14,3) NOT NULL,
  `unidade` varchar(30) NOT NULL,
  `createdByUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `op_apont_insumo_org_idx` (`organizationId`),
  KEY `op_apont_insumo_apont_idx` (`apontamentoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `operacoes_agricolas_apontamento_evidencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `apontamentoId` int NOT NULL,
  `nome` varchar(200) NOT NULL,
  `contentType` varchar(120) NULL,
  `url` text NULL,
  `privateFileId` int NULL,
  `createdByUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `op_apont_evid_org_idx` (`organizationId`),
  KEY `op_apont_evid_apont_idx` (`apontamentoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

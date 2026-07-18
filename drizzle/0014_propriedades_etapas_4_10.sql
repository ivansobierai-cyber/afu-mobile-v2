ALTER TABLE `propriedades` ADD `geometriaGeoJson` text;
--> statement-breakpoint
ALTER TABLE `propriedades` ADD `areaGeometricaHa` decimal(12,4);
--> statement-breakpoint
ALTER TABLE `propriedades` ADD `geometriaOrigem` enum('desenhada','gps','importada','integracao') DEFAULT 'desenhada';
--> statement-breakpoint
ALTER TABLE `propriedades` ADD `geometriaVersao` int DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `terrenos` ADD `geometriaGeoJson` text;
--> statement-breakpoint
ALTER TABLE `terrenos` ADD `areaGeometricaHa` decimal(12,4);
--> statement-breakpoint
ALTER TABLE `terrenos` ADD `geometriaOrigemTalhao` enum('desenhada','gps','importada','integracao') DEFAULT 'desenhada';
--> statement-breakpoint
ALTER TABLE `tarefas_operacionais` ADD `clientMutationId` varchar(64);
--> statement-breakpoint
CREATE UNIQUE INDEX `tarefas_client_mutation_uidx` ON `tarefas_operacionais` (`clientMutationId`);
--> statement-breakpoint
CREATE TABLE `ocorrencias_campo` (
  `id` int AUTO_INCREMENT NOT NULL,
  `propriedadeId` int NOT NULL,
  `terrenoId` int,
  `culturaId` int,
  `usuarioId` int NOT NULL,
  `diagnosticoId` int,
  `tarefaId` int,
  `categoriaOcorrencia` enum('praga','doenca','nutricao','clima','solo','outro') NOT NULL DEFAULT 'outro',
  `titulo` varchar(200) NOT NULL,
  `descricao` text,
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `severidadeOcorrencia` enum('baixa','media','alta','critica') DEFAULT 'media',
  `statusOcorrencia` enum('aberta','em_acompanhamento','resolvida','descartada') NOT NULL DEFAULT 'aberta',
  `resultadoAcompanhamento` enum('melhorou','estavel','piorou','resolvido'),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ocorrencias_campo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estoque_itens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `propriedadeId` int NOT NULL,
  `nome` varchar(150) NOT NULL,
  `categoriaEstoque` enum('fertilizante','defensivo','semente','combustivel','peca','outro') NOT NULL DEFAULT 'outro',
  `unidadeBase` varchar(30) NOT NULL DEFAULT 'kg',
  `saldo` decimal(14,3) NOT NULL DEFAULT '0',
  `estoqueMinimo` decimal(14,3) DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `estoque_itens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estoque_movimentos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `itemId` int NOT NULL,
  `usuarioId` int NOT NULL,
  `tipoMovimentoEstoque` enum('entrada','saida','reserva','consumo','ajuste','perda') NOT NULL,
  `quantidade` decimal(14,3) NOT NULL,
  `motivo` varchar(255),
  `tarefaId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `estoque_movimentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orcamentos_safra` (
  `id` int AUTO_INCREMENT NOT NULL,
  `propriedadeId` int NOT NULL,
  `nomeSafra` varchar(80) NOT NULL,
  `orcamentoPrevisto` decimal(14,2) NOT NULL DEFAULT '0',
  `custoRealizado` decimal(14,2) NOT NULL DEFAULT '0',
  `moeda` varchar(8) NOT NULL DEFAULT 'BRL',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `orcamentos_safra_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custos_operacao` (
  `id` int AUTO_INCREMENT NOT NULL,
  `propriedadeId` int NOT NULL,
  `orcamentoId` int,
  `tarefaId` int,
  `categoriaCusto` enum('insumo','mao_obra','maquina','combustivel','servico','outro') NOT NULL DEFAULT 'outro',
  `descricao` varchar(200) NOT NULL,
  `valor` decimal(14,2) NOT NULL,
  `dataCusto` timestamp NOT NULL DEFAULT (now()),
  `usuarioId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `custos_operacao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atividade_propriedade` (
  `id` int AUTO_INCREMENT NOT NULL,
  `propriedadeId` int NOT NULL,
  `usuarioId` int,
  `tipo` varchar(60) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `detalhe` text,
  `gravidadeAtividade` enum('info','atencao','alto','critico') DEFAULT 'info',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `atividade_propriedade_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ocorrencias_prop_idx` ON `ocorrencias_campo` (`propriedadeId`);
--> statement-breakpoint
CREATE INDEX `estoque_prop_idx` ON `estoque_itens` (`propriedadeId`);
--> statement-breakpoint
CREATE INDEX `custos_prop_idx` ON `custos_operacao` (`propriedadeId`);
--> statement-breakpoint
CREATE INDEX `atividade_prop_idx` ON `atividade_propriedade` (`propriedadeId`);

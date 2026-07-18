CREATE TABLE `tarefas_operacionais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`propriedadeId` int NOT NULL,
	`terrenoId` int,
	`culturaId` int,
	`tipoOperacao` enum('plantio','irrigacao','adubacao','pulverizacao','monitoramento','colheita','analise','manutencao','vistoria','outro') NOT NULL,
	`titulo` varchar(200) NOT NULL,
	`instrucoes` text,
	`prioridade` enum('baixa','normal','alta','critica') NOT NULL DEFAULT 'normal',
	`status` enum('planejada','liberada','em_execucao','pausada','concluida','aprovada','cancelada','bloqueada') NOT NULL DEFAULT 'planejada',
	`dataPrevista` timestamp NOT NULL,
	`areaPlanejada` decimal(12,2),
	`origem` enum('manual','calendario_legado','template') NOT NULL DEFAULT 'manual',
	`legadoEventoId` int,
	`motivoCancelamento` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tarefas_operacionais_id` PRIMARY KEY(`id`),
	CONSTRAINT `tarefas_operacionais_legadoEventoId_unique` UNIQUE(`legadoEventoId`)
);
--> statement-breakpoint
CREATE TABLE `apontamentos_operacao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tarefaId` int NOT NULL,
	`usuarioId` int NOT NULL,
	`inicioReal` timestamp NOT NULL,
	`fimReal` timestamp,
	`areaExecutada` decimal(12,2),
	`notas` text,
	`resultado` enum('ok','parcial','problema') DEFAULT 'ok',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apontamentos_operacao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tarefas_prop_idx` ON `tarefas_operacionais` (`propriedadeId`);
--> statement-breakpoint
CREATE INDEX `tarefas_status_idx` ON `tarefas_operacionais` (`status`);
--> statement-breakpoint
CREATE INDEX `apontamentos_tarefa_idx` ON `apontamentos_operacao` (`tarefaId`);
--> statement-breakpoint
-- Migração legado: eventos com propriedade viram tarefas (não marca como aprovada)
INSERT INTO `tarefas_operacionais` (
  `usuarioId`, `propriedadeId`, `culturaId`, `tipoOperacao`, `titulo`, `instrucoes`,
  `prioridade`, `status`, `dataPrevista`, `origem`, `legadoEventoId`, `createdAt`, `updatedAt`
)
SELECT
  `usuarioId`,
  `propriedadeId`,
  `culturaId`,
  `tipoAtividade`,
  `titulo`,
  `descricao`,
  COALESCE(`prioridade`, 'normal'),
  CASE `status`
    WHEN 'em_andamento' THEN 'em_execucao'
    WHEN 'concluido' THEN 'concluida'
    WHEN 'cancelado' THEN 'cancelada'
    ELSE 'planejada'
  END,
  `dataProgramada`,
  'calendario_legado',
  `id`,
  `createdAt`,
  `updatedAt`
FROM `calendario_cuidados`
WHERE `propriedadeId` IS NOT NULL
  AND `usuarioId` IS NOT NULL;

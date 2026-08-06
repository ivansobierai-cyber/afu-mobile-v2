-- FASE 2G — ciclo de estados das operações agrícolas + histórico append-only
ALTER TABLE `operacoes_agricolas`
  MODIFY COLUMN `status` enum(
    'planejada',
    'liberada',
    'em_execucao',
    'pausada',
    'concluida',
    'aprovada',
    'cancelada',
    'bloqueada',
    'reaberta'
  ) NOT NULL DEFAULT 'planejada';

ALTER TABLE `operacoes_agricolas`
  ADD COLUMN `statusRevision` int NOT NULL DEFAULT 0 AFTER `status`,
  ADD COLUMN `statusBeforeBlocked` enum(
    'planejada',
    'liberada',
    'em_execucao',
    'pausada',
    'concluida',
    'aprovada',
    'cancelada',
    'bloqueada',
    'reaberta'
  ) NULL AFTER `statusRevision`;

CREATE TABLE IF NOT EXISTS `operacoes_agricolas_status_historico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `operacaoId` int NOT NULL,
  `fromStatus` enum(
    'planejada',
    'liberada',
    'em_execucao',
    'pausada',
    'concluida',
    'aprovada',
    'cancelada',
    'bloqueada',
    'reaberta'
  ) NOT NULL,
  `toStatus` enum(
    'planejada',
    'liberada',
    'em_execucao',
    'pausada',
    'concluida',
    'aprovada',
    'cancelada',
    'bloqueada',
    'reaberta'
  ) NOT NULL,
  `actorUserId` int NULL,
  `motivo` text NULL,
  `origem` varchar(32) NOT NULL DEFAULT 'transition',
  `clientMutationId` varchar(64) NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `operacoes_hist_client_mutation_unique` (`operacaoId`, `clientMutationId`),
  KEY `operacoes_hist_org_idx` (`organizationId`),
  KEY `operacoes_hist_operacao_idx` (`operacaoId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

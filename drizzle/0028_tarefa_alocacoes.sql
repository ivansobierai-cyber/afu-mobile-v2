-- Etapa 8 Passo 4 — alocações de equipe em tarefas
CREATE TABLE IF NOT EXISTS `tarefa_alocacoes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `tarefaId` int NOT NULL,
  `userId` int NOT NULL,
  `papelEquipe` enum('funcionario','operador','tecnico','agronomo') NOT NULL DEFAULT 'operador',
  `horasPlanejadas` decimal(10,2),
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `tarefa_alocacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tarefa_aloc_org_idx` ON `tarefa_alocacoes` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `tarefa_aloc_tarefa_idx` ON `tarefa_alocacoes` (`tarefaId`);
--> statement-breakpoint
CREATE INDEX `tarefa_aloc_user_idx` ON `tarefa_alocacoes` (`userId`);
--> statement-breakpoint
CREATE INDEX `tarefa_aloc_org_prop_idx` ON `tarefa_alocacoes` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `tarefa_aloc_tarefa_user_uidx` ON `tarefa_alocacoes` (`tarefaId`,`userId`);

-- Etapa 8 Passo 2 — lançamentos financeiros
CREATE TABLE IF NOT EXISTS `financeiro_lancamentos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `propriedadeId` int NOT NULL,
  `safraId` int,
  `terrenoId` int,
  `culturaId` int,
  `tarefaId` int,
  `tipoLancamentoFinanceiro` enum('despesa','receita','custo','investimento') NOT NULL,
  `categoriaAuto` varchar(60) NOT NULL,
  `descricao` varchar(200) NOT NULL,
  `valor` decimal(14,2) NOT NULL,
  `dataLancamento` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdByUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `financeiro_lancamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `fin_lanc_org_idx` ON `financeiro_lancamentos` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `fin_lanc_org_prop_idx` ON `financeiro_lancamentos` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
CREATE INDEX `fin_lanc_tipo_idx` ON `financeiro_lancamentos` (`tipoLancamentoFinanceiro`);
--> statement-breakpoint
CREATE INDEX `fin_lanc_safra_idx` ON `financeiro_lancamentos` (`safraId`);

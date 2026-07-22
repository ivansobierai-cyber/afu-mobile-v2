-- Etapa 3 — organizationId nas tabelas privadas (nullable; NOT NULL em release futuro)
-- Rollback: DROP COLUMN organizationId + índices em cada tabela.

ALTER TABLE `propriedades` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `propriedades_organization_idx` ON `propriedades` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `propriedades_org_id_idx` ON `propriedades` (`organizationId`,`id`);
--> statement-breakpoint
ALTER TABLE `terrenos` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `terrenos_organization_idx` ON `terrenos` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `terrenos_org_prop_idx` ON `terrenos` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
ALTER TABLE `culturas` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `culturas_organization_idx` ON `culturas` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `culturas_org_prop_idx` ON `culturas` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
ALTER TABLE `diagnosticos_ia` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `diagnosticos_organization_idx` ON `diagnosticos_ia` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `diagnosticos_org_created_idx` ON `diagnosticos_ia` (`organizationId`,`dataDiagnostico`);
--> statement-breakpoint
ALTER TABLE `analises_fitotecnicas` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `analises_organization_idx` ON `analises_fitotecnicas` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `relatorios` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `relatorios_organization_idx` ON `relatorios` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `calendario_cuidados` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `calendario_organization_idx` ON `calendario_cuidados` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `tarefas_operacionais` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `tarefas_organization_idx` ON `tarefas_operacionais` (`organizationId`);
--> statement-breakpoint
CREATE INDEX `tarefas_org_prop_idx` ON `tarefas_operacionais` (`organizationId`,`propriedadeId`);
--> statement-breakpoint
ALTER TABLE `sensores` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `sensores_organization_idx` ON `sensores` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `ocorrencias_campo` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `ocorrencias_organization_idx` ON `ocorrencias_campo` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `estoque_itens` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `estoque_itens_organization_idx` ON `estoque_itens` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `orcamentos_safra` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `orcamentos_organization_idx` ON `orcamentos_safra` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `custos_operacao` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `custos_organization_idx` ON `custos_operacao` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `atividade_propriedade` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `atividade_organization_idx` ON `atividade_propriedade` (`organizationId`);

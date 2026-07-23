-- Etapa 8 Passo 1 — centros de custo em custos_operacao (talhão, cultura + auditoria)
ALTER TABLE `custos_operacao` ADD COLUMN `terrenoId` int;
--> statement-breakpoint
ALTER TABLE `custos_operacao` ADD COLUMN `culturaId` int;
--> statement-breakpoint
ALTER TABLE `custos_operacao` ADD COLUMN `createdByUserId` int;
--> statement-breakpoint
ALTER TABLE `custos_operacao` ADD COLUMN `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- WP-04 — revisão técnica de diagnóstico IA
-- Aditivo: não remove colunas nem apaga dados.
-- Aplicação idempotente: scripts/apply-0042-diagnostico-revisao-tecnica.ts

ALTER TABLE `diagnosticos_ia`
  ADD COLUMN `revisadoPorUserId` int NULL AFTER `statusRevisao`;

ALTER TABLE `diagnosticos_ia`
  ADD COLUMN `revisadoPorPerfilId` int NULL AFTER `revisadoPorUserId`;

ALTER TABLE `diagnosticos_ia`
  ADD COLUMN `revisadoEm` timestamp NULL AFTER `revisadoPorPerfilId`;

ALTER TABLE `diagnosticos_ia`
  ADD COLUMN `parecerTecnico` text NULL AFTER `revisadoEm`;

ALTER TABLE `diagnosticos_ia`
  ADD COLUMN `recomendacaoCorrigida` text NULL AFTER `parecerTecnico`;

CREATE INDEX `diagnosticos_org_status_revisao_idx`
  ON `diagnosticos_ia` (`organizationId`, `statusRevisao`);

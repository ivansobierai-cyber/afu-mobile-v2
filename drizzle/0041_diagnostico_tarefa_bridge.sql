-- WP-03 / FASE 4 P1 — elo diagnóstico → recomendação → tarefa
-- Aditivo: não remove colunas nem apaga dados.
-- Aplicação idempotente: scripts/apply-0041-diagnostico-tarefa-bridge.ts

-- safraId opcional em diagnosticos_ia (mesmo ciclo propriedade/safra da tarefa)
ALTER TABLE `diagnosticos_ia`
  ADD COLUMN `safraId` int NULL AFTER `culturaId`;

CREATE INDEX `diagnosticos_org_prop_safra_idx`
  ON `diagnosticos_ia` (`organizationId`, `propriedadeId`, `safraId`);

-- Origem + vínculo canônico na tarefa
ALTER TABLE `tarefas_operacionais`
  MODIFY COLUMN `origem` enum(
    'manual',
    'calendario_legado',
    'template',
    'diagnostico'
  ) NOT NULL DEFAULT 'manual';

ALTER TABLE `tarefas_operacionais`
  ADD COLUMN `legadoDiagnosticoId` int NULL AFTER `legadoEventoId`;

CREATE UNIQUE INDEX `tarefas_operacionais_legadoDiagnosticoId_unique`
  ON `tarefas_operacionais` (`legadoDiagnosticoId`);

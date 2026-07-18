-- Etapa 9 — política de IA por organização (default: sem treinamento)
ALTER TABLE `organizations`
  ADD COLUMN `aiAllowModelImprovement` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN `aiShareAggregatedInsights` tinyint(1) NOT NULL DEFAULT 0;

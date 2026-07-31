-- Etapa 4 Eventos — dependências e série de recorrência
ALTER TABLE `calendario_cuidados`
  ADD COLUMN `dependsOnEventoId` int NULL,
  ADD COLUMN `recurrenceParentId` int NULL;

CREATE INDEX `calendario_depends_idx` ON `calendario_cuidados` (`dependsOnEventoId`);
CREATE INDEX `calendario_recurrence_idx` ON `calendario_cuidados` (`recurrenceParentId`);

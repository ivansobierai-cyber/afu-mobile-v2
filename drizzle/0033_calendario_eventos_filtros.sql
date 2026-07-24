-- Etapa 2 Eventos — filtros por talhão, safra e responsável
ALTER TABLE `calendario_cuidados`
  ADD COLUMN `terrenoId` int NULL,
  ADD COLUMN `safraId` int NULL,
  ADD COLUMN `responsavelUserId` int NULL;

CREATE INDEX `calendario_org_prop_idx` ON `calendario_cuidados` (`organizationId`, `propriedadeId`);
CREATE INDEX `calendario_org_safra_idx` ON `calendario_cuidados` (`organizationId`, `safraId`);
CREATE INDEX `calendario_org_terreno_idx` ON `calendario_cuidados` (`organizationId`, `terrenoId`);
CREATE INDEX `calendario_org_resp_idx` ON `calendario_cuidados` (`organizationId`, `responsavelUserId`);

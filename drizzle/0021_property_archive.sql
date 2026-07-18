-- Soft-archive de propriedades (correção Etapa 7)
ALTER TABLE propriedades
  ADD COLUMN archivedAt timestamp NULL DEFAULT NULL,
  ADD COLUMN archivedByUserId int NULL DEFAULT NULL,
  ADD COLUMN archiveMotivo varchar(255) NULL DEFAULT NULL;

CREATE INDEX propriedades_org_archived_idx
  ON propriedades (organizationId, archivedAt);

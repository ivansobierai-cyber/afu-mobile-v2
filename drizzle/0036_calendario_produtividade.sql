-- Etapa 8 Eventos — etiquetas, checklist, comentários e anexos
ALTER TABLE `calendario_cuidados`
  ADD COLUMN `etiquetas` text NULL,
  ADD COLUMN `checklistJson` text NULL;

CREATE TABLE IF NOT EXISTS `evento_comentarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `eventoId` int NOT NULL,
  `autorUserId` int NOT NULL,
  `autorNome` varchar(120) NULL,
  `texto` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `evento_comentarios_org_idx` (`organizationId`),
  KEY `evento_comentarios_evento_idx` (`eventoId`)
);

CREATE TABLE IF NOT EXISTS `evento_anexos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `eventoId` int NOT NULL,
  `nome` varchar(200) NOT NULL,
  `contentType` varchar(120) NULL,
  `url` text NULL,
  `storageKey` varchar(512) NULL,
  `privateFileId` int NULL,
  `sizeBytes` int NULL,
  `createdByUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `evento_anexos_org_idx` (`organizationId`),
  KEY `evento_anexos_evento_idx` (`eventoId`)
);

ALTER TABLE `private_files`
  ADD COLUMN `calendarioCuidadoId` int NULL;

CREATE INDEX `private_files_evento_idx` ON `private_files` (`calendarioCuidadoId`);

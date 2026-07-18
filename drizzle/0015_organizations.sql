CREATE TABLE `organizations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `nome` varchar(150) NOT NULL,
  `tipoOrganizacao` enum('produtor_individual','empresa','grupo','cooperativa','outro') NOT NULL DEFAULT 'produtor_individual',
  `statusOrganizacao` enum('ativa','suspensa','arquivada') NOT NULL DEFAULT 'ativa',
  `ownerUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_memberships` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `userId` int NOT NULL,
  `orgRole` enum('proprietario','administrador','gerente','agronomo','operador','consultor','auditor') NOT NULL DEFAULT 'operador',
  `membershipStatus` enum('convidado','ativo','suspenso','removido') NOT NULL DEFAULT 'ativo',
  `invitedByUserId` int,
  `joinedAt` timestamp NOT NULL DEFAULT (now()),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `organization_memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `org_membership_org_user_uidx` ON `organization_memberships` (`organizationId`,`userId`);
--> statement-breakpoint
CREATE INDEX `org_membership_user_idx` ON `organization_memberships` (`userId`);
--> statement-breakpoint
CREATE INDEX `org_membership_org_idx` ON `organization_memberships` (`organizationId`);
--> statement-breakpoint
ALTER TABLE `usuarios_afu` ADD `activeOrganizationId` int;
--> statement-breakpoint
ALTER TABLE `produtores` ADD `organizationId` int;
--> statement-breakpoint
CREATE INDEX `produtores_organization_idx` ON `produtores` (`organizationId`);

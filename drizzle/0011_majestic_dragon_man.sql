CREATE TABLE `arquitetura_componentes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nome` varchar(120) NOT NULL,
	`camada` enum('frontend','backend','dados','ia','infra','seguranca','devops','integracao') NOT NULL,
	`descricao` text,
	`tecnologia` varchar(200),
	`status` enum('planejado','parcial','operacional','deprecado') NOT NULL DEFAULT 'operacional',
	`ordem` int DEFAULT 0,
	CONSTRAINT `arquitetura_componentes_id` PRIMARY KEY(`id`),
	CONSTRAINT `arquitetura_componentes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `noc_alertas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(64) NOT NULL,
	`titulo` varchar(200) NOT NULL,
	`descricao` text,
	`severidade` enum('info','baixa','media','alta','critica') NOT NULL DEFAULT 'media',
	`modulo` varchar(80) NOT NULL,
	`status` enum('aberto','reconhecido','resolvido') NOT NULL DEFAULT 'aberto',
	`origem` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `noc_alertas_id` PRIMARY KEY(`id`),
	CONSTRAINT `noc_alertas_codigo_unique` UNIQUE(`codigo`)
);

CREATE TABLE `clima_cultura` (
	`id` int AUTO_INCREMENT NOT NULL,
	`culturaCatalogoId` int NOT NULL,
	`temperaturaMin` decimal(5,1),
	`temperaturaMax` decimal(5,1),
	`precipitacaoMin` int,
	`precipitacaoMax` int,
	`necessidadeLuz` text,
	CONSTRAINT `clima_cultura_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `controle_pragas_cultura` (
	`id` int AUTO_INCREMENT NOT NULL,
	`culturaCatalogoId` int NOT NULL,
	`pragaCatalogoId` int,
	`doencaCatalogoId` int,
	CONSTRAINT `controle_pragas_cultura_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `culturas_catalogo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nomePopular` varchar(150) NOT NULL,
	`nomeCientifico` varchar(200),
	`familiaBotanica` varchar(100),
	`categoria` varchar(50),
	`descricao` text,
	`cicloProdutivoMin` int,
	`cicloProdutivoMax` int,
	`fasesFenologicas` text,
	`tipoSolo` text,
	`epocasPlantio` text,
	`produtividadeMedia` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `culturas_catalogo_id` PRIMARY KEY(`id`),
	CONSTRAINT `culturas_catalogo_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `doencas_catalogo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nome` varchar(150) NOT NULL,
	`nomeCientifico` varchar(200),
	`nivelRisco` enum('baixo','medio','alto','critico') DEFAULT 'medio',
	`sintomas` text,
	`controle` text,
	CONSTRAINT `doencas_catalogo_id` PRIMARY KEY(`id`),
	CONSTRAINT `doencas_catalogo_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `genetica_cultura` (
	`id` int AUTO_INCREMENT NOT NULL,
	`culturaCatalogoId` int NOT NULL,
	`geracao` enum('G1','G2','G3','G4','G5') NOT NULL,
	`descricao` text,
	CONSTRAINT `genetica_cultura_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `irrigacao_cultura` (
	`id` int AUTO_INCREMENT NOT NULL,
	`culturaCatalogoId` int NOT NULL,
	`metodoRecomendado` varchar(100),
	`laminaAgua` varchar(100),
	`frequencia` varchar(150),
	CONSTRAINT `irrigacao_cultura_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nutrientes_cultura` (
	`id` int AUTO_INCREMENT NOT NULL,
	`culturaCatalogoId` int NOT NULL,
	`nutriente` varchar(10) NOT NULL,
	`tipo` enum('macro','micro') NOT NULL,
	`exigencia` varchar(50),
	`observacoes` text,
	CONSTRAINT `nutrientes_cultura_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `piloto_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`participanteId` int NOT NULL,
	`notaNps` int NOT NULL,
	`comentario` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `piloto_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `piloto_metricas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` varchar(50) NOT NULL,
	`valor` decimal(10,2),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `piloto_metricas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `piloto_participantes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(200) NOT NULL,
	`email` varchar(320),
	`regiao` varchar(100),
	`cultura` varchar(100),
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `piloto_participantes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pragas_catalogo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nome` varchar(150) NOT NULL,
	`nomeCientifico` varchar(200),
	`nivelRisco` enum('baixo','medio','alto','critico') DEFAULT 'medio',
	`sintomas` text,
	`controle` text,
	CONSTRAINT `pragas_catalogo_id` PRIMARY KEY(`id`),
	CONSTRAINT `pragas_catalogo_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `culturas` ADD `culturaCatalogoId` int;
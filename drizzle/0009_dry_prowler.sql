CREATE TABLE `economia_cultura` (
	`id` int AUTO_INCREMENT NOT NULL,
	`culturaCatalogoId` int NOT NULL,
	`unidadeProdutividade` varchar(40) DEFAULT 'kg/ha',
	`produtividadeMin` decimal(12,2),
	`produtividadeMed` decimal(12,2),
	`produtividadeMax` decimal(12,2),
	`custoHaEstimado` decimal(12,2),
	`precoUnidade` decimal(12,2),
	`moeda` varchar(8) DEFAULT 'BRL',
	`observacoes` text,
	CONSTRAINT `economia_cultura_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_modulos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nome` varchar(120) NOT NULL,
	`descricao` text,
	`parametros` text,
	`cor` varchar(20),
	`emoji` varchar(16),
	CONSTRAINT `lab_modulos_id` PRIMARY KEY(`id`),
	CONSTRAINT `lab_modulos_slug_unique` UNIQUE(`slug`)
);

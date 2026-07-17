CREATE TABLE `tipos_solo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`nome` varchar(120) NOT NULL,
	`descricao` text,
	`textura` varchar(80),
	`phMin` decimal(3,1),
	`phMax` decimal(3,1),
	`drenagem` varchar(80),
	`fertilidade` varchar(80),
	`aptidaoCulturas` text,
	`manejo` text,
	CONSTRAINT `tipos_solo_id` PRIMARY KEY(`id`),
	CONSTRAINT `tipos_solo_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `zonas_climaticas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoKoppen` varchar(10) NOT NULL,
	`nome` varchar(120) NOT NULL,
	`descricao` text,
	`regioesBrasil` text,
	`tempMediaMin` decimal(5,1),
	`tempMediaMax` decimal(5,1),
	`precipitacaoAnualMin` int,
	`precipitacaoAnualMax` int,
	`aptidaoCulturas` text,
	CONSTRAINT `zonas_climaticas_id` PRIMARY KEY(`id`),
	CONSTRAINT `zonas_climaticas_codigoKoppen_unique` UNIQUE(`codigoKoppen`)
);

CREATE TABLE `camadas_geo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(64) NOT NULL,
	`nome` varchar(120) NOT NULL,
	`tipo` enum('ndvi','chuva','solo','risco','clima','drone','outro') NOT NULL,
	`descricao` text,
	`fonte` varchar(120),
	`coberturaKm2` decimal(14,2),
	`resolucaoM` int,
	`atualizadoEm` timestamp,
	`ativo` boolean DEFAULT true,
	CONSTRAINT `camadas_geo_id` PRIMARY KEY(`id`),
	CONSTRAINT `camadas_geo_codigo_unique` UNIQUE(`codigo`)
);

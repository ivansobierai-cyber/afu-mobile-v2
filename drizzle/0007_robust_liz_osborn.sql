CREATE TABLE `mensagens_suporte` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`ticketId` int,
	`autor` enum('usuario','sistema','tecnico') NOT NULL,
	`texto` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mensagens_suporte_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioAfuId` int NOT NULL,
	`expoPushToken` varchar(255) NOT NULL,
	`platform` enum('ios','android','web') NOT NULL,
	`deviceName` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_tokens_expoPushToken_unique` UNIQUE(`expoPushToken`)
);
--> statement-breakpoint
CREATE TABLE `tickets_suporte` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`tipo` enum('chamado','duvida','visita','chat') NOT NULL,
	`titulo` varchar(200) NOT NULL,
	`descricao` text NOT NULL,
	`prioridade` enum('baixa','normal','alta') DEFAULT 'normal',
	`status` enum('aberto','em_andamento','resolvido','cancelado') DEFAULT 'aberto',
	`culturaRelacionada` varchar(100),
	`dataVisita` varchar(30),
	`resposta` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_suporte_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `push_tokens_usuario_idx` ON `push_tokens` (`usuarioAfuId`);
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
CREATE INDEX `push_tokens_usuario_idx` ON `push_tokens` (`usuarioAfuId`);

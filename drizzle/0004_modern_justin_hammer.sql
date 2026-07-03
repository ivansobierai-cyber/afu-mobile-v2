ALTER TABLE `users` ADD `refreshToken` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `refreshTokenExpiry` timestamp;
-- Cultivos V2 finalização — exigir safra e talhão em culturas (após backfill)
ALTER TABLE `culturas` MODIFY COLUMN `safraId` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `culturas` MODIFY COLUMN `terrenoId` int NOT NULL;

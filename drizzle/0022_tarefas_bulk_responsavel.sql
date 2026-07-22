ALTER TABLE tarefas_operacionais ADD COLUMN responsavelUserId int NULL;
--> statement-breakpoint
CREATE INDEX tarefas_responsavel_idx ON tarefas_operacionais (responsavelUserId);

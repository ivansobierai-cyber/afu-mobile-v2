-- WP-02 / FASE 2 — ponte ativa evento ↔ tarefa
-- Não altera ENUMs nem remove colunas. Reusa tarefas_operacionais.legadoEventoId (UNIQUE desde 0013).
-- Backfill de tarefas faltantes é feito pelo script idempotente apply-0040-evento-tarefa-bridge.ts.

-- Garante índice único (no-op se já existir da 0013).
-- MySQL: CREATE UNIQUE INDEX IF NOT EXISTS não é universal; o apply script trata idempotência.

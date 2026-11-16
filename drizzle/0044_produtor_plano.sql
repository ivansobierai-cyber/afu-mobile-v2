-- WP-06 — plano comercial mínimo no cadastro do produtor (pré WP-14)
-- Numeração: 0044 (0040=#59 WP-02, 0041=#63 WP-03, 0042=#68 WP-04, 0043=#69 WP-07).
-- Idempotente: ADD COLUMN só se ausente (script apply verifica). Soft — sem DROP / hard delete.

ALTER TABLE `produtores`
  ADD COLUMN `plano` ENUM('free', 'produtor', 'pro', 'enterprise')
    NOT NULL DEFAULT 'free'
    AFTER `cadastroAtivo`;

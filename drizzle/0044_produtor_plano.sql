-- WP-06 — plano comercial mínimo + flag de troca de senha no convite
-- Numeração: 0044 (0040=#59 WP-02, 0041=#63 WP-03, 0042=#68 WP-04, 0043=#69 WP-07).
-- Idempotente via script apply (verifica coluna antes do ALTER). Soft — sem DROP / hard delete.

ALTER TABLE `produtores`
  ADD COLUMN `plano` ENUM('free', 'produtor', 'pro', 'enterprise')
    NOT NULL DEFAULT 'free'
    AFTER `cadastroAtivo`;

ALTER TABLE `users`
  ADD COLUMN `mustChangePassword` TINYINT(1) NOT NULL DEFAULT 0
    AFTER `emailVerified`;

-- WP-08 — MFA TOTP (secret encrypted, recovery codes hashed)
-- Aditivo: não remove colunas nem apaga dados.
-- Numeração 0045 (0040-0042 PRs abertos, 0043 LGPD, 0044 produtor_plano).
-- Aplicação idempotente: scripts/apply-0045-mfa-totp.ts

CREATE TABLE IF NOT EXISTS `user_mfa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `totpSecretEncrypted` text NULL,
  `totpEnabled` tinyint(1) NOT NULL DEFAULT 0,
  `pendingSecretEncrypted` text NULL,
  `recoveryCodesHash` text NULL,
  `recoveryCodesRemaining` int NOT NULL DEFAULT 0,
  `enrolledAt` timestamp NULL,
  `lastVerifiedAt` timestamp NULL,
  `disabledAt` timestamp NULL,
  `disabledByAdminUserId` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_mfa_user_uidx` (`userId`),
  KEY `user_mfa_enabled_idx` (`totpEnabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

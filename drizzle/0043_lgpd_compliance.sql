-- WP-07 — LGPD mínimo operacional (consentimento, exclusão agendada)
-- Aditivo: não remove colunas nem apaga dados.
-- Numeração 0043+ (0040/0041 em PRs WP-02/WP-03, 0042 livre de propósito).
-- Aplicação idempotente: scripts/apply-0043-lgpd-compliance.ts

CREATE TABLE IF NOT EXISTS `lgpd_consent_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `documentType` enum('terms','privacy') NOT NULL,
  `documentVersion` varchar(40) NOT NULL,
  `acceptedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(64) NULL,
  `userAgent` varchar(255) NULL,
  `source` varchar(40) NOT NULL DEFAULT 'signup',
  `meta` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lgpd_consent_user_idx` (`userId`),
  KEY `lgpd_consent_doc_idx` (`documentType`, `documentVersion`),
  KEY `lgpd_consent_accepted_idx` (`acceptedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lgpd_deletion_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `status` enum('pending','scheduled','cancelled','anonymized','rejected') NOT NULL DEFAULT 'scheduled',
  `reason` text NULL,
  `gracePeriodDays` int NOT NULL DEFAULT 30,
  `requestedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scheduledAnonymizeAt` timestamp NOT NULL,
  `cancelledAt` timestamp NULL,
  `processedAt` timestamp NULL,
  `processedByAdminUserId` int NULL,
  `adminNotes` text NULL,
  `ip` varchar(64) NULL,
  `userAgent` varchar(255) NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `lgpd_deletion_user_idx` (`userId`),
  KEY `lgpd_deletion_status_idx` (`status`, `scheduledAnonymizeAt`),
  KEY `lgpd_deletion_requested_idx` (`requestedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

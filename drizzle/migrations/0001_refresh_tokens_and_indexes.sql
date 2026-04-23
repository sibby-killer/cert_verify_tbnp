-- ============================================================
-- Migration: 0001_refresh_tokens_and_indexes.sql
-- Generated: 2026-04-23
-- Description:
--   1. Create refresh_tokens table (hashed tokens, cascade delete)
--   2. Add all performance indexes for certificates, students, logs
-- ============================================================

-- Refresh tokens table
-- NOTE: `token` stores SHA-256(raw_uuid) — never the raw token.
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         TEXT NOT NULL PRIMARY KEY,
  `token`      TEXT NOT NULL UNIQUE,           -- SHA-256 hash of the raw cookie token
  `user_id`    TEXT NOT NULL REFERENCES `admin_users`(`id`) ON DELETE CASCADE,
  `expires_at` INTEGER NOT NULL,               -- unix timestamp (seconds)
  `created_at` INTEGER DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS `refresh_tokens_token_idx`
  ON `refresh_tokens`(`token`);

CREATE INDEX IF NOT EXISTS `refresh_tokens_user_id_idx`
  ON `refresh_tokens`(`user_id`);

-- ── Certificate indexes ──────────────────────────────────────────────────────
-- Composite unique: one certificate per student per course
CREATE UNIQUE INDEX IF NOT EXISTS `certificates_student_course_idx`
  ON `certificates`(`student_id`, `course_id`);

CREATE UNIQUE INDEX IF NOT EXISTS `certificates_security_number_idx`
  ON `certificates`(`security_number`);

CREATE INDEX IF NOT EXISTS `certificates_student_id_idx`
  ON `certificates`(`student_id`);

CREATE INDEX IF NOT EXISTS `certificates_course_id_idx`
  ON `certificates`(`course_id`);

CREATE INDEX IF NOT EXISTS `certificates_status_idx`
  ON `certificates`(`status`);

-- ── Student indexes ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS `students_name_idx`
  ON `students`(`name`);

-- ── Verification log indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS `vlog_cert_id_idx`
  ON `verification_logs`(`cert_id`);

CREATE INDEX IF NOT EXISTS `vlog_verified_at_idx`
  ON `verification_logs`(`verified_at`);

CREATE INDEX IF NOT EXISTS `vlog_result_idx`
  ON `verification_logs`(`result`);

-- ── Forgery report indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS `freport_status_idx`
  ON `forgery_reports`(`status`);

-- ── Purge existing raw-UUID refresh tokens (Phase 3 breaking change) ────────
-- All users will need to re-login after this migration.
DELETE FROM `refresh_tokens`;

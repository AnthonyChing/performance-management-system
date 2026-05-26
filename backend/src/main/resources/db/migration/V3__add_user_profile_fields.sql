-- =====================================================================
-- V3: Add profile fields to users
-- =====================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS english_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS location     VARCHAR(128);

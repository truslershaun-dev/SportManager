-- Seeds the demo Admin account into the D1 `users` table.
-- Run this AFTER applying the schema from cloudflare-d1-schema.md.
--
-- Login: admin@sportmanager.com / Admin@12345
--
-- The password below is stored as PBKDF2-SHA256 (100,000 iterations,
-- 16-byte salt), formatted as "<salt-hex>:<hash-hex>" - matching the
-- hashPassword()/verifyPassword() helpers now used in both
-- functions/api/[[path]].js and cloudflare-worker/src/index.js. Do not
-- edit this string by hand; it will no longer verify.
--
-- Run it with (from the repo root, where wrangler.toml lives):
--   npx wrangler d1 execute sportmanager_db --remote --file=./db-seed-admin.sql
-- Drop --remote to seed your local `wrangler dev` database instead.
--
-- Note: the database is named "sportmanager_db" (no "s" after "sport") to
-- match wrangler.toml - the README and cloudflare-d1-schema.md previously
-- said "sportsmanager_db", which would not match and has been corrected.

INSERT INTO users (id, email, password, name, user_type, role_tier, created_at)
VALUES (
  'admin-001',
  'admin@sportmanager.com',
  'c5185d9b030601a2c3df36edddf8904d:ef89348163943fc6a621d283e0b71a467c07cdb502ac136ed52091fe6555a395',
  'Administrator',
  'admin',
  '',
  '2026-09-13T00:00:00.000Z'
)
ON CONFLICT(email) DO NOTHING;

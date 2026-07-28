-- Key-value settings table (currently just baby_last_name, shown after each
-- first name on the compare screen).
--
-- No manual step required: app/api/settings/route.ts creates this table
-- lazily at runtime (CREATE TABLE IF NOT EXISTS), so every per-couple
-- database picks it up on deploy. Kept here so the schema stays documented
-- alongside the other migrations.

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- One-time migration for the existing Rob & Camille database.
-- Renames the name-baked columns to neutral slots (rob -> user1, camille -> user2).
-- Data-preserving and reversible. SQLite >=3.25 RENAME COLUMN auto-rewrites the CHECK constraints.
--
-- Back up first:  turso db shell junior .dump > backup-pre-001.sql
-- Apply:          turso db shell junior < migrations/001-rename-to-slots.sql
-- Reverse:        rename user1_* -> rob_*, user2_* -> camille_*
-- (replace "junior" with the target database name for other couples)

ALTER TABLE names RENAME COLUMN rob_vote     TO user1_vote;
ALTER TABLE names RENAME COLUMN camille_vote TO user2_vote;
ALTER TABLE names RENAME COLUMN rob_elo      TO user1_elo;
ALTER TABLE names RENAME COLUMN camille_elo  TO user2_elo;

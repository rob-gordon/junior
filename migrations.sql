CREATE TABLE IF NOT EXISTS names (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  meaning TEXT,
  origin TEXT,
  description TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),

  rob_vote TEXT CHECK (rob_vote IN ('yes', 'no')),
  camille_vote TEXT CHECK (camille_vote IN ('yes', 'no')),

  rob_elo REAL NOT NULL DEFAULT 1000,
  camille_elo REAL NOT NULL DEFAULT 1000
);

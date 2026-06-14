CREATE TABLE IF NOT EXISTS names (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  meaning TEXT,
  origin TEXT,
  description TEXT,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),

  user1_vote TEXT CHECK (user1_vote IN ('yes', 'no')),
  user2_vote TEXT CHECK (user2_vote IN ('yes', 'no')),

  user1_elo REAL NOT NULL DEFAULT 1000,
  user2_elo REAL NOT NULL DEFAULT 1000
);

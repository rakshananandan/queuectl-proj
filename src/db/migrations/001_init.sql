BEGIN;

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('pending','processing','completed','failed','dead')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  next_run_at TEXT NOT NULL,
  run_at TEXT,
  claimed_by TEXT,
  last_error TEXT,
  run_log BLOB,
  priority INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_jobs_state_due ON jobs(state, next_run_at);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority DESC, next_run_at);
CREATE INDEX IF NOT EXISTS idx_jobs_claimed_by ON jobs(claimed_by);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  last_heartbeat TEXT NOT NULL
);

COMMIT;


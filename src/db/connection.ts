// Database connection management using SQLite
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (!db) {
    const dbPath = process.env.QUEUECTL_DB_PATH || path.join(process.cwd(), 'queue.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}


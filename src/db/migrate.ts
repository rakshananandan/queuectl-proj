// Database migration system
import { getDB } from './connection';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function runMigrations(): void {
  const db = getDB();
  
  try {
    const sqlPath = join(__dirname, 'migrations', '001_init.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    db.exec(sql);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}


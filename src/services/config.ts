// Configuration management service
import { getDB } from '../db/connection';
import type { ConfigKV } from '../types';

export function getConfig(key?: string): ConfigKV | ConfigKV[] | null {
  const db = getDB();
  
  if (key) {
    const row = db.prepare('SELECT key, value FROM config WHERE key = ?').get(key) as ConfigKV | undefined;
    return row || null;
  }
  
  return db.prepare('SELECT key, value FROM config ORDER BY key').all() as ConfigKV[];
}

export function setConfig(key: string, value: string): void {
  const db = getDB();
  db.prepare(`
    INSERT INTO config(key, value) 
    VALUES(?, ?) 
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value);
}

export function getNumberConfig(key: string, fallback: number): number {
  const row = getConfig(key);
  if (!row || Array.isArray(row)) return fallback;
  
  const num = Number(row.value);
  return Number.isFinite(num) ? num : fallback;
}

export function getStringConfig(key: string, fallback: string): string {
  const row = getConfig(key);
  if (!row || Array.isArray(row)) return fallback;
  return row.value || fallback;
}


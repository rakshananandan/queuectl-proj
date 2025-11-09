// Queue operations for adding and listing jobs
import { getDB } from '../db/connection';
import { nowISO } from '../utils/time';
import type { Job, JobState } from '../types';

export function enqueue(job: Partial<Job>): void {
  if (!job.id) throw new Error('job.id is required');
  if (!job.command) throw new Error('job.command is required');
  
  const db = getDB();
  const now = nowISO();
  const nextRun = job.run_at || now;
  
  db.prepare(`
    INSERT INTO jobs(
      id, command, state, attempts, max_retries,
      created_at, updated_at, next_run_at, run_at, priority
    )
    VALUES(?, ?, 'pending', 0, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.command,
    job.max_retries ?? 3,
    now,
    now,
    nextRun,
    job.run_at || null,
    job.priority ?? 0
  );
}

export function list(state?: JobState, limit: number = 50): Job[] {
  const db = getDB();
  
  if (state) {
    return db.prepare(`
      SELECT * FROM jobs 
      WHERE state = ? 
      ORDER BY updated_at DESC 
      LIMIT ?
    `).all(state, limit) as Job[];
  }
  
  return db.prepare(`
    SELECT * FROM jobs 
    ORDER BY updated_at DESC 
    LIMIT ?
  `).all(limit) as Job[];
}

export function inspect(id: string): Job | null {
  const db = getDB();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined;
  return job || null;
}

export function listDLQ(limit: number = 50): Job[] {
  const db = getDB();
  return db.prepare(`
    SELECT * FROM jobs 
    WHERE state = 'dead' 
    ORDER BY updated_at DESC 
    LIMIT ?
  `).all(limit) as Job[];
}


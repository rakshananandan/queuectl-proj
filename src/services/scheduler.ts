// Job scheduling, claiming, and state transitions with retry logic
import { getDB } from '../db/connection';
import { nowISO, plusSecondsISO } from '../utils/time';
import type { Job } from '../types';

export function backoffDelaySeconds(base: number, attempts: number): number {
  return Math.pow(base, attempts);
}

export function claimNextJob(workerId: string): Job | null {
  const db = getDB();
  
  const tx = db.transaction(() => {
    const candidate = db.prepare(`
      SELECT id FROM jobs
      WHERE state = 'pending' 
        AND next_run_at <= ?
      ORDER BY priority DESC, next_run_at ASC
      LIMIT 1
    `).get(nowISO()) as { id: string } | undefined;
    
    if (!candidate) return null;
    
    const result = db.prepare(`
      UPDATE jobs
      SET state = 'processing',
          claimed_by = ?,
          updated_at = ?
      WHERE id = ? AND state = 'pending'
    `).run(workerId, nowISO(), candidate.id);
    
    if (result.changes === 0) {
      return null;
    }
    
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(candidate.id) as Job;
  });
  
  return tx();
}

export function markCompleted(id: string): void {
  const db = getDB();
  db.prepare(`
    UPDATE jobs 
    SET state = 'completed', 
        updated_at = ?, 
        claimed_by = NULL 
    WHERE id = ?
  `).run(nowISO(), id);
}

export function markFailed(
  id: string, 
  attempts: number, 
  maxRetries: number, 
  base: number, 
  error: string
): void {
  const db = getDB();
  const nextAttempts = attempts + 1;
  
  if (nextAttempts <= maxRetries) {
    const delay = backoffDelaySeconds(base, nextAttempts);
    db.prepare(`
      UPDATE jobs 
      SET state = 'failed',
          attempts = ?,
          next_run_at = ?,
          last_error = ?,
          updated_at = ?,
          claimed_by = NULL
      WHERE id = ?
    `).run(nextAttempts, plusSecondsISO(delay), error, nowISO(), id);
  } else {
    db.prepare(`
      UPDATE jobs 
      SET state = 'dead',
          attempts = ?,
          last_error = ?,
          updated_at = ?,
          claimed_by = NULL
      WHERE id = ?
    `).run(nextAttempts, error, nowISO(), id);
  }
}

export function reenqueueFailedDueNow(id: string): void {
  const db = getDB();
  db.prepare(`
    UPDATE jobs 
    SET state = 'pending',
        next_run_at = ?,
        updated_at = ?,
        claimed_by = NULL
    WHERE id = ?
  `).run(nowISO(), nowISO(), id);
}

export function retryFromDLQ(id: string): void {
  const db = getDB();
  db.prepare(`
    UPDATE jobs 
    SET state = 'pending',
        attempts = 0,
        next_run_at = ?,
        last_error = NULL,
        updated_at = ?,
        claimed_by = NULL
    WHERE id = ?
  `).run(nowISO(), nowISO(), id);
}


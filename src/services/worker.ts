// Worker processes that execute jobs from the queue
import { spawn } from 'node:child_process';
import { claimNextJob, markCompleted, markFailed } from './scheduler';
import { getNumberConfig } from './config';
import { log, error, success, warn } from '../utils/logger';
import { nowISO } from '../utils/time';
import { randomUUID } from 'node:crypto';
import { setupGracefulShutdown } from '../utils/signals';
import { getDB } from '../db/connection';
import type { Job } from '../types';

let activeWorkers: Set<string> = new Set();
let globalStopping = false;

export async function startWorkers(count: number): Promise<void> {
  const workers: Promise<void>[] = [];
  
  log(`Starting ${count} worker(s)...`);
  
  setupGracefulShutdown(async () => {
    warn('Stopping all workers...');
    globalStopping = true;
  });
  
  for (let i = 0; i < count; i++) {
    workers.push(runWorkerLoop(i + 1));
  }
  
  await Promise.all(workers);
}

async function runWorkerLoop(workerNumber: number): Promise<void> {
  const workerId = randomUUID();
  const pollIntervalMs = getNumberConfig('poll_interval_ms', 200);
  const backoffBase = getNumberConfig('backoff_base', 2);
  
  const db = getDB();
  const now = nowISO();
  db.prepare(`
    INSERT INTO workers(id, started_at, last_heartbeat)
    VALUES(?, ?, ?)
  `).run(workerId, now, now);
  
  activeWorkers.add(workerId);
  log(`Worker #${workerNumber} (${workerId.slice(0, 8)}) started`);
  
  const heartbeatInterval = setInterval(() => {
    if (!globalStopping) {
      db.prepare('UPDATE workers SET last_heartbeat = ? WHERE id = ?')
        .run(nowISO(), workerId);
    }
  }, 5000);
  
  try {
    while (!globalStopping) {
      const job = claimNextJob(workerId);
      
      if (!job) {
        await sleep(pollIntervalMs);
        continue;
      }
      
      log(`Worker #${workerNumber} executing job ${job.id}: ${job.command}`);
      const started = Date.now();
      
      try {
        await runCommand(job.command);
        markCompleted(job.id);
        const duration = Date.now() - started;
        success(`Job ${job.id} completed in ${duration}ms`);
      } catch (err: any) {
        const errorMsg = (err?.message || String(err) || 'Unknown error').substring(0, 500);
        markFailed(job.id, job.attempts, job.max_retries, backoffBase, errorMsg);
        error(`Job ${job.id} failed: ${errorMsg}`);
      }
    }
  } finally {
    clearInterval(heartbeatInterval);
    db.prepare('DELETE FROM workers WHERE id = ?').run(workerId);
    activeWorkers.delete(workerId);
    log(`Worker #${workerNumber} (${workerId.slice(0, 8)}) stopped gracefully`);
  }
}

function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const errorMsg = stderr || stdout || `Process exited with code ${code}`;
        reject(new Error(errorMsg));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getActiveWorkers(): string[] {
  return Array.from(activeWorkers);
}


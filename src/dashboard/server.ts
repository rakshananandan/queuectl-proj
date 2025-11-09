// Web dashboard server
import express from 'express';
import { runMigrations } from '../db/migrate';
import { getDB } from '../db/connection';
import { list, listDLQ } from '../services/queue';
import { retryFromDLQ } from '../services/scheduler';
import { getConfig } from '../services/config';
import type { Job, JobState } from '../types';

runMigrations();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('src/dashboard/public'));

app.get('/api/status', (req, res) => {
  const db = getDB();
  
  const states: JobState[] = ['pending', 'processing', 'completed', 'failed', 'dead'];
  const counts: Record<string, number> = {};
  
  for (const state of states) {
    const row = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE state = ?').get(state) as { count: number };
    counts[state] = row.count;
  }
  
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  
  const workers = db.prepare(`
    SELECT id, started_at, last_heartbeat 
    FROM workers 
    ORDER BY started_at DESC
  `).all() as Array<{ id: string; started_at: string; last_heartbeat: string }>;
  
  res.json({
    counts,
    total,
    workers: workers.length,
    workerDetails: workers
  });
});

app.get('/api/jobs', (req, res) => {
  const state = req.query.state as JobState | undefined;
  const limit = parseInt(req.query.limit as string || '50', 10);
  
  const jobs = list(state, limit);
  res.json(jobs);
});

app.get('/api/jobs/:id', (req, res) => {
  const db = getDB();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as Job | undefined;
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

app.get('/api/dlq', (req, res) => {
  const limit = parseInt(req.query.limit as string || '50', 10);
  const jobs = listDLQ(limit);
  res.json(jobs);
});

app.post('/api/dlq/:id/retry', (req, res) => {
  try {
    retryFromDLQ(req.params.id);
    res.json({ success: true, message: 'Job moved back to pending queue' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json(Array.isArray(config) ? config : [config]);
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { enqueue } = await import('../services/queue');
    const job = req.body;
    
    if (!job.id || !job.command) {
      return res.status(400).json({ error: 'Job must have id and command' });
    }
    
    enqueue(job);
    res.json({ success: true, message: 'Job enqueued successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
});


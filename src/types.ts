// Type definitions for the queue system
export type JobState = 'pending' | 'processing' | 'completed' | 'failed' | 'dead';

export interface Job {
  id: string;
  command: string;
  state: JobState;
  attempts: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  next_run_at: string;
  run_at?: string | null;
  claimed_by?: string | null;
  last_error?: string | null;
  run_log?: Buffer | null;
  priority?: number;
}

export interface ConfigKV {
  key: string;
  value: string;
}

export interface WorkerInfo {
  id: string;
  started_at: string;
  last_heartbeat: string;
}


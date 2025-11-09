// Status command handler
import { getDB } from '../db/connection';
import chalk from 'chalk';
import { Command } from 'commander';
import { formatDate } from '../utils/time';

export default function register(program: Command): void {
  program
    .command('status')
    .description('Show queue status summary')
    .action(() => {
      const db = getDB();
      const states = ['pending', 'processing', 'completed', 'failed', 'dead'];
      const counts: Record<string, number> = {};
      
      for (const state of states) {
        const row = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE state = ?').get(state) as { count: number };
        counts[state] = row.count;
      }
      
      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      
      console.log(chalk.bold.blue('\nQueue Status\n'));
      console.log(chalk.gray('═'.repeat(50)));
      
      const jobTable = states.map(state => ({
        State: getStateLabel(state),
        Count: getStateColor(state, counts[state]),
      }));
      
      console.table(jobTable);
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.bold(`Total Jobs: ${total}\n`));
      
      const workers = db.prepare(`
        SELECT id, started_at, last_heartbeat 
        FROM workers 
        ORDER BY started_at DESC
      `).all() as Array<{ id: string; started_at: string; last_heartbeat: string }>;
      
      if (workers.length > 0) {
        console.log(chalk.bold.blue('Active Workers\n'));
        const workerTable = workers.map(w => ({
          'Worker ID': chalk.cyan(w.id.slice(0, 8) + '...'),
          'Started': formatDate(w.started_at),
          'Last Heartbeat': formatDate(w.last_heartbeat),
        }));
        console.table(workerTable);
        console.log();
      } else {
        console.log(chalk.yellow('No active workers\n'));
      }
    });
}

function getStateLabel(state: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    dead: 'Dead (DLQ)',
  };
  return labels[state] || state;
}

function getStateColor(state: string, count: number): string {
  const num = count.toString();
  switch (state) {
    case 'pending':
      return chalk.yellow(num);
    case 'processing':
      return chalk.blue(num);
    case 'completed':
      return chalk.green(num);
    case 'failed':
      return chalk.red(num);
    case 'dead':
      return chalk.red.bold(num);
    default:
      return num;
  }
}


// List command handler
import { list } from '../services/queue';
import chalk from 'chalk';
import { Command } from 'commander';
import { formatDate } from '../utils/time';

export default function register(program: Command): void {
  program
    .command('list')
    .description('List jobs by state')
    .option('--state <state>', 'Filter by state (pending, processing, completed, failed, dead)')
    .option('--limit <n>', 'Maximum number of jobs to show', '50')
    .action((opts: { state?: string; limit?: string }) => {
      const state = opts.state as any;
      const limit = parseInt(opts.limit || '50', 10);
      
      const jobs = list(state, limit);
      
      if (jobs.length === 0) {
        console.log(chalk.yellow('No jobs found'));
        return;
      }
      
      console.log(chalk.blue(`\nFound ${jobs.length} job(s)\n`));
      
      const table = jobs.map(job => ({
        ID: chalk.cyan(job.id.slice(0, 8) + '...'),
        Command: job.command.length > 40 ? job.command.substring(0, 37) + '...' : job.command,
        State: getStateColor(job.state),
        Attempts: `${job.attempts}/${job.max_retries}`,
        'Next Run': formatDate(job.next_run_at),
      }));
      
      console.table(table);
    });
}

function getStateColor(state: string): string {
  switch (state) {
    case 'pending':
      return chalk.yellow('pending');
    case 'processing':
      return chalk.blue('processing');
    case 'completed':
      return chalk.green('completed');
    case 'failed':
      return chalk.red('failed');
    case 'dead':
      return chalk.red.bold('DEAD');
    default:
      return state;
  }
}


// DLQ list command handler
import { listDLQ } from '../services/queue';
import chalk from 'chalk';
import { Command } from 'commander';
import { formatDate } from '../utils/time';

export default function register(program: Command): void {
  program
    .command('list')
    .description('List all jobs in the Dead Letter Queue')
    .option('--limit <n>', 'Maximum number of jobs to show', '50')
    .action((opts: { limit?: string }) => {
      const limit = parseInt(opts.limit || '50', 10);
      const jobs = listDLQ(limit);
      
      if (jobs.length === 0) {
        console.log(chalk.green('Dead Letter Queue is empty'));
        return;
      }
      
      console.log(chalk.bold.red(`\nDead Letter Queue: ${jobs.length} job(s)\n`));
      
      const table = jobs.map(job => ({
        ID: chalk.cyan(job.id.slice(0, 12)),
        Command: job.command.length > 50 ? job.command.substring(0, 47) + '...' : job.command,
        Attempts: `${job.attempts}/${job.max_retries}`,
        'Last Error': job.last_error 
          ? (job.last_error.length > 60 ? job.last_error.substring(0, 57) + '...' : job.last_error)
          : 'N/A',
        'Failed At': formatDate(job.updated_at),
      }));
      
      console.table(table);
      console.log(chalk.yellow(`\nUse 'queuectl dlq retry <id>' to retry a job\n`));
    });
}


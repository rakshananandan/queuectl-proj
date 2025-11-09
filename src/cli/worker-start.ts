// Worker start command handler
import { startWorkers } from '../services/worker';
import chalk from 'chalk';
import { Command } from 'commander';

export default function register(program: Command): void {
  program
    .command('start')
    .description('Start worker processes to execute jobs')
    .option('--count <n>', 'Number of workers to start', '1')
    .option('--poll-interval-ms <ms>', 'Polling interval in milliseconds', '200')
    .option('--backoff-base <base>', 'Exponential backoff base', '2')
    .action(async (opts: { count?: string; pollIntervalMs?: string; backoffBase?: string }) => {
      const count = parseInt(opts.count || '1', 10);
      const pollInterval = opts.pollIntervalMs || '200';
      const backoffBase = opts.backoffBase || '2';
      
      if (opts.pollIntervalMs) {
        const { setConfig } = await import('../services/config');
        setConfig('poll_interval_ms', pollInterval);
      }
      
      if (opts.backoffBase) {
        const { setConfig } = await import('../services/config');
        setConfig('backoff_base', backoffBase);
      }
      
      console.log(chalk.blue.bold('\nStarting workers...\n'));
      console.log(chalk.gray(`Workers: ${count}`));
      console.log(chalk.gray(`Poll Interval: ${pollInterval}ms`));
      console.log(chalk.gray(`Backoff Base: ${backoffBase}\n`));
      console.log(chalk.yellow('Press Ctrl+C to stop workers gracefully\n'));
      
      try {
        await startWorkers(count);
      } catch (err: any) {
        console.error(chalk.red(`Error starting workers: ${err.message}`));
        process.exit(1);
      }
    });
}


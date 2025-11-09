// Worker stop command handler
import { getDB } from '../db/connection';
import chalk from 'chalk';
import { Command } from 'commander';

export default function register(program: Command): void {
  program
    .command('stop')
    .description('Stop running workers gracefully')
    .action(() => {
      const db = getDB();
      const workers = db.prepare('SELECT id FROM workers').all() as Array<{ id: string }>;
      
      if (workers.length === 0) {
        console.log(chalk.yellow('No active workers found'));
        return;
      }
      
      console.log(chalk.blue(`Found ${workers.length} active worker(s)`));
      console.log(chalk.yellow('Note: Workers will stop gracefully when they finish their current job.'));
      console.log(chalk.yellow('To stop immediately, use Ctrl+C in the terminal where workers are running.'));
      console.log(chalk.gray('\nWorkers are managed per-process. This command shows active workers.'));
    });
}


// DLQ retry command handler
import { retryFromDLQ } from '../services/scheduler';
import { inspect } from '../services/queue';
import chalk from 'chalk';
import { Command } from 'commander';

export default function register(program: Command): void {
  program
    .command('retry <id>')
    .description('Retry a job from the Dead Letter Queue')
    .action((id: string) => {
      const job = inspect(id);
      
      if (!job) {
        console.log(chalk.red(`Job ${id} not found`));
        process.exit(1);
      }
      
      if (job.state !== 'dead') {
        console.log(chalk.yellow(`Job ${id} is not in the Dead Letter Queue (current state: ${job.state})`));
        process.exit(1);
      }
      
      retryFromDLQ(id);
      console.log(chalk.green(`Job ${chalk.bold(id)} moved back to pending queue`));
    });
}


// Dashboard command handler
import { Command } from 'commander';
import chalk from 'chalk';

export default function register(program: Command): void {
  program
    .command('dashboard')
    .description('Start the web dashboard server')
    .option('--port <port>', 'Port to run the dashboard on', '3000')
    .action((opts: { port?: string }) => {
      const port = opts.port || '3000';
      process.env.PORT = port;
      
      console.log(chalk.blue.bold('\nStarting dashboard server...\n'));
      console.log(chalk.gray(`Dashboard will be available at http://localhost:${port}\n`));
      
      import('../dashboard/server').catch((err) => {
        console.error(chalk.red(`Failed to start dashboard: ${err.message}`));
        process.exit(1);
      });
    });
}



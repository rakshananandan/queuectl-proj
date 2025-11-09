// Configuration management CLI commands
import { getConfig, setConfig } from '../services/config';
import chalk from 'chalk';
import { Command } from 'commander';

export default function register(program: Command): void {
  const configCmd = program.command('config');
  
  configCmd
    .command('get [key]')
    .description('Get configuration value(s)')
    .action((key?: string) => {
      const result = getConfig(key);
      
      if (!result) {
        console.log(chalk.yellow(`Config key '${key}' not found`));
        return;
      }
      
      if (Array.isArray(result)) {
        if (result.length === 0) {
          console.log(chalk.yellow('No configuration entries found'));
          return;
        }
        
        console.log(chalk.blue('\nConfiguration:\n'));
        const table = result.map(c => ({
          Key: chalk.cyan(c.key),
          Value: c.value,
        }));
        console.table(table);
      } else {
        console.log(chalk.cyan(`${result.key} = ${result.value}`));
      }
    });
  
  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((key: string, value: string) => {
      setConfig(key, value);
      console.log(chalk.green(`Config '${chalk.bold(key)}' set to '${chalk.bold(value)}'`));
    });
  
  configCmd
    .command('list')
    .description('List all configuration entries')
    .action(() => {
      const result = getConfig();
      
      if (Array.isArray(result) && result.length === 0) {
        console.log(chalk.yellow('No configuration entries found'));
        return;
      }
      
      if (Array.isArray(result)) {
        console.log(chalk.blue('\nConfiguration:\n'));
        const table = result.map(c => ({
          Key: chalk.cyan(c.key),
          Value: c.value,
        }));
        console.table(table);
      }
    });
}


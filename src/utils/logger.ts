// Logging utilities with colored output
import chalk from 'chalk';

export const log = (...args: any[]): void => {
  console.log(chalk.blue('[queuectl]'), ...args);
};

export const error = (...args: any[]): void => {
  console.error(chalk.red('[queuectl]'), ...args);
};

export const success = (...args: any[]): void => {
  console.log(chalk.green('[queuectl]'), ...args);
};

export const warn = (...args: any[]): void => {
  console.warn(chalk.yellow('[queuectl]'), ...args);
};

export const info = (...args: any[]): void => {
  console.log(chalk.cyan('[queuectl]'), ...args);
};


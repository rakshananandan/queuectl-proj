#!/usr/bin/env node

// Main entry point for queuectl CLI
import { Command } from 'commander';
import chalk from 'chalk';
import { runMigrations } from './db/migrate';
import enqueue from './cli/enqueue';
import list from './cli/list';
import status from './cli/status';
import workerStart from './cli/worker-start';
import workerStop from './cli/worker-stop';
import dlqList from './cli/dlq-list';
import dlqRetry from './cli/dlq-retry';
import config from './cli/config';
import dashboard from './cli/dashboard';

runMigrations();

const program = new Command();

program
  .name('queuectl')
  .description('CLI-based background job queue system with retries, exponential backoff, and DLQ')
  .version('1.0.0');

enqueue(program);
list(program);
status(program);

const workerCmd = program.command('worker');
workerStart(workerCmd);
workerStop(workerCmd);

const dlqCmd = program.command('dlq');
dlqList(dlqCmd);
dlqRetry(dlqCmd);
config(program);
dashboard(program);

program.parse();


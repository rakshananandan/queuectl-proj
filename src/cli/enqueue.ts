// Enqueue command handler
import { enqueue } from '../services/queue';
import { success, error } from '../utils/logger';
import chalk from 'chalk';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

export default function register(program: Command): void {
  program
    .command('enqueue <json>')
    .description('Add a new job to the queue (JSON string or path to JSON file)')
    .action((json: string) => {
      try {
        let jsonString = json;
        
        if (existsSync(json)) {
          jsonString = readFileSync(json, 'utf-8').trim();
        }
        
        if (!jsonString.includes('"') && jsonString.includes('{')) {
          jsonString = jsonString.replace(/\{([^}]+)\}/, (match, content) => {
            const pairs = content.split(',').map((pair: string) => {
              const [key, ...valueParts] = pair.split(':');
              const value = valueParts.join(':').trim();
              const keyTrimmed = key.trim();
              const quotedKey = keyTrimmed.startsWith('"') ? keyTrimmed : `"${keyTrimmed}"`;
              let quotedValue = value;
              if (!value.match(/^["\d-]/) && value.length > 0) {
                quotedValue = `"${value}"`;
              }
              return `${quotedKey}:${quotedValue}`;
            });
            return `{${pairs.join(',')}}`;
          });
        }
        
        const job = JSON.parse(jsonString);
        enqueue(job);
        success(`Job ${chalk.bold(job.id)} enqueued successfully`);
      } catch (err: any) {
        error(`Failed to enqueue job: ${err.message}`);
        process.exit(1);
      }
    });
}


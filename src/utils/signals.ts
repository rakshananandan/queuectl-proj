// Graceful shutdown handler for workers
export function setupGracefulShutdown(callback: () => void | Promise<void>): void {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    
    console.log(`\n${signal} received. Gracefully shutting down...`);
    try {
      await callback();
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}


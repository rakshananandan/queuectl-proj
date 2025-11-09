// Time utility functions
export const nowISO = (): string => new Date().toISOString();

export const plusSecondsISO = (seconds: number): string => {
  return new Date(Date.now() + seconds * 1000).toISOString();
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleString();
};


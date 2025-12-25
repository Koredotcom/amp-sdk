/**
 * Utility functions for AMP SDK
 */

/**
 * Generate a random hex string ID
 */
export function generateId(length: number = 16): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generate trace ID (32 hex chars)
 */
export function generateTraceId(): string {
  return generateId(32);
}

/**
 * Generate span ID (16 hex chars)
 */
export function generateSpanId(): string {
  return generateId(16);
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${generateId(8)}`;
}

/**
 * Get current timestamp in ISO 8601 format
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Calculate duration between two ISO timestamps in milliseconds
 */
export function duration(startTime: string, endTime: string): number {
  return new Date(endTime).getTime() - new Date(startTime).getTime();
}

/**
 * Simple logger with debug support
 */
export class Logger {
  constructor(private debug: boolean = false) {}

  log(message: string, ...args: any[]): void {
    if (this.debug) {
      console.log(`[AMP SDK] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[AMP SDK] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[AMP SDK] ${message}`, ...args);
  }
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 500,
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}


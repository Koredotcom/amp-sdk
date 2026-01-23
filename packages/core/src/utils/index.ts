/**
 * Utility functions for AMP SDK
 */

/**
 * Generate cryptographically secure random bytes as hex string
 * Uses crypto.getRandomValues when available, falls back to Math.random
 */
function getRandomBytes(byteLength: number): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/**
 * Convert bytes to lowercase hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if bytes are all zero (invalid for OTEL)
 */
function isZero(bytes: Uint8Array): boolean {
  return bytes.every(b => b === 0);
}

/**
 * Generate a random hex string ID
 */
export function generateId(length: number = 16): string {
  const bytes = getRandomBytes(Math.ceil(length / 2));
  return bytesToHex(bytes).slice(0, length);
}

/**
 * Generate OTEL-compliant Trace ID
 * Format: 32 lowercase hex chars (16 bytes / 128 bits)
 * Must be non-zero as per W3C Trace Context spec
 */
export function generateTraceId(): string {
  let bytes: Uint8Array;
  do {
    bytes = getRandomBytes(16); // 16 bytes = 128 bits = 32 hex chars
  } while (isZero(bytes));
  return bytesToHex(bytes);
}

/**
 * Generate OTEL-compliant Span ID
 * Format: 16 lowercase hex chars (8 bytes / 64 bits)
 * Must be non-zero as per W3C Trace Context spec
 */
export function generateSpanId(): string {
  let bytes: Uint8Array;
  do {
    bytes = getRandomBytes(8); // 8 bytes = 64 bits = 16 hex chars
  } while (isZero(bytes));
  return bytesToHex(bytes);
}

/**
 * Generate session ID with timestamp for uniqueness
 * Format: sess_<timestamp>_<random>
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


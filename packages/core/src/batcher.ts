/**
 * BatchProcessor for AMP SDK
 * Queues traces and sends in batches for efficiency
 */

import { TraceData, TelemetryPayload, TelemetryResponse, AMPConfig } from './types';
import { Logger, retry } from './utils';
import { Trace } from './spans';
import {
  DEFAULT_BASE_URL,
  INGEST_ENDPOINT,
  DEFAULT_BATCH_SIZE,
  DEFAULT_BATCH_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT,
} from './constants';

/**
 * HTTP client interface (can be Stainless-generated or custom)
 */
export interface HTTPClient {
  post(url: string, body: any, headers: Record<string, string>): Promise<any>;
}

/**
 * Simple fetch-based HTTP client
 */
export class FetchHTTPClient implements HTTPClient {
  constructor(private timeout: number = 30000) {}

  async post(url: string, body: any, headers: Record<string, string>): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * BatchProcessor - Queues traces and sends in batches
 *
 * Features:
 * - Queues traces until batch size or timeout
 * - Auto-flushes on process exit
 * - Retry with exponential backoff
 */
export class BatchProcessor {
  private queue: TraceData[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private httpClient: HTTPClient;
  private logger: Logger;
  private isFlushing: boolean = false;
  private isShutdown: boolean = false;

  private config: {
    apiKey: string;
    baseURL: string;
    ingestEndpoint: string;
    batchSize: number;
    batchTimeout: number;
    maxRetries: number;
  };

  constructor(config: AMPConfig, httpClient?: HTTPClient) {
    this.config = {
      apiKey: config.apiKey,
      baseURL: (config.baseURL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
      ingestEndpoint: config.ingestEndpoint || INGEST_ENDPOINT,
      batchSize: config.batchSize || DEFAULT_BATCH_SIZE,
      batchTimeout: config.batchTimeout || DEFAULT_BATCH_TIMEOUT,
      maxRetries: config.maxRetries || DEFAULT_MAX_RETRIES,
    };

    this.httpClient = httpClient || new FetchHTTPClient(config.timeout || DEFAULT_TIMEOUT);
    this.logger = new Logger(config.debug || false);

    // Auto-flush on process exit (Node.js)
    if (!config.disableAutoFlush && typeof process !== 'undefined') {
      this.setupAutoFlush();
    }
  }

  /**
   * Add a trace to the queue
   */
  enqueue(trace: Trace | TraceData): void {
    if (this.isShutdown) {
      this.logger.warn('BatchProcessor is shutdown, ignoring trace');
      return;
    }

    const traceData = trace instanceof Trace ? trace.toData() : trace;
    this.queue.push(traceData);
    this.logger.log(`Queued trace ${traceData.trace_id} (queue size: ${this.queue.length})`);

    // Flush if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    } else if (!this.timer) {
      // Start timeout timer
      this.timer = setTimeout(() => this.flush(), this.config.batchTimeout);
    }
  }

  /**
   * Flush queued traces to API
   */
  async flush(): Promise<TelemetryResponse | null> {
    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Skip if empty or already flushing
    if (this.queue.length === 0 || this.isFlushing) {
      return null;
    }

    this.isFlushing = true;

    // Take current queue
    const traces = [...this.queue];
    this.queue = [];

    this.logger.log(`Flushing ${traces.length} traces`);

    try {
      const response = await this.sendBatch(traces);
      this.logger.log(`Flush successful: ${response.accepted.traces} traces accepted`);
      return response;
    } catch (error) {
      this.logger.error('Flush failed:', error);
      // Put failed traces back in queue (front)
      this.queue = [...traces, ...this.queue];
      throw error;
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Send batch to API with retries
   */
  private async sendBatch(traces: TraceData[]): Promise<TelemetryResponse> {
    const payload: TelemetryPayload = { traces };

    // Debug only: dump actual payload sent to ingest API
    this.logger.log(`POST ${this.config.baseURL}${this.config.ingestEndpoint}`);
    this.logger.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

    return retry(
      async () => {
        return this.httpClient.post(
          `${this.config.baseURL}${this.config.ingestEndpoint}`,
          payload,
          {
            'X-API-Key': this.config.apiKey,
          },
        );
      },
      this.config.maxRetries,
      500,
    );
  }

  /**
   * Get current queue size
   */
  get queueSize(): number {
    return this.queue.length;
  }

  /**
   * Shutdown - flush remaining and stop accepting
   */
  async shutdown(): Promise<void> {
    this.isShutdown = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Final flush
    if (this.queue.length > 0) {
      try {
        await this.flush();
      } catch (error) {
        this.logger.error('Final flush failed:', error);
      }
    }

    this.logger.log('BatchProcessor shutdown complete');
  }

  /**
   * Setup auto-flush on process exit (Node.js)
   */
  private setupAutoFlush(): void {
    const cleanup = () => {
      if (!this.isShutdown) {
        // Synchronous flush attempt for exit
        this.shutdown().catch(() => {});
      }
    };

    process.on('beforeExit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });
  }
}


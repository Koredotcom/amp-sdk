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
  private maxQueueSize: number;

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

    this.maxQueueSize = config.maxQueueSize || 1000;
    this.httpClient = httpClient || new FetchHTTPClient(config.timeout || DEFAULT_TIMEOUT);
    this.logger = new Logger(config.debug || false);

    // Auto-flush on process exit (Node.js)
    if (!config.disableAutoFlush && typeof process !== 'undefined') {
      this.setupAutoFlush();
    }
  }

  /**
   * Add a trace to the queue (non-blocking, never throws)
   */
  enqueue(trace: Trace | TraceData): void {
    try {
      if (this.isShutdown) return;

      const traceData = trace instanceof Trace ? trace.toData() : trace;

      // Drop oldest traces if queue is full (prevent memory leak)
      if (this.queue.length >= this.maxQueueSize) {
        this.queue.shift();
        this.logger.warn(`Queue full (${this.maxQueueSize}), dropping oldest trace`);
      }

      this.queue.push(traceData);
      this.logger.log(`Queued trace ${traceData.trace_id} (queue size: ${this.queue.length})`);

      // Flush if batch size reached (fire-and-forget)
      if (this.queue.length >= this.config.batchSize) {
        this.flushAsync();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flushAsync(), this.config.batchTimeout);
      }
    } catch {
      // Silent — never break the application
    }
  }

  /**
   * Fire-and-forget flush — never blocks, never throws
   */
  private flushAsync(): void {
    this.flush().catch(() => {
      // Already handled inside flush — this is just a safety net
    });
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
      this.logger.log(`Flush successful: ingestion_id=${response.ingestion_id}, status=${response.status}`);
      return response;
    } catch (error) {
      // Drop failed traces — never re-queue to prevent snowball/memory leak
      this.logger.warn(`Flush failed, dropped ${traces.length} traces`);
      return null;
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

    // Final flush (best-effort, silent on failure)
    if (this.queue.length > 0) {
      try {
        await this.flush();
      } catch {
        // Silent — shutdown should never throw
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


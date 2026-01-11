"use strict";
/**
 * BatchProcessor for AMP SDK
 * Queues traces and sends in batches for efficiency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchProcessor = exports.FetchHTTPClient = void 0;
const utils_1 = require("./utils");
const spans_1 = require("./spans");
const constants_1 = require("./constants");
/**
 * Simple fetch-based HTTP client
 */
class FetchHTTPClient {
    constructor(timeout = 30000) {
        this.timeout = timeout;
    }
    async post(url, body, headers) {
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
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
}
exports.FetchHTTPClient = FetchHTTPClient;
/**
 * BatchProcessor - Queues traces and sends in batches
 *
 * Features:
 * - Queues traces until batch size or timeout
 * - Auto-flushes on process exit
 * - Retry with exponential backoff
 */
class BatchProcessor {
    constructor(config, httpClient) {
        this.queue = [];
        this.timer = null;
        this.isFlushing = false;
        this.isShutdown = false;
        this.config = {
            apiKey: config.apiKey,
            baseURL: (config.baseURL || constants_1.DEFAULT_BASE_URL).replace(/\/+$/, ''),
            ingestEndpoint: config.ingestEndpoint || constants_1.INGEST_ENDPOINT,
            batchSize: config.batchSize || constants_1.DEFAULT_BATCH_SIZE,
            batchTimeout: config.batchTimeout || constants_1.DEFAULT_BATCH_TIMEOUT,
            maxRetries: config.maxRetries || constants_1.DEFAULT_MAX_RETRIES,
        };
        this.httpClient = httpClient || new FetchHTTPClient(config.timeout || constants_1.DEFAULT_TIMEOUT);
        this.logger = new utils_1.Logger(config.debug || false);
        // Auto-flush on process exit (Node.js)
        if (!config.disableAutoFlush && typeof process !== 'undefined') {
            this.setupAutoFlush();
        }
    }
    /**
     * Add a trace to the queue
     */
    enqueue(trace) {
        if (this.isShutdown) {
            this.logger.warn('BatchProcessor is shutdown, ignoring trace');
            return;
        }
        const traceData = trace instanceof spans_1.Trace ? trace.toData() : trace;
        this.queue.push(traceData);
        this.logger.log(`Queued trace ${traceData.trace_id} (queue size: ${this.queue.length})`);
        // Flush if batch size reached
        if (this.queue.length >= this.config.batchSize) {
            this.flush();
        }
        else if (!this.timer) {
            // Start timeout timer
            this.timer = setTimeout(() => this.flush(), this.config.batchTimeout);
        }
    }
    /**
     * Flush queued traces to API
     */
    async flush() {
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
        }
        catch (error) {
            this.logger.error('Flush failed:', error);
            // Put failed traces back in queue (front)
            this.queue = [...traces, ...this.queue];
            throw error;
        }
        finally {
            this.isFlushing = false;
        }
    }
    /**
     * Send batch to API with retries
     */
    async sendBatch(traces) {
        const payload = { traces };
        // Debug only: dump actual payload sent to ingest API
        this.logger.log(`POST ${this.config.baseURL}${this.config.ingestEndpoint}`);
        this.logger.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
        return (0, utils_1.retry)(async () => {
            return this.httpClient.post(`${this.config.baseURL}${this.config.ingestEndpoint}`, payload, {
                'X-API-Key': this.config.apiKey,
            });
        }, this.config.maxRetries, 500);
    }
    /**
     * Get current queue size
     */
    get queueSize() {
        return this.queue.length;
    }
    /**
     * Shutdown - flush remaining and stop accepting
     */
    async shutdown() {
        this.isShutdown = true;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        // Final flush
        if (this.queue.length > 0) {
            try {
                await this.flush();
            }
            catch (error) {
                this.logger.error('Final flush failed:', error);
            }
        }
        this.logger.log('BatchProcessor shutdown complete');
    }
    /**
     * Setup auto-flush on process exit (Node.js)
     */
    setupAutoFlush() {
        const cleanup = () => {
            if (!this.isShutdown) {
                // Synchronous flush attempt for exit
                this.shutdown().catch(() => { });
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
exports.BatchProcessor = BatchProcessor;

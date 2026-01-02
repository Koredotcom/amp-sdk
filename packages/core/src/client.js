"use strict";
/**
 * AMP Client - Main entry point for AMP SDK
 * Agent Management Platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AMP = exports.Session = void 0;
const spans_1 = require("./spans");
const batcher_1 = require("./batcher");
const utils_1 = require("./utils");
const constants_1 = require("./constants");
/**
 * Session - For multi-turn conversations
 */
class Session {
    constructor(client, options = {}) {
        this._conversationTurn = 0;
        this._client = client;
        this._sessionId = options.sessionId || (0, utils_1.generateSessionId)();
        this._metadata = options.metadata || {};
    }
    get sessionId() {
        return this._sessionId;
    }
    /**
     * Start a trace within this session
     */
    trace(name, options = {}) {
        return this._client.trace(name, {
            ...options,
            sessionId: this._sessionId,
        });
    }
    /**
     * Add a conversation turn (transcript format)
     */
    async addTurn(messages) {
        this._conversationTurn++;
        const transcript = {
            session_id: this._sessionId,
            conversation_id: this._sessionId, // Use session as conversation
            conversation_turn: this._conversationTurn,
            messages,
            metadata: this._metadata,
        };
        await this._client.sendTranscript(transcript);
    }
    /**
     * End the session
     */
    end() {
        // Sessions are implicit - nothing to explicitly end
        // Could add session.end event if needed
    }
}
exports.Session = Session;
/**
 * AMP - Main SDK client
 *
 * Usage:
 * ```typescript
 * const amp = new AMP({ apiKey: 'sk_...' });
 *
 * // Simple trace
 * const trace = amp.trace('user-query');
 * const span = trace.startLLMSpan('llm.completion', 'openai', 'gpt-4');
 * span.setTokens(150, 75);
 * span.end();
 * trace.end();
 *
 * // Multi-turn session
 * const session = amp.session();
 * const trace1 = session.trace('turn-1');
 * // ...
 *
 * // Graceful shutdown
 * await amp.shutdown();
 * ```
 */
class AMP {
    constructor(config) {
        if (!config.apiKey) {
            throw new Error('AMP SDK: apiKey is required');
        }
        this.config = {
            baseURL: constants_1.DEFAULT_BASE_URL,
            ingestEndpoint: constants_1.INGEST_ENDPOINT,
            batchSize: 100,
            batchTimeout: 5000,
            maxRetries: 3,
            timeout: 30000,
            debug: false,
            ...config,
        };
        // Normalize baseURL (remove trailing slashes)
        this.config.baseURL = this.config.baseURL.replace(/\/+$/, '');
        this.logger = new utils_1.Logger(this.config.debug);
        this.httpClient = new batcher_1.FetchHTTPClient(this.config.timeout);
        this.batcher = new batcher_1.BatchProcessor(this.config, this.httpClient);
        this.logger.log('AMP SDK initialized', {
            baseURL: this.config.baseURL,
            batchSize: this.config.batchSize,
        });
    }
    // ============================================
    // TRACE API
    // ============================================
    /**
     * Start a new trace
     *
     * @param name - Trace name (e.g., 'user-query', 'chat-completion')
     * @param options - Optional trace configuration
     * @returns Trace instance
     *
     * @example
     * ```typescript
     * const trace = amp.trace('user-query');
     *
     * const span = trace.startSpan('llm.completion', { type: 'llm' });
     * span.setLLM('openai', 'gpt-4');
     * span.setTokens(150, 75);
     * span.end();
     *
     * trace.end(); // Auto-queued for batch send
     * ```
     */
    trace(name, options = {}) {
        const trace = new spans_1.Trace(name, options);
        // Register callback to enqueue when trace ends
        trace.onEnd((t) => {
            this.batcher.enqueue(t);
        });
        this.logger.log(`Started trace: ${trace.traceId}`);
        return trace;
    }
    /**
     * Start an LLM trace (convenience method)
     */
    llmTrace(name, system, model, options = {}) {
        const trace = this.trace(name, options);
        const span = trace.startLLMSpan('llm.completion', system, model);
        return { trace, span };
    }
    // ============================================
    // SESSION API
    // ============================================
    /**
     * Create a session for multi-turn conversations
     *
     * @param options - Session options
     * @returns Session instance
     *
     * @example
     * ```typescript
     * const session = amp.session({ sessionId: 'my-session-123' });
     *
     * // Turn 1
     * const trace1 = session.trace('turn-1');
     * // ... add spans
     * trace1.end();
     *
     * // Turn 2
     * const trace2 = session.trace('turn-2');
     * // ... add spans
     * trace2.end();
     * ```
     */
    session(options = {}) {
        const session = new Session(this, options);
        this.logger.log(`Created session: ${session.sessionId}`);
        return session;
    }
    // ============================================
    // TRANSCRIPT API
    // ============================================
    /**
     * Send a transcript directly (for conversation format)
     */
    async sendTranscript(transcript) {
        const payload = {
            transcripts: [transcript],
        };
        return this.httpClient.post(`${this.config.baseURL}${constants_1.TRANSCRIPT_ENDPOINT}`, payload, {
            'X-API-Key': this.config.apiKey,
        });
    }
    // ============================================
    // DIRECT SEND (Bypass batching)
    // ============================================
    /**
     * Send traces immediately (bypass batching)
     */
    async send(traces) {
        const payload = {
            traces: traces.map(t => t.toData()),
        };
        return this.httpClient.post(`${this.config.baseURL}${this.config.ingestEndpoint}`, payload, {
            'X-API-Key': this.config.apiKey,
        });
    }
    // ============================================
    // BATCH CONTROL
    // ============================================
    /**
     * Manually flush queued traces
     */
    async flush() {
        return this.batcher.flush();
    }
    /**
     * Get current queue size
     */
    get queueSize() {
        return this.batcher.queueSize;
    }
    // ============================================
    // HEALTH CHECK
    // ============================================
    /**
     * Check if AMP service is healthy
     */
    async health() {
        const response = await fetch(`${this.config.baseURL}/api/v1/health`);
        return response.json();
    }
    // ============================================
    // LIFECYCLE
    // ============================================
    /**
     * Gracefully shutdown - flush remaining traces
     *
     * @example
     * ```typescript
     * // At application exit
     * await amp.shutdown();
     * ```
     */
    async shutdown() {
        this.logger.log('Shutting down AMP SDK...');
        await this.batcher.shutdown();
        this.logger.log('AMP SDK shutdown complete');
    }
}
exports.AMP = AMP;
// Default export
exports.default = AMP;

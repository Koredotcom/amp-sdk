/**
 * AMP Client - Main entry point for AMP SDK
 * Agent Management Platform
 */

import {
  AMPConfig,
  TraceOptions,
  SessionOptions,
  TelemetryResponse,
  TranscriptData,
  Message,
  TelemetryPayload,
} from './types';
import { Trace, Span } from './spans';
import { BatchProcessor, FetchHTTPClient } from './batcher';
import { Logger, generateSessionId } from './utils';

/**
 * Session - For multi-turn conversations
 */
export class Session {
  private _sessionId: string;
  private _userId?: string;
  private _metadata: Record<string, string | number | boolean>;
  private _client: AMP;
  private _conversationTurn: number = 0;

  constructor(client: AMP, options: SessionOptions = {}) {
    this._client = client;
    this._sessionId = options.sessionId || generateSessionId();
    this._userId = options.userId;
    this._metadata = options.metadata || {};
  }

  get sessionId(): string {
    return this._sessionId;
  }

  /**
   * Start a trace within this session
   */
  trace(name: string, options: Omit<TraceOptions, 'sessionId'> = {}): Trace {
    return this._client.trace(name, {
      ...options,
      sessionId: this._sessionId,
    });
  }

  /**
   * Add a conversation turn (transcript format)
   */
  async addTurn(messages: Message[]): Promise<void> {
    this._conversationTurn++;

    const transcript: TranscriptData = {
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
  end(): void {
    // Sessions are implicit - nothing to explicitly end
    // Could add session.end event if needed
  }
}

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
export class AMP {
  private config: AMPConfig;
  private batcher: BatchProcessor;
  private logger: Logger;
  private httpClient: FetchHTTPClient;

  constructor(config: AMPConfig) {
    if (!config.apiKey) {
      throw new Error('AMP SDK: apiKey is required');
    }

    this.config = {
      baseURL: 'https://api.amp.kore.ai',
      batchSize: 100,
      batchTimeout: 5000,
      maxRetries: 3,
      timeout: 30000,
      debug: false,
      ...config,
    };

    this.logger = new Logger(this.config.debug);
    this.httpClient = new FetchHTTPClient(this.config.timeout);
    this.batcher = new BatchProcessor(this.config, this.httpClient);

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
  trace(name: string, options: TraceOptions = {}): Trace {
    const trace = new Trace(name, options);

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
  llmTrace(name: string, system: string, model: string, options: TraceOptions = {}): { trace: Trace; span: Span } {
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
   * const session = amp.session({ userId: 'user-123' });
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
  session(options: SessionOptions = {}): Session {
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
  async sendTranscript(transcript: TranscriptData): Promise<TelemetryResponse> {
    const payload: TelemetryPayload = {
      transcripts: [transcript],
    };

    return this.httpClient.post(
      `${this.config.baseURL}/api/v1/telemetry?format=transcript`,
      payload,
      {
        'X-API-Key': this.config.apiKey,
      },
    );
  }

  // ============================================
  // DIRECT SEND (Bypass batching)
  // ============================================

  /**
   * Send traces immediately (bypass batching)
   */
  async send(traces: Trace[]): Promise<TelemetryResponse> {
    const payload: TelemetryPayload = {
      traces: traces.map(t => t.toData()),
    };

    return this.httpClient.post(
      `${this.config.baseURL}/api/v1/telemetry`,
      payload,
      {
        'X-API-Key': this.config.apiKey,
      },
    );
  }

  // ============================================
  // BATCH CONTROL
  // ============================================

  /**
   * Manually flush queued traces
   */
  async flush(): Promise<TelemetryResponse | null> {
    return this.batcher.flush();
  }

  /**
   * Get current queue size
   */
  get queueSize(): number {
    return this.batcher.queueSize;
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * Check if AMP service is healthy
   */
  async health(): Promise<{ status: string; timestamp: string; version: string }> {
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
  async shutdown(): Promise<void> {
    this.logger.log('Shutting down AMP SDK...');
    await this.batcher.shutdown();
    this.logger.log('AMP SDK shutdown complete');
  }
}

// Default export
export default AMP;


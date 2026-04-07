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
  ObserveOptions,
  SendRawOptions,
} from './types';
import { Trace, Span } from './spans';
import { BatchProcessor, FetchHTTPClient } from './batcher';
import { Logger, generateSessionId } from './utils';
import {
  DEFAULT_BASE_URL,
  INGEST_ENDPOINT,
  TRANSCRIPT_ENDPOINT,
} from './constants';
import { getContext, runWithContext, AMPContext } from './context';
import type { AgentInfo } from './context';
import { setGlobalAMP, getCurrentSpan, getCurrentTrace } from './decorators';
import type { Trace as TraceType } from './spans/trace';

/**
 * Session - For multi-turn conversations
 */
export class Session {
  private _sessionId: string;
  private _metadata: Record<string, string | number | boolean>;
  private _client: AMP;
  private _conversationTurn: number = 0;

  constructor(client: AMP, options: SessionOptions = {}) {
    this._client = client;
    this._sessionId = options.sessionId || generateSessionId();
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

  // ============================================
  // STATIC — Global instance for decorators
  // ============================================

  /**
   * Initialize a global AMP instance (required for decorators)
   *
   * @example
   * ```typescript
   * // At app startup (once)
   * AMP.init({ apiKey: process.env.AMP_API_KEY });
   *
   * // Now decorators work everywhere
   * class MyService {
   *   @LLMTrace('chat', 'openai', 'gpt-4')
   *   async chat(prompt: string) { ... }
   * }
   * ```
   */
  static init(config: AMPConfig): AMP {
    const instance = new AMP(config);
    setGlobalAMP(instance);
    return instance;
  }

  /**
   * Get the current active span (inside a decorated method)
   * Returns undefined if not inside a decorated method
   */
  static currentSpan(): Span | undefined {
    return getCurrentSpan();
  }

  /**
   * Get the current active trace (inside a decorated method)
   * Returns undefined if not inside a decorated method
   */
  static currentTrace(): TraceType | undefined {
    return getCurrentTrace();
  }

  constructor(config: AMPConfig) {
    if (!config.apiKey) {
      throw new Error('AMP SDK: apiKey is required');
    }

    this.config = {
      baseURL: DEFAULT_BASE_URL,
      ingestEndpoint: INGEST_ENDPOINT,
      batchSize: 100,
      batchTimeout: 5000,
      maxRetries: 3,
      timeout: 30000,
      debug: false,
      ...config,
    };
    // Normalize baseURL (remove trailing slashes)
    this.config.baseURL = this.config.baseURL!.replace(/\/+$/, '');

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
    // Merge context (from withAgent/withContext) into trace options
    const ctx = getContext();
    if (ctx?.sessionId && !options.sessionId) {
      options.sessionId = ctx.sessionId;
    }

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
  // OBSERVE API - Function wrappers
  // ============================================

  /**
   * Observe a function — auto-creates trace + span, captures timing and errors
   *
   * @param name - Span/trace name
   * @param optionsOrFn - Options or callback function
   * @param fn - Callback function (if options provided)
   * @returns The return value of the callback
   *
   * @example
   * ```typescript
   * const result = await amp.observe('rag-pipeline', { type: 'rag' }, async (span) => {
   *   span.setRAG('pinecone', 'vector_search', 5);
   *   return await retrieveAndGenerate(query);
   * });
   *
   * // Without options:
   * const result = await amp.observe('my-task', async (span) => {
   *   return await doWork();
   * });
   * ```
   */
  async observe<T>(
    name: string,
    optionsOrFn: ObserveOptions | ((span: Span) => Promise<T>),
    fn?: (span: Span) => Promise<T>,
  ): Promise<T> {
    const options: ObserveOptions = typeof optionsOrFn === 'function' ? {} : optionsOrFn;
    const callback = typeof optionsOrFn === 'function' ? optionsOrFn : fn!;

    const trace = this.trace(name, { sessionId: options.sessionId });
    const span = trace.startSpan(name, { type: options.type || 'custom' });

    // Apply defaults from config
    this._applyDefaults(span);

    // Apply extra attributes
    if (options.attributes) {
      for (const [key, value] of Object.entries(options.attributes)) {
        span.setAttribute(key, value);
      }
    }

    try {
      const result = await callback(span);
      span.end();
      trace.end();
      return result;
    } catch (error) {
      span.setError(error instanceof Error ? error.message : String(error));
      span.end();
      trace.end();
      throw error;
    }
  }

  // ============================================
  // CONTEXT API - Agent & request context
  // ============================================

  /**
   * Run a function with agent context — all traces/spans created inside
   * automatically get agent metadata applied
   *
   * @example
   * ```typescript
   * amp.withAgent({ name: 'ResearchBot', type: 'research', version: '2.0' }, async () => {
   *   const trace = amp.trace('query');
   *   const span = trace.startSpan('search', { type: 'agent' });
   *   // span automatically has agent.name, agent.type, agent.version set
   * });
   * ```
   */
  withAgent<T>(agent: AgentInfo, fn: () => T): T {
    return runWithContext({ agent }, fn);
  }

  /**
   * Run a function with request context — session, user, and metadata
   * automatically applied to all traces/spans created inside
   *
   * @example
   * ```typescript
   * amp.withContext({ sessionId: 'user-123', userId: 'u-456' }, async () => {
   *   const trace = amp.trace('query'); // auto-gets sessionId
   *   // ...
   * });
   * ```
   */
  withContext<T>(ctx: Omit<AMPContext, 'agent'>, fn: () => T): T {
    return runWithContext(ctx, fn);
  }

  /**
   * Apply default attributes (from config.defaults + active context) to a span
   */
  private _applyDefaults(span: Span): void {
    const defaults = this.config.defaults;
    const ctx = getContext();

    // Agent defaults (context overrides config)
    const agent = ctx?.agent || defaults?.agent;
    if (agent) {
      span.setAgent(agent.name, agent.type || 'custom', agent.goal, agent.version);
      if (agent.role) span.setAttribute('agent.role', agent.role);
    }

    // Service defaults
    if (defaults?.service) {
      if (defaults.service.name) span.setAttribute('service.name', defaults.service.name);
      if (defaults.service.version) span.setAttribute('service.version', defaults.service.version);
      if (defaults.service.environment) span.setAttribute('deployment.environment', defaults.service.environment);
    }

    // Context metadata
    if (ctx?.userId) span.setAttribute('user.id', ctx.userId);
    if (ctx?.metadata) {
      for (const [key, value] of Object.entries(ctx.metadata)) {
        span.setAttribute(key, value);
      }
    }
  }

  // ============================================
  // RAW SEND API - For internal/non-standard formats
  // ============================================

  /**
   * Send a raw payload directly to the ingestion endpoint.
   * For internal Kore formats (AI for Work, SearchAI, Agentic) that
   * the backend auto-detects and processes natively.
   *
   * @example
   * ```typescript
   * // AI for Work
   * await amp.sendRaw({ analytics: [...] });
   *
   * // SearchAI
   * await amp.sendRaw({ Question: '...', retrieved_context: { extractive: [...] } });
   *
   * // Agentic (Langfuse-style)
   * await amp.sendRaw({ sessions: [...] });
   *
   * // With explicit format hint
   * await amp.sendRaw(payload, { format: 'ai4w' });
   * ```
   */
  async sendRaw(payload: unknown, options: SendRawOptions = {}): Promise<TelemetryResponse> {
    const formatParam = options.format ? `?format=${options.format}` : '';
    return this.httpClient.post(
      `${this.config.baseURL}${this.config.ingestEndpoint}${formatParam}`,
      payload,
      {
        'X-API-Key': this.config.apiKey,
      },
    );
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
      `${this.config.baseURL}${TRANSCRIPT_ENDPOINT}`,
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
      `${this.config.baseURL}${this.config.ingestEndpoint}`,
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


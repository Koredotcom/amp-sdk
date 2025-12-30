/**
 * Trace class for AMP SDK
 * Represents a complete operation (e.g., user request → response)
 */

import { TraceData, SpanStatus, TraceOptions, SpanOptions } from '../types';
import { generateTraceId, generateSessionId, now } from '../utils';
import { Span } from './span';

/**
 * Trace - Represents a complete operation containing multiple spans
 *
 * Usage:
 * ```typescript
 * const trace = new Trace('user-query', { sessionId: 'session-123' });
 *
 * const llmSpan = trace.startSpan('llm.completion', { type: 'llm' });
 * llmSpan.setLLM('openai', 'gpt-4').setTokens(150, 75);
 * llmSpan.end();
 *
 * trace.end();
 * const data = trace.toData(); // Ready to send to API
 * ```
 */
export class Trace {
  private _traceId: string;
  private _sessionId: string;
  private _name: string;
  private _startTime: string;
  private _endTime?: string;
  private _status: SpanStatus = 'unset';
  private _spans: Span[] = [];
  private _metadata: Record<string, string | number | boolean>;
  private _ended: boolean = false;
  private _onEnd?: (trace: Trace) => void;

  constructor(name: string, options: TraceOptions = {}) {
    this._traceId = options.traceId || generateTraceId();
    this._sessionId = options.sessionId || generateSessionId();
    this._name = name;
    this._startTime = now();
    this._metadata = options.metadata || {};
  }

  // ============================================
  // GETTERS
  // ============================================

  get traceId(): string {
    return this._traceId;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get name(): string {
    return this._name;
  }

  get isEnded(): boolean {
    return this._ended;
  }

  get spanCount(): number {
    return this._spans.length;
  }

  // ============================================
  // SPAN CREATION
  // ============================================

  /**
   * Start a new span within this trace (root-level span)
   * For nested child spans, use span.startChildSpan()
   */
  startSpan(name: string, options: SpanOptions = {}): Span {
    if (this._ended) {
      throw new Error(`Cannot add span to ended trace ${this._traceId}`);
    }

    const span = new Span(name, this._traceId, options);

    // Set callback so child spans created via span.startChildSpan() get registered
    span.setSpanCreatedCallback((childSpan: Span) => {
      this._spans.push(childSpan);
    });

    this._spans.push(span);
    return span;
  }

  /**
   * Start an LLM span (convenience method)
   */
  startLLMSpan(name: string, system: string, model: string): Span {
    const span = this.startSpan(name, { type: 'llm' });
    span.setLLM(system, model);
    return span;
  }

  /**
   * Start a tool span (convenience method)
   * Sets all mandatory tool fields automatically
   */
  startToolSpan(name: string, toolName: string, toolType: string = 'function'): Span {
    const span = this.startSpan(name, { type: 'tool' });
    span.setAttribute('tool.name', toolName);
    span.setAttribute('tool.type', toolType);
    return span;
  }

  /**
   * Start a RAG span (convenience method)
   * Sets all mandatory RAG fields automatically
   */
  startRAGSpan(name: string, dbSystem: string, method: string = 'vector_search'): Span {
    const span = this.startSpan(name, { type: 'rag' });
    span.setRAG(dbSystem, method, 0); // documentsRetrieved updated by setRetrievedContext
    return span;
  }

  /**
   * Start an agent span (convenience method)
   */
  startAgentSpan(name: string, agentName: string, agentType: string): Span {
    const span = this.startSpan(name, { type: 'agent' });
    span.setAgent(agentName, agentType);
    return span;
  }

  // ============================================
  // METADATA
  // ============================================

  /**
   * Set metadata on the trace
   */
  setMetadata(key: string, value: string | number | boolean): this {
    this._metadata[key] = value;
    return this;
  }

  /**
   * Set multiple metadata values
   */
  setMetadataAll(metadata: Record<string, string | number | boolean>): this {
    Object.assign(this._metadata, metadata);
    return this;
  }

  // ============================================
  // STATUS
  // ============================================

  /**
   * Set trace status to OK
   */
  setOk(): this {
    this._status = 'ok';
    return this;
  }

  /**
   * Set trace status to error
   */
  setError(): this {
    this._status = 'error';
    return this;
  }

  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * Register callback for when trace ends
   * (Used by BatchProcessor)
   */
  onEnd(callback: (trace: Trace) => void): void {
    this._onEnd = callback;
  }

  /**
   * End the trace
   * - Sets end time
   * - Auto-ends any open spans
   * - Determines status from spans
   */
  end(): void {
    if (this._ended) {
      console.warn(`[AMP SDK] Trace ${this._traceId} already ended`);
      return;
    }

    // Auto-end any open spans
    for (const span of this._spans) {
      if (!span.isEnded) {
        span.end();
      }
    }

    this._endTime = now();
    this._ended = true;

    // Determine status from spans (error if any span errored)
    if (this._status === 'unset') {
      const hasError = this._spans.some(s => s.toData().status === 'error');
      this._status = hasError ? 'error' : 'ok';
    }

    // Notify callback (for batching)
    if (this._onEnd) {
      this._onEnd(this);
    }
  }

  // ============================================
  // SERIALIZATION
  // ============================================

  /**
   * Convert to TraceData for API
   */
  toData(): TraceData {
    return {
      trace_id: this._traceId,
      trace_name: this._name, // Include trace name for proper identification
      session_id: this._sessionId,
      start_time: this._startTime,
      end_time: this._endTime,
      status: this._status,
      spans: this._spans.map(s => s.toData()),
      metadata: Object.keys(this._metadata).length > 0 ? this._metadata : undefined,
    };
  }
}


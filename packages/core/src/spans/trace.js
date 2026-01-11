"use strict";
/**
 * Trace class for AMP SDK
 * Represents a complete operation (e.g., user request → response)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trace = void 0;
const utils_1 = require("../utils");
const span_1 = require("./span");
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
class Trace {
    constructor(name, options = {}) {
        this._status = 'unset';
        this._spans = [];
        this._ended = false;
        this._traceId = options.traceId || (0, utils_1.generateTraceId)();
        this._sessionId = options.sessionId || (0, utils_1.generateSessionId)();
        this._name = name;
        this._startTime = (0, utils_1.now)();
        this._metadata = options.metadata || {};
    }
    // ============================================
    // GETTERS
    // ============================================
    get traceId() {
        return this._traceId;
    }
    get sessionId() {
        return this._sessionId;
    }
    get name() {
        return this._name;
    }
    get isEnded() {
        return this._ended;
    }
    get spanCount() {
        return this._spans.length;
    }
    // ============================================
    // SPAN CREATION
    // ============================================
    /**
     * Start a new span within this trace (root-level span)
     * For nested child spans, use span.startChildSpan()
     */
    startSpan(name, options = {}) {
        if (this._ended) {
            throw new Error(`Cannot add span to ended trace ${this._traceId}`);
        }
        const span = new span_1.Span(name, this._traceId, options);
        // Set callback so child spans created via span.startChildSpan() get registered
        span.setSpanCreatedCallback((childSpan) => {
            this._spans.push(childSpan);
        });
        this._spans.push(span);
        return span;
    }
    /**
     * Start an LLM span (convenience method)
     */
    startLLMSpan(name, system, model) {
        const span = this.startSpan(name, { type: 'llm' });
        span.setLLM(system, model);
        return span;
    }
    /**
     * Start a tool span (convenience method)
     * Sets all mandatory tool fields automatically
     */
    startToolSpan(name, toolName, toolType = 'function') {
        const span = this.startSpan(name, { type: 'tool' });
        span.setAttribute('tool.name', toolName);
        span.setAttribute('tool.type', toolType);
        return span;
    }
    /**
     * Start a RAG span (convenience method)
     * Sets all mandatory RAG fields automatically
     */
    startRAGSpan(name, dbSystem, method = 'vector_search') {
        const span = this.startSpan(name, { type: 'rag' });
        span.setRAG(dbSystem, method, 0); // documentsRetrieved updated by setRetrievedContext
        return span;
    }
    /**
     * Start an agent span (convenience method)
     */
    startAgentSpan(name, agentName, agentType) {
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
    setMetadata(key, value) {
        this._metadata[key] = value;
        return this;
    }
    /**
     * Set multiple metadata values
     */
    setMetadataAll(metadata) {
        Object.assign(this._metadata, metadata);
        return this;
    }
    // ============================================
    // STATUS
    // ============================================
    /**
     * Set trace status to OK
     */
    setOk() {
        this._status = 'ok';
        return this;
    }
    /**
     * Set trace status to error
     */
    setError() {
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
    onEnd(callback) {
        this._onEnd = callback;
    }
    /**
     * End the trace
     * - Sets end time
     * - Auto-ends any open spans
     * - Determines status from spans
     */
    end() {
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
        this._endTime = (0, utils_1.now)();
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
    toData() {
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
exports.Trace = Trace;

"use strict";
/**
 * Span class for AMP SDK
 * Represents a single operation within a trace
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Span = void 0;
const utils_1 = require("../utils");
/**
 * Span - Represents a single operation (LLM call, tool execution, RAG, agent, etc.)
 *
 * Usage:
 * ```typescript
 * const span = trace.startSpan('llm.completion', { type: 'llm' });
 * span.setLLM('openai', 'gpt-4')
 *     .setTokens(150, 75)
 *     .setCost(0.0082)
 *     .setMessages(inputMessages, outputMessages)
 *     .end();
 * ```
 */
class Span {
    constructor(name, traceId, options = {}) {
        this._status = 'unset';
        this._attributes = {};
        this._metadata = {};
        this._events = [];
        this._ended = false;
        this._spanId = options.spanId || (0, utils_1.generateSpanId)();
        this._traceId = traceId;
        this._parentSpanId = options.parentSpanId || null;
        this._name = name;
        this._type = options.type || 'custom';
        this._startTime = (0, utils_1.now)();
        if (options.attributes) {
            this._attributes = { ...options.attributes };
        }
        if (options.metadata) {
            this._metadata = { ...options.metadata };
        }
    }
    /**
     * Set callback for registering child spans with the trace
     * @internal Used by Trace class
     */
    setSpanCreatedCallback(callback) {
        this._onSpanCreated = callback;
    }
    // ============================================
    // GETTERS
    // ============================================
    get spanId() { return this._spanId; }
    get traceId() { return this._traceId; }
    get parentSpanId() { return this._parentSpanId; }
    get name() { return this._name; }
    get type() { return this._type; }
    get isEnded() { return this._ended; }
    // ============================================
    // CHILD SPAN CREATION
    // ============================================
    /**
     * Start a child span nested under this span
     * Use this for operations that are truly part of this span's work
     *
     * @example
     * ```typescript
     * const agentSpan = trace.startSpan('Agent Execution', { type: 'agent' });
     *
     * // Tool call is part of agent's work - use child span
     * const toolSpan = agentSpan.startChildSpan('Tool: Search', { type: 'tool' });
     * toolSpan.setTool('web_search', { query: 'AI news' }, { results: [...] });
     * toolSpan.end();
     *
     * // LLM call is part of agent's work - use child span
     * const llmSpan = agentSpan.startChildSpan('LLM Decision', { type: 'llm' });
     * llmSpan.setLLM('openai', 'gpt-4');
     * llmSpan.end();
     *
     * agentSpan.end();
     * ```
     */
    startChildSpan(name, options = {}) {
        if (this._ended) {
            throw new Error(`Cannot create child span on ended span ${this._spanId}`);
        }
        const childSpan = new Span(name, this._traceId, {
            ...options,
            parentSpanId: this._spanId, // This span becomes the parent
        });
        // Pass the callback to child so it can also create nested children
        if (this._onSpanCreated) {
            childSpan.setSpanCreatedCallback(this._onSpanCreated);
            // Register this child span with the trace
            this._onSpanCreated(childSpan);
        }
        return childSpan;
    }
    /**
     * Start a child LLM span (convenience method)
     */
    startChildLLMSpan(name, provider, model) {
        const span = this.startChildSpan(name, { type: 'llm' });
        span.setLLM(provider, model);
        return span;
    }
    /**
     * Start a child tool span (convenience method)
     * Sets all mandatory tool fields automatically
     */
    startChildToolSpan(name, toolName, toolType = 'function') {
        const span = this.startChildSpan(name, { type: 'tool' });
        span.setAttribute('tool.name', toolName);
        span.setAttribute('tool.type', toolType);
        return span;
    }
    /**
     * Start a child RAG span (convenience method)
     * Sets all mandatory RAG fields automatically
     */
    startChildRAGSpan(name, dbSystem, method = 'vector_search') {
        const span = this.startChildSpan(name, { type: 'rag' });
        span.setRAG(dbSystem, method, 0); // documentsRetrieved will be set by setRetrievedContext
        return span;
    }
    // ============================================
    // LLM METHODS
    // ============================================
    /**
     * Set LLM provider and model
     */
    setLLM(provider, model, responseModel) {
        this._type = 'llm';
        this._attributes['gen_ai.provider.name'] = provider;
        this._attributes['gen_ai.system'] = provider;
        this._attributes['gen_ai.request.model'] = model;
        if (responseModel) {
            this._attributes['gen_ai.response.model'] = responseModel;
        }
        return this;
    }
    /**
     * Set token counts (supports both standard and legacy formats)
     */
    setTokens(inputTokens, outputTokens) {
        const total = inputTokens + outputTokens;
        // Standard OTEL GenAI v1.37+
        this._attributes['gen_ai.usage.input_tokens'] = inputTokens;
        this._attributes['gen_ai.usage.output_tokens'] = outputTokens;
        this._attributes['gen_ai.usage.total_tokens'] = total;
        // Legacy (for compatibility)
        this._attributes['gen_ai.usage.prompt_tokens'] = inputTokens;
        this._attributes['gen_ai.usage.completion_tokens'] = outputTokens;
        this._attributes['gen_ai.prompt_tokens'] = inputTokens;
        this._attributes['gen_ai.completion_tokens'] = outputTokens;
        this._attributes['gen_ai.total_tokens'] = total;
        return this;
    }
    /**
     * Set LLM request parameters
     */
    setLLMParams(params) {
        if (params.temperature !== undefined) {
            this._attributes['gen_ai.request.temperature'] = params.temperature;
        }
        if (params.topP !== undefined) {
            this._attributes['gen_ai.request.top_p'] = params.topP;
        }
        if (params.maxTokens !== undefined) {
            this._attributes['gen_ai.request.max_tokens'] = params.maxTokens;
        }
        if (params.frequencyPenalty !== undefined) {
            this._attributes['gen_ai.request.frequency_penalty'] = params.frequencyPenalty;
        }
        if (params.presencePenalty !== undefined) {
            this._attributes['gen_ai.request.presence_penalty'] = params.presencePenalty;
        }
        if (params.stopSequences !== undefined) {
            this._attributes['gen_ai.request.stop_sequences'] = params.stopSequences;
        }
        return this;
    }
    /**
     * Set LLM response info
     */
    setLLMResponse(finishReason, responseId) {
        this._attributes['gen_ai.response.finish_reason'] = finishReason;
        if (responseId) {
            this._attributes['gen_ai.response.id'] = responseId;
        }
        return this;
    }
    /**
     * Set LLM operation type
     */
    setOperation(operation) {
        // Map common aliases to OTEL standard
        const mapped = operation === 'completion' ? 'text_completion'
            : operation === 'embedding' ? 'embeddings'
                : operation;
        this._attributes['gen_ai.operation.name'] = mapped;
        return this;
    }
    /**
     * Set cost in USD
     */
    setCost(costUsd) {
        this._attributes['span_cost_usd'] = costUsd;
        return this;
    }
    /**
     * Set conversation ID
     */
    setConversationId(conversationId) {
        this._attributes['gen_ai.conversation.id'] = conversationId;
        return this;
    }
    /**
     * Set input and output messages
     * Sets both OTEL GenAI and OpenInference standard keys for compatibility
     */
    setMessages(inputMessages, outputMessages) {
        // OTEL GenAI standard keys (primary - OpenLLMetry/Traceloop compatible)
        this._attributes['gen_ai.input.messages'] = inputMessages;
        this._attributes['gen_ai.output.messages'] = outputMessages;
        // OpenInference standard keys (fallback - Arize/Phoenix compatible)
        this._attributes['llm.input_messages'] = inputMessages;
        this._attributes['llm.output_messages'] = outputMessages;
        return this;
    }
    /**
     * Set system instructions/prompt
     * Sets both OTEL GenAI and OpenInference standard keys for compatibility
     */
    setSystemPrompt(systemPrompt) {
        // OTEL GenAI standard key (primary)
        this._attributes['gen_ai.system_instructions'] = systemPrompt;
        // OpenInference standard key (fallback)
        this._attributes['llm.system_instructions'] = systemPrompt;
        return this;
    }
    // ============================================
    // TOOL METHODS
    // ============================================
    /**
     * Set tool/function call info
     * Pass objects directly - serialization happens at transport layer
     */
    setTool(name, params, result) {
        this._type = 'tool';
        this._attributes['tool.name'] = name;
        // Set default tool.type if not already set
        if (!this._attributes['tool.type']) {
            this._attributes['tool.type'] = 'function';
        }
        if (params !== undefined) {
            this._attributes['tool.parameters'] = params;
        }
        if (result !== undefined) {
            this._attributes['tool.result'] = result;
        }
        return this;
    }
    /**
     * Set tool type and description
     */
    setToolInfo(type, description, callId) {
        this._attributes['tool.type'] = type;
        if (description) {
            this._attributes['gen_ai.tool.description'] = description;
        }
        if (callId) {
            this._attributes['gen_ai.tool.call.id'] = callId;
        }
        return this;
    }
    /**
     * Set tool status
     */
    setToolStatus(status, latencyMs, errorMessage) {
        // Map lowercase to uppercase for consistency
        const mapped = status === 'success' ? 'SUCCESS' : status === 'error' ? 'ERROR' : status;
        this._attributes['tool.status'] = mapped;
        if (latencyMs !== undefined) {
            this._attributes['tool.latency_ms'] = latencyMs;
        }
        if (errorMessage) {
            this._attributes['tool.error_message'] = errorMessage;
        }
        return this;
    }
    // ============================================
    // RAG METHODS
    // ============================================
    /**
     * Set RAG/retrieval info
     */
    setRAG(vectorDb, method, documentsRetrieved) {
        this._type = 'rag';
        this._attributes['vector_db'] = vectorDb;
        this._attributes['retrieval.method'] = method;
        this._attributes['retrieval_method'] = method; // Legacy support
        this._attributes['documents_retrieved'] = documentsRetrieved;
        this._attributes['context_count'] = documentsRetrieved;
        return this;
    }
    /**
     * Set user query for RAG
     */
    setUserQuery(query) {
        this._attributes['user_query'] = query;
        this._attributes['query'] = query;
        return this;
    }
    /**
     * Set RAG query parameters
     */
    setRAGParams(params) {
        if (params.topK !== undefined) {
            this._attributes['retrieval.top_k'] = params.topK;
        }
        if (params.similarityThreshold !== undefined) {
            this._attributes['similarity.threshold'] = params.similarityThreshold;
        }
        if (params.embeddingModel) {
            this._attributes['embedding_model'] = params.embeddingModel;
        }
        if (params.indexName) {
            this._attributes['index_name'] = params.indexName;
        }
        if (params.dataSourceId) {
            this._attributes['gen_ai.data_source.id'] = params.dataSourceId;
        }
        return this;
    }
    /**
     * Set retrieved context
     * Pass array directly - serialization happens at transport layer
     */
    setRetrievedContext(context) {
        this._attributes['retrieved_context'] = context;
        this._attributes['context_length'] = context.reduce((sum, doc) => sum + doc.content.length, 0);
        this._attributes['top_score'] = Math.max(...context.map(doc => doc.score));
        return this;
    }
    // ============================================
    // AGENT METHODS
    // ============================================
    /**
     * Set agent info
     */
    setAgent(name, type, goal) {
        this._type = 'agent';
        this._attributes['gen_ai.agent.name'] = name;
        this._attributes['agent.type'] = type;
        if (goal) {
            this._attributes['agent.goal'] = goal;
        }
        return this;
    }
    /**
     * Set agent details
     */
    setAgentDetails(details) {
        if (details.id)
            this._attributes['gen_ai.agent.id'] = details.id;
        if (details.description)
            this._attributes['gen_ai.agent.description'] = details.description;
        if (details.role)
            this._attributes['agent.role'] = details.role;
        if (details.status)
            this._attributes['agent.status'] = details.status;
        if (details.steps !== undefined)
            this._attributes['agent.steps'] = details.steps;
        if (details.maxIterations !== undefined)
            this._attributes['agent.max_iterations'] = details.maxIterations;
        return this;
    }
    /**
     * Set framework info
     */
    setFramework(framework, version) {
        this._attributes['framework'] = framework;
        if (version) {
            this._attributes['framework.version'] = version;
        }
        return this;
    }
    /**
     * Set crew (multi-agent) info
     */
    setCrew(crewId, crewName) {
        this._attributes['crew.id'] = crewId;
        this._attributes['crew.name'] = crewName;
        return this;
    }
    // ============================================
    // CHAIN/ORCHESTRATION METHODS
    // ============================================
    /**
     * Set chain type (orchestration)
     */
    setChain(chainType) {
        this._type = 'orchestration'; // 'chain' maps to 'orchestration' SpanType
        this._attributes['chain.type'] = chainType;
        this._attributes['chain_type'] = chainType; // Legacy support
        return this;
    }
    // ============================================
    // SERVICE/DEPLOYMENT METHODS
    // ============================================
    /**
     * Set service info
     */
    setService(name, version, environment) {
        this._attributes['service.name'] = name;
        if (version)
            this._attributes['service.version'] = version;
        if (environment)
            this._attributes['deployment.environment'] = environment;
        return this;
    }
    // ============================================
    // GENERIC ATTRIBUTE METHODS
    // ============================================
    /**
     * Set a single attribute
     */
    setAttribute(key, value) {
        this._attributes[key] = value;
        return this;
    }
    /**
     * Set multiple attributes
     */
    setAttributes(attributes) {
        Object.assign(this._attributes, attributes);
        return this;
    }
    /**
     * Set metadata (goes into metadata field, not attributes)
     */
    setMetadata(key, value) {
        this._metadata[key] = value;
        return this;
    }
    /**
     * Set latency in ms
     */
    setLatency(latencyMs) {
        this._attributes['latency_ms'] = latencyMs;
        return this;
    }
    // ============================================
    // EVENT METHODS
    // ============================================
    /**
     * Add a span event
     */
    addEvent(name, attributes) {
        this._events.push({
            name,
            timestamp: (0, utils_1.now)(),
            attributes,
        });
        return this;
    }
    /**
     * Record prompt content as event
     */
    recordPrompt(content) {
        return this.addEvent('gen_ai.content.prompt', { content });
    }
    /**
     * Record completion content as event
     */
    recordCompletion(content) {
        return this.addEvent('gen_ai.content.completion', { content });
    }
    /**
     * Record inference operation details (full messages)
     */
    recordInferenceDetails(inputMessages, outputMessages) {
        return this.addEvent('gen_ai.client.inference.operation.details', {
            'gen_ai.input.messages': inputMessages,
            'gen_ai.output.messages': outputMessages,
        });
    }
    // ============================================
    // STATUS METHODS
    // ============================================
    /**
     * Set status to OK
     */
    setOk() {
        this._status = 'ok';
        return this;
    }
    /**
     * Set status to error
     */
    setError(message) {
        this._status = 'error';
        if (message) {
            this._statusMessage = message;
        }
        return this;
    }
    /**
     * Record an exception
     */
    recordException(error) {
        this.setError(error.message);
        this.addEvent('exception', {
            'exception.type': error.name,
            'exception.message': error.message,
            'exception.stacktrace': error.stack || '',
        });
        return this;
    }
    // ============================================
    // LIFECYCLE
    // ============================================
    /**
     * End the span
     */
    end() {
        if (this._ended) {
            console.warn(`[AMP SDK] Span ${this._spanId} already ended`);
            return;
        }
        this._endTime = (0, utils_1.now)();
        this._ended = true;
        if (this._status === 'unset') {
            this._status = 'ok';
        }
    }
    // ============================================
    // SERIALIZATION
    // ============================================
    /**
     * Convert to SpanData for API
     */
    toData() {
        const data = {
            span_id: this._spanId,
            trace_id: this._traceId,
            parent_span_id: this._parentSpanId,
            name: this._name,
            type: this._type,
            start_time: this._startTime,
            end_time: this._endTime,
            status: this._status,
            status_message: this._statusMessage,
            attributes: this._attributes,
        };
        if (Object.keys(this._metadata).length > 0) {
            data.metadata = this._metadata;
        }
        if (this._events.length > 0) {
            data.events = this._events;
        }
        return data;
    }
}
exports.Span = Span;

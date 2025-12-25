/**
 * Span class for AMP SDK
 * Represents a single operation within a trace
 */

import {
  SpanData,
  SpanType,
  SpanStatus,
  SpanAttributes,
  SpanEvent,
  SpanOptions,
  FinishReason,
  GenAIOperationName,
  ToolStatus,
  RetrievalMethod,
} from '../types';
import { generateSpanId, now } from '../utils';

/**
 * LLM Message format
 */
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

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
export class Span {
  private _spanId: string;
  private _traceId: string;
  private _parentSpanId?: string | null;
  private _name: string;
  private _type: SpanType;
  private _startTime: string;
  private _endTime?: string;
  private _status: SpanStatus = 'unset';
  private _statusMessage?: string;
  private _attributes: SpanAttributes = {};
  private _metadata: Record<string, string | number | boolean> = {};
  private _events: SpanEvent[] = [];
  private _ended: boolean = false;

  constructor(name: string, traceId: string, options: SpanOptions = {}) {
    this._spanId = options.spanId || generateSpanId();
    this._traceId = traceId;
    this._parentSpanId = options.parentSpanId || null;
    this._name = name;
    this._type = options.type || 'custom';
    this._startTime = now();
    
    if (options.attributes) {
      this._attributes = { ...options.attributes };
    }
    if (options.metadata) {
      this._metadata = { ...options.metadata };
    }
  }

  // ============================================
  // GETTERS
  // ============================================

  get spanId(): string { return this._spanId; }
  get traceId(): string { return this._traceId; }
  get name(): string { return this._name; }
  get type(): SpanType { return this._type; }
  get isEnded(): boolean { return this._ended; }

  // ============================================
  // LLM METHODS
  // ============================================

  /**
   * Set LLM provider and model
   */
  setLLM(provider: string, model: string, responseModel?: string): this {
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
  setTokens(inputTokens: number, outputTokens: number): this {
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
  setLLMParams(params: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
  }): this {
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
  setLLMResponse(finishReason: FinishReason | string, responseId?: string): this {
    this._attributes['gen_ai.response.finish_reason'] = finishReason as FinishReason;
    if (responseId) {
      this._attributes['gen_ai.response.id'] = responseId;
    }
    return this;
  }

  /**
   * Set LLM operation type
   */
  setOperation(operation: GenAIOperationName | 'completion' | 'embedding' | string): this {
    // Map common aliases to OTEL standard
    const mapped = operation === 'completion' ? 'text_completion' 
                 : operation === 'embedding' ? 'embeddings' 
                 : operation;
    this._attributes['gen_ai.operation.name'] = mapped as GenAIOperationName;
    return this;
  }

  /**
   * Set cost in USD
   */
  setCost(costUsd: number): this {
    this._attributes['span_cost_usd'] = costUsd;
    return this;
  }

  /**
   * Set conversation ID
   */
  setConversationId(conversationId: string): this {
    this._attributes['gen_ai.conversation.id'] = conversationId;
    return this;
  }

  /**
   * Set input and output messages
   */
  setMessages(inputMessages: LLMMessage[], outputMessages: LLMMessage[]): this {
    this._attributes['llm_input_messages'] = JSON.stringify(inputMessages);
    this._attributes['llm_output_messages'] = JSON.stringify(outputMessages);
    return this;
  }

  /**
   * Set system instructions/prompt
   */
  setSystemPrompt(systemPrompt: string): this {
    this._attributes['llm_system_instructions'] = systemPrompt;
    return this;
  }

  // ============================================
  // TOOL METHODS
  // ============================================

  /**
   * Set tool/function call info
   */
  setTool(name: string, params?: any, result?: any): this {
    this._type = 'tool';
    this._attributes['tool.name'] = name;
    if (params !== undefined) {
      this._attributes['tool.parameters'] = typeof params === 'string' ? params : JSON.stringify(params);
    }
    if (result !== undefined) {
      this._attributes['tool.result'] = typeof result === 'string' ? result : JSON.stringify(result);
    }
    return this;
  }

  /**
   * Set tool type and description
   */
  setToolInfo(type: string, description?: string, callId?: string): this {
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
  setToolStatus(status: ToolStatus | 'success' | 'error', latencyMs?: number, errorMessage?: string): this {
    // Map lowercase to uppercase for consistency
    const mapped = status === 'success' ? 'SUCCESS' : status === 'error' ? 'ERROR' : status;
    this._attributes['tool.status'] = mapped as ToolStatus;
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
  setRAG(vectorDb: string, method: RetrievalMethod | string, documentsRetrieved: number): this {
    this._type = 'rag';
    this._attributes['vector_db'] = vectorDb;
    this._attributes['retrieval.method'] = method as RetrievalMethod;
    this._attributes['retrieval_method'] = method as RetrievalMethod; // Legacy support
    this._attributes['documents_retrieved'] = documentsRetrieved;
    this._attributes['context_count'] = documentsRetrieved;
    return this;
  }

  /**
   * Set user query for RAG
   */
  setUserQuery(query: string): this {
    this._attributes['user_query'] = query;
    this._attributes['query'] = query;
    return this;
  }

  /**
   * Set RAG query parameters
   */
  setRAGParams(params: {
    topK?: number;
    similarityThreshold?: number;
    embeddingModel?: string;
    indexName?: string;
    dataSourceId?: string;
  }): this {
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
   */
  setRetrievedContext(context: Array<{ doc_id: string; content: string; score: number }>): this {
    this._attributes['retrieved_context'] = JSON.stringify(context);
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
  setAgent(name: string, type: string, goal?: string): this {
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
  setAgentDetails(details: {
    id?: string;
    description?: string;
    role?: string;
    status?: 'running' | 'completed' | 'failed';
    steps?: number;
    maxIterations?: number;
  }): this {
    if (details.id) this._attributes['gen_ai.agent.id'] = details.id;
    if (details.description) this._attributes['gen_ai.agent.description'] = details.description;
    if (details.role) this._attributes['agent.role'] = details.role;
    if (details.status) this._attributes['agent.status'] = details.status;
    if (details.steps !== undefined) this._attributes['agent.steps'] = details.steps;
    if (details.maxIterations !== undefined) this._attributes['agent.max_iterations'] = details.maxIterations;
    return this;
  }

  /**
   * Set framework info
   */
  setFramework(framework: string, version?: string): this {
    this._attributes['framework'] = framework;
    if (version) {
      this._attributes['framework.version'] = version;
    }
    return this;
  }

  /**
   * Set crew (multi-agent) info
   */
  setCrew(crewId: string, crewName: string): this {
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
  setChain(chainType: string): this {
    this._type = 'orchestration';  // 'chain' maps to 'orchestration' SpanType
    this._attributes['chain.type'] = chainType;
    this._attributes['chain_type'] = chainType;  // Legacy support
    return this;
  }

  // ============================================
  // SERVICE/DEPLOYMENT METHODS
  // ============================================

  /**
   * Set service info
   */
  setService(name: string, version?: string, environment?: string): this {
    this._attributes['service.name'] = name;
    if (version) this._attributes['service.version'] = version;
    if (environment) this._attributes['deployment.environment'] = environment;
    return this;
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): this {
    this._attributes['user.id'] = userId;
    return this;
  }

  // ============================================
  // GENERIC ATTRIBUTE METHODS
  // ============================================

  /**
   * Set a single attribute
   */
  setAttribute(key: string, value: string | number | boolean | string[]): this {
    this._attributes[key] = value;
    return this;
  }

  /**
   * Set multiple attributes
   */
  setAttributes(attributes: SpanAttributes): this {
    Object.assign(this._attributes, attributes);
    return this;
  }

  /**
   * Set metadata (goes into metadata field, not attributes)
   */
  setMetadata(key: string, value: string | number | boolean): this {
    this._metadata[key] = value;
    return this;
  }

  /**
   * Set latency in ms
   */
  setLatency(latencyMs: number): this {
    this._attributes['latency_ms'] = latencyMs;
    return this;
  }

  // ============================================
  // EVENT METHODS
  // ============================================

  /**
   * Add a span event
   */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): this {
    this._events.push({
      name,
      timestamp: now(),
      attributes,
    });
    return this;
  }

  /**
   * Record prompt content as event
   */
  recordPrompt(content: string): this {
    return this.addEvent('gen_ai.content.prompt', { content });
  }

  /**
   * Record completion content as event
   */
  recordCompletion(content: string): this {
    return this.addEvent('gen_ai.content.completion', { content });
  }

  /**
   * Record inference operation details (full messages)
   */
  recordInferenceDetails(inputMessages: LLMMessage[], outputMessages: LLMMessage[]): this {
    return this.addEvent('gen_ai.client.inference.operation.details', {
      'gen_ai.input.messages': JSON.stringify(inputMessages),
      'gen_ai.output.messages': JSON.stringify(outputMessages),
    });
  }

  // ============================================
  // STATUS METHODS
  // ============================================

  /**
   * Set status to OK
   */
  setOk(): this {
    this._status = 'ok';
    return this;
  }

  /**
   * Set status to error
   */
  setError(message?: string): this {
    this._status = 'error';
    if (message) {
      this._statusMessage = message;
    }
    return this;
  }

  /**
   * Record an exception
   */
  recordException(error: Error): this {
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
  end(): void {
    if (this._ended) {
      console.warn(`[AMP SDK] Span ${this._spanId} already ended`);
      return;
    }
    
    this._endTime = now();
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
  toData(): SpanData {
    const data: SpanData = {
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

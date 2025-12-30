/**
 * AMP SDK Type Definitions
 * Agent Management Platform
 *
 * These types define the structure for traces, spans, and sessions.
 * Based on OTEL GenAI Semantic Conventions v1.37+ with AMP extensions.
 * 
 * OTEL GenAI Spec: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
 */

// ============================================
// SPAN TYPES - AMP Operation Categories
// ============================================

/**
 * AMP Span Types - Categories for AI/ML operations in AMP.
 * 
 * These are DIFFERENT from OTEL SpanKind!
 * 
 * - SpanKind (OTEL): INTERNAL, SERVER, CLIENT, PRODUCER, CONSUMER
 *   → Describes the role of a span in distributed tracing (who calls who)
 * 
 * - SpanType (AMP): llm, tool, rag, agent, orchestration, custom
 *   → Describes WHAT KIND of AI operation the span represents
 *   → Validated by backend processing-service ClickHouse schema
 * 
 * OTEL GenAI defines `gen_ai.operation.name` for detailed operation: chat, text_completion, embeddings
 * AMP uses SpanType for high-level categorization + gen_ai.operation.name for detail.
 * 
 * VALID TYPES (validated by backend ClickHouse Enum8):
 * - llm=1, tool=2, rag=3, orchestration=4, agent=5, custom=6
 */
export type SpanType = 
  | 'llm'           // LLM inference calls (gen_ai.operation.name: chat/text_completion/embeddings)
  | 'tool'          // Tool/function executions
  | 'rag'           // Retrieval operations (vector search, reranking, etc.)
  | 'orchestration' // Chain/workflow orchestration
  | 'agent'         // Agent lifecycle events
  | 'custom';       // Any other operation (fallback)

// ============================================
// OTEL ENUMS & OPTIONS - For User Selection
// ============================================

/**
 * OTEL Standard: gen_ai.operation.name values
 * Ref: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
 */
export type GenAIOperationName = 
  | 'chat'              // Chat completion (e.g., OpenAI chat)
  | 'text_completion'   // Text completion (e.g., GPT-3 complete)
  | 'embeddings'        // Embeddings generation
  | 'execute_tool'      // Tool/function execution
  | 'invoke_agent'      // Agent invocation
  | 'create_agent';     // Agent creation

/**
 * OTEL Standard: gen_ai.provider.name values
 * Well-known providers in OTEL spec
 */
export type GenAIProvider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'aws.bedrock'
  | 'gcp.gen_ai'
  | 'gcp.vertex_ai'
  | 'cohere'
  | 'mistral'
  | 'huggingface'
  | string; // Allow custom providers

/**
 * OTEL Standard: gen_ai.tool.type values
 * Ref: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
 */
export type GenAIToolType = 
  | 'function'    // Client-side function execution
  | 'extension'   // Server-side external API bridge
  | 'datastore';  // Data retrieval for RAG

/**
 * OTEL Standard: gen_ai.output.type values
 */
export type GenAIOutputType = 
  | 'text'
  | 'json'
  | 'image';

/**
 * OTEL Standard: gen_ai.response.finish_reason values
 */
export type FinishReason = 
  | 'stop'           // Model completed normally
  | 'length'         // Max tokens reached
  | 'tool_calls'     // Model requested tool call
  | 'content_filter' // Content was filtered
  | 'function_call'; // Legacy: function call requested

/**
 * OTEL Standard: SpanKind (for distributed tracing role)
 */
export type SpanKind = 
  | 'SPAN_KIND_INTERNAL'  // Default: internal operation
  | 'SPAN_KIND_SERVER'    // Server handling incoming request
  | 'SPAN_KIND_CLIENT'    // Client making outgoing request
  | 'SPAN_KIND_PRODUCER'  // Message producer
  | 'SPAN_KIND_CONSUMER'; // Message consumer

/**
 * Span status
 */
export type SpanStatus = 'ok' | 'error' | 'unset';

/**
 * Message roles for transcripts
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

// ============================================
// OPENINFERENCE + AMP CUSTOM ENUMS
// Based on: https://github.com/Arize-ai/openinference
// ============================================

/**
 * OpenInference: Retrieval methods for RAG
 * Similar to OpenInference retrieval span patterns
 */
export type RetrievalMethod = 
  | 'vector_search'   // Pure vector/semantic search
  | 'keyword_search'  // BM25/TF-IDF keyword search
  | 'hybrid';         // Combined vector + keyword

/**
 * OpenInference: Vector databases
 * Common vector stores used in RAG systems
 */
export type VectorDatabase = 
  | 'pinecone'
  | 'weaviate'
  | 'chroma'
  | 'qdrant'
  | 'milvus'
  | 'pgvector'
  | string; // Allow custom

/**
 * OpenInference: AI Frameworks
 * Common LLM application frameworks
 */
export type AIFramework = 
  | 'langchain'
  | 'crewai'
  | 'autogen'
  | 'kore'
  | 'llamaindex'
  | 'semantic-kernel'
  | string; // Allow custom

/**
 * OpenInference: Agent types
 * Common agent classifications
 */
export type AgentType = 
  | 'conversational'
  | 'task_orchestrator'
  | 'research'
  | 'analyst'
  | 'writer'
  | 'reviewer'
  | string; // Allow custom

/**
 * OpenInference: Tool execution status
 * Standard tool call outcomes
 */
export type ToolStatus = 
  | 'SUCCESS'
  | 'FAILURE'
  | 'TIMEOUT'
  | 'ERROR';

/**
 * OpenInference: Agent collaboration modes
 * For multi-agent systems
 */
export type CollaborationMode = 
  | 'sequential'   // Agents run one after another
  | 'parallel'     // Agents run simultaneously
  | 'hierarchical'; // Orchestrator delegates to sub-agents

// ============================================
// LLM ATTRIBUTES - OTEL GenAI Conventions
// ============================================

/**
 * LLM span attributes following OTEL GenAI Semantic Conventions v1.37+
 * 
 * Ref: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
 * 
 * All gen_ai.* attributes are OTEL STANDARD
 * Backend supports both OTEL and legacy attributes
 */
export interface LLMAttributes {
  // ============================================
  // OTEL STANDARD - Provider & Model
  // ============================================
  /** OTEL Required: Provider name - openai, anthropic, google, etc. */
  'gen_ai.provider.name'?: GenAIProvider;
  /** OTEL: System (deprecated, use provider.name) */
  'gen_ai.system'?: string;
  /** OTEL ConditionallyRequired: Requested model name */
  'gen_ai.request.model'?: string;
  /** OTEL Recommended: Actual model that responded */
  'gen_ai.response.model'?: string;
  /** OTEL Required: Operation type - chat, text_completion, embeddings, etc. */
  'gen_ai.operation.name'?: GenAIOperationName;
  
  // ============================================
  // OTEL STANDARD - Token Usage
  // ============================================
  /** OTEL Recommended: Input/prompt token count */
  'gen_ai.usage.input_tokens'?: number;
  /** OTEL Recommended: Output/completion token count */
  'gen_ai.usage.output_tokens'?: number;
  /** AMP Custom: Total token count (backend auto-calculates if missing) */
  'gen_ai.usage.total_tokens'?: number;
  
  // ============================================
  // Legacy Token Usage - Backend supports fallback
  // ============================================
  /** Legacy: Prompt tokens (prefer gen_ai.usage.input_tokens) */
  'gen_ai.usage.prompt_tokens'?: number;
  /** Legacy: Completion tokens (prefer gen_ai.usage.output_tokens) */
  'gen_ai.usage.completion_tokens'?: number;
  
  // ============================================
  // OTEL STANDARD - Request Parameters
  // ============================================
  /** OTEL Recommended: Temperature (0.0-2.0) */
  'gen_ai.request.temperature'?: number;
  /** OTEL Recommended: Top-p sampling */
  'gen_ai.request.top_p'?: number;
  /** OTEL Recommended: Top-k sampling */
  'gen_ai.request.top_k'?: number;
  /** OTEL Recommended: Maximum tokens to generate */
  'gen_ai.request.max_tokens'?: number;
  /** OTEL Recommended: Stop sequences */
  'gen_ai.request.stop_sequences'?: string[];
  /** OTEL Recommended: Frequency penalty */
  'gen_ai.request.frequency_penalty'?: number;
  /** OTEL Recommended: Presence penalty */
  'gen_ai.request.presence_penalty'?: number;
  /** OTEL ConditionallyRequired: Random seed for deterministic output */
  'gen_ai.request.seed'?: number;
  /** OTEL ConditionallyRequired: Number of choices to generate */
  'gen_ai.request.choice.count'?: number;
  
  // ============================================
  // OTEL STANDARD - Response Info
  // ============================================
  /** OTEL Recommended: Unique response identifier */
  'gen_ai.response.id'?: string;
  /** OTEL Recommended: Single finish reason (legacy) */
  'gen_ai.response.finish_reason'?: FinishReason;
  /** OTEL Recommended: Array of finish reasons for each choice */
  'gen_ai.response.finish_reasons'?: FinishReason[];
  
  // ============================================
  // OTEL STANDARD - Conversation & Output
  // ============================================
  /** OTEL ConditionallyRequired: Conversation/session identifier */
  'gen_ai.conversation.id'?: string;
  /** OTEL ConditionallyRequired: Output type - text, json, image */
  'gen_ai.output.type'?: GenAIOutputType;
  
  // ============================================
  // OTEL GENAI STANDARD - Messages (Opt-In for content capture)
  // Accepts both OTEL strict format (with parts) and simple format (with content)
  // ============================================
  /** OTEL GenAI: Input messages */
  'gen_ai.input.messages'?: string | Array<{ role: string; content?: string; parts?: Array<{ type: string; content?: string }> }>;
  /** OTEL GenAI: Output messages */
  'gen_ai.output.messages'?: string | Array<{ role: string; content?: string; parts?: Array<{ type: string; content?: string }>; finish_reason?: string }>;
  /** OTEL GenAI: System instructions/prompt */
  'gen_ai.system_instructions'?: string | Array<{ type: string; content: string }>;
  
  // ============================================
  // OPENINFERENCE STANDARD - Messages (Arize/Phoenix compatible)
  // ============================================
  /** OpenInference: Input messages (array or JSON string) */
  'llm.input_messages'?: string | Array<{ role: string; content: string; name?: string }>;
  /** OpenInference: Output messages (array or JSON string) */
  'llm.output_messages'?: string | Array<{ role: string; content: string; name?: string }>;
  /** OpenInference: System instructions */
  'llm.system_instructions'?: string;
  
  // ============================================
  // AMP CUSTOM - Cost & Cache
  // ============================================
  /** AMP Custom: Span cost in USD */
  span_cost_usd?: number;
  /** AMP Custom: Cache read tokens */
  'gen_ai.usage.cache_read_tokens'?: number;
  /** AMP Custom: Cache write tokens */
  'gen_ai.usage.cache_write_tokens'?: number;
  
  // ============================================
  // OTEL STANDARD - Service Resource Attributes
  // ============================================
  /** OTEL: Service name */
  'service.name'?: string;
  /** OTEL: Service version */
  'service.version'?: string;
  /** OTEL: Deployment environment */
  'deployment.environment'?: string;
  /** OTEL: User identifier */
  'user.id'?: string;
}

// ============================================
// TOOL ATTRIBUTES
// ============================================

/**
 * Tool/function call span attributes
 * 
 * OTEL Standard (gen_ai.tool.*):
 * - gen_ai.tool.name: Name of the tool
 * - gen_ai.tool.type: function | extension | datastore
 * - gen_ai.tool.description: Tool description
 * - gen_ai.tool.call.id: Tool call identifier
 * - gen_ai.tool.call.arguments: Parameters passed to tool (JSON)
 * - gen_ai.tool.call.result: Result returned by tool (JSON)
 * - gen_ai.tool.definitions: Array of tool definitions
 * 
 * AMP Legacy (tool.*): Supported for backwards compatibility
 */
export interface ToolAttributes {
  // ============================================
  // OTEL STANDARD - Use these for new implementations!
  // ============================================
  /** OTEL: Name of the tool utilized by the agent */
  'gen_ai.tool.name'?: string;
  /** OTEL: Type of tool - function, extension, datastore */
  'gen_ai.tool.type'?: GenAIToolType;
  /** OTEL: Tool description */
  'gen_ai.tool.description'?: string;
  /** OTEL: Tool call identifier */
  'gen_ai.tool.call.id'?: string;
  /** OTEL: Parameters passed to the tool call (JSON object/string) */
  'gen_ai.tool.call.arguments'?: string | Record<string, unknown>;
  /** OTEL: Result returned by the tool call (JSON object/string) */
  'gen_ai.tool.call.result'?: string | Record<string, unknown>;
  /** OTEL: Array of tool definitions available to model */
  'gen_ai.tool.definitions'?: Array<{
    type: string;
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  }>;
  
  // ============================================
  // AMP LEGACY - Supported for backwards compatibility
  // Backend extracts both OTEL and legacy attributes
  // ============================================
  /** Legacy: Tool name (prefer gen_ai.tool.name) */
  'tool.name'?: string;
  /** Legacy: Tool type (prefer gen_ai.tool.type) */
  'tool.type'?: string;
  /** AMP Custom: Tool execution status */
  'tool.status'?: ToolStatus;
  /** AMP Custom: Tool execution latency in ms */
  'tool.latency_ms'?: number;
  /** Legacy: Tool parameters (prefer gen_ai.tool.call.arguments) */
  'tool.parameters'?: string | Record<string, unknown>;
  /** Legacy: Tool result (prefer gen_ai.tool.call.result) */
  'tool.result'?: string | Record<string, unknown>;
  /** Legacy: Tool description (prefer gen_ai.tool.description) */
  'tool.description'?: string;
  /** AMP Custom: Error message if tool failed */
  'tool.error'?: string;
  
  // ============================================
  // Database Tool Specifics (AMP Custom)
  // ============================================
  database?: string;
  query_type?: string;
  rows_returned?: number;
  cache_hit?: boolean;
}

// ============================================
// RAG ATTRIBUTES
// ============================================

/**
 * RAG (Retrieval) span attributes
 * 
 * ⚠️ IMPORTANT: OTEL has NO semantic conventions for RAG!
 * 
 * As of December 2025, OpenTelemetry GenAI semantic conventions do NOT
 * include any RAG-specific attributes. The only OTEL attribute tangentially
 * related is `gen_ai.data_source.id` for data sources.
 * 
 * ALL RAG attributes below are AMP CUSTOM extensions, designed based on:
 * - Common observability patterns (LangSmith, W&B, etc.)
 * - Industry practices from OpenLLMetry, OpenInference
 * - Practical needs for RAG system monitoring
 * 
 * These map to ClickHouse rag_* columns in spans_normalized table.
 * 
 * OTEL may add RAG conventions in the future - monitor:
 * https://github.com/open-telemetry/semantic-conventions/issues
 */
export interface RAGAttributes {
  // ============================================
  // OTEL STANDARD - Only this one!
  // ============================================
  /** OTEL: RAG source identifier */
  'gen_ai.data_source.id'?: string;
  
  // ============================================
  // AMP CUSTOM - RAG Query
  // Maps to: rag_user_query in ClickHouse
  // ============================================
  /** AMP Custom: The user's original query that triggered retrieval */
  user_query?: string;
  /** AMP Custom: Processed search query (may differ from user_query) */
  query?: string;
  
  // ============================================
  // AMP CUSTOM - Retrieval Configuration
  // Maps to: rag_retrieval_method, etc. in ClickHouse
  // ============================================
  /** AMP Custom: Retrieval method - vector_search, keyword_search, hybrid */
  'retrieval.method'?: RetrievalMethod;
  /** AMP Custom: Also accepted */
  retrieval_method?: RetrievalMethod;
  /** AMP Custom: Number of results to retrieve */
  'retrieval.top_k'?: number;
  /** AMP Custom: Similarity threshold for vector search */
  'similarity.threshold'?: number;
  /** AMP Custom: Also accepted */
  similarity_threshold?: number;
  
  // ============================================
  // AMP CUSTOM - Retrieval Results
  // Maps to: rag_context_count, rag_context_length, etc.
  // ============================================
  /** AMP Custom: Number of documents retrieved */
  context_count?: number;
  /** AMP Custom: Total characters in retrieved context */
  context_length?: number;
  /** AMP Custom: Number of documents retrieved (alias) */
  documents_retrieved?: number;
  /** AMP Custom: JSON array of retrieved documents */
  retrieved_context?: string | Array<{ content: string; score?: number; metadata?: Record<string, unknown> }>;
  /** AMP Custom: Best similarity score achieved */
  top_score?: number;
  
  // ============================================
  // AMP CUSTOM - Vector Database
  // Maps to: rag_db_system in ClickHouse
  // ============================================
  /** AMP Custom: Vector database system */
  vector_db?: VectorDatabase;
  /** AMP Custom: Also accepted */
  'db.system'?: VectorDatabase;
  /** AMP Custom: Index/collection name */
  index_name?: string;
  /** AMP Custom: Embedding model used */
  embedding_model?: string;
  
  // ============================================
  // AMP CUSTOM - Latency
  // ============================================
  /** AMP Custom: Retrieval latency in milliseconds */
  latency_ms?: number;
}

// ============================================
// AGENT ATTRIBUTES
// ============================================

/**
 * Agent span attributes
 * 
 * OTEL Standard (gen_ai.agent.*):
 * - gen_ai.agent.id: Unique agent identifier
 * - gen_ai.agent.name: Human-readable agent name
 * - gen_ai.agent.description: Agent description
 * 
 * AMP Custom: Additional agent tracking for multi-agent systems
 */
export interface AgentAttributes {
  // ============================================
  // OTEL STANDARD - Use these for new implementations!
  // ============================================
  /** OTEL: Unique identifier of the GenAI agent */
  'gen_ai.agent.id'?: string;
  /** OTEL: Human-readable name of the GenAI agent */
  'gen_ai.agent.name'?: string;
  /** OTEL: Free-form description of the GenAI agent */
  'gen_ai.agent.description'?: string;
  
  // ============================================
  // OPENINFERENCE LEGACY - Supported for backwards compatibility
  // Based on: https://github.com/Arize-ai/openinference
  // Backend extracts both OTEL and OpenInference attributes
  // ============================================
  /** OpenInference: Agent ID (prefer gen_ai.agent.id for OTEL) */
  'agent.id'?: string;
  /** OpenInference: Agent name (also agent.name in OpenInference spec) */
  'agent.name'?: string;
  /** OpenInference: Agent description */
  'agent.description'?: string;
  
  // ============================================
  // OPENINFERENCE - Agent Configuration
  // ============================================
  /** OpenInference: Agent type classification */
  'agent.type'?: AgentType;
  /** OpenInference: Agent role (researcher, writer, reviewer, coordinator) */
  'agent.role'?: string;
  /** OpenInference: Agent's current task description */
  'agent.task'?: string;
  /** OpenInference: Current iteration/step count */
  'agent.iterations'?: number;
  /** OpenInference: Maximum iterations allowed */
  'agent.max_iterations'?: number;
  
  // ============================================
  // OPENINFERENCE - Framework Information
  // ============================================
  /** OpenInference: Framework name - langchain, crewai, autogen */
  framework?: AIFramework;
  /** OpenInference: Framework version */
  'framework.version'?: string;
  
  // ============================================
  // OPENINFERENCE - Multi-Agent / Crew (CrewAI)
  // ============================================
  /** OpenInference/CrewAI: Crew/team identifier */
  'crew.id'?: string;
  /** OpenInference/CrewAI: Crew/team name */
  'crew.name'?: string;
  /** OpenInference: Agent team identifier */
  'agent.team_id'?: string;
  /** OpenInference: Orchestrator agent ID */
  'agent.orchestrator_id'?: string;
  /** OpenInference: Collaboration mode - sequential, parallel, hierarchical */
  'agent.collaboration_mode'?: CollaborationMode;
  /** OpenInference: Flag for multi-agent systems */
  is_multi_agent?: boolean;
}

// ============================================
// CUSTOM/EXTENSION ATTRIBUTES
// ============================================

/**
 * Custom attributes for AMP-specific extensions.
 * 
 * NOTE: These are NOT OTEL standard! OTEL GenAI semantic conventions
 * do NOT define evaluation/guardrails attributes.
 * 
 * In OTEL, evaluation results should be captured as:
 * - Span events (addEvent)
 * - Custom attributes with your own namespace
 * - Separate spans with appropriate names
 * 
 * AMP may process these internally, but they're not sent by SDK users.
 */
export interface CustomAttributes {
  // General latency tracking
  latency_ms?: number;
  
  // Custom extension attributes (use your own namespace)
  // e.g., 'mycompany.evaluation.score': 0.95
  [key: string]: string | number | boolean | string[] | undefined;
}

// ============================================
// CHAIN/ORCHESTRATION ATTRIBUTES
// ============================================

/**
 * Chain/orchestration span attributes
 * 
 * NOTE: These are AMP custom extensions, NOT OTEL standard.
 * Maps to orchestration_* columns in ClickHouse.
 */
export interface ChainAttributes {
  // ============================================
  // AMP CUSTOM - Chain Configuration
  // Maps to: orchestration_chain_type, etc.
  // ============================================
  /** AMP Custom: Chain type - ConversationalRetrievalChain, AgentExecutor, etc. */
  'chain.type'?: string;
  /** AMP Custom: Also accepted */
  chain_type?: string;
  /** AMP Custom: Total steps in chain */
  'chain.total_steps'?: number;
  /** AMP Custom: Current execution order */
  'chain.execution_order'?: number;
  
  // ============================================
  // AMP CUSTOM - Framework Information
  // ============================================
  /** AMP Custom: Framework name */
  framework?: AIFramework;
  /** AMP Custom: Framework version */
  'framework.version'?: string;
  
  // ============================================
  // AMP CUSTOM - LangSmith Integration
  // ============================================
  /** AMP Custom: LangSmith run ID */
  'langsmith.run_id'?: string;
  /** AMP Custom: LangSmith run type */
  'langsmith.run_type'?: string;
  /** AMP Custom: LangSmith project name */
  'langsmith.project'?: string;
  
  // ============================================
  // OTEL STANDARD - Service
  // ============================================
  /** OTEL: Service name */
  'service.name'?: string;
}

// ============================================
// COMBINED ATTRIBUTES
// ============================================

/**
 * Combined span attributes (union of all supported types)
 * 
 * These follow OTEL GenAI semantic conventions where applicable.
 */
export type SpanAttributes = 
  & LLMAttributes 
  & ToolAttributes 
  & RAGAttributes 
  & AgentAttributes 
  & ChainAttributes
  & CustomAttributes;

// ============================================
// SPAN EVENT
// ============================================

/**
 * Span event (e.g., prompt, completion, error)
 */
export interface SpanEvent {
  /** Event name: gen_ai.content.prompt, gen_ai.content.completion, etc. */
  name: string;
  /** Event timestamp (ISO 8601) */
  timestamp: string;
  /** Event attributes */
  attributes?: Record<string, string | number | boolean | unknown[] | Record<string, unknown>>;
}

// ============================================
// SPAN
// ============================================

/**
 * Span data structure (what gets sent to API)
 */
export interface SpanData {
  span_id: string;
  trace_id: string;
  parent_span_id?: string | null;
  name: string;
  type: SpanType;
  start_time: string;
  end_time?: string;
  status: SpanStatus;
  status_message?: string;
  attributes: SpanAttributes;
  metadata?: Record<string, string | number | boolean>;
  events?: SpanEvent[];
}

// ============================================
// TRACE
// ============================================

/**
 * Trace data structure (what gets sent to API)
 */
export interface TraceData {
  trace_id: string;
  trace_name: string; // Human-readable name for the trace
  session_id: string;
  start_time: string;
  end_time?: string;
  status: SpanStatus;
  spans: SpanData[];
  metadata?: Record<string, string | number | boolean>;
}

// ============================================
// TRANSCRIPT
// ============================================

/**
 * Message in a transcript
 */
export interface Message {
  role: MessageRole;
  content: string;
  timestamp?: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Transcript data structure
 */
export interface TranscriptData {
  session_id: string;
  conversation_id: string;
  conversation_turn: number;
  messages: Message[];
  metadata?: Record<string, string | number | boolean>;
}

// ============================================
// API TYPES
// ============================================

/**
 * Telemetry payload sent to API
 */
export interface TelemetryPayload {
  accountId?: string;
  traces?: TraceData[];
  transcripts?: TranscriptData[];
}

/**
 * API response
 */
export interface TelemetryResponse {
  status: 'accepted' | 'partial' | 'failed';
  message?: string;
  timestamp: string;
  accepted: {
    traces: number;
    transcripts: number;
  };
  rejected: {
    traces: number;
    transcripts: number;
  };
  stored: {
    records: number;
    queued: number;
    clickhouse?: number;
    kafka?: number;
  };
  duration: number;
  batchId?: string;
}

// ============================================
// SDK CONFIGURATION
// ============================================

/**
 * AMP SDK configuration options
 */
export interface AMPConfig {
  /** API key (required) */
  apiKey: string;
  /** Base URL (default: https://amp.kore.ai) */
  baseURL?: string;
  /** Ingestion endpoint path (default: /ingestion/api/v1/telemetry) */
  ingestEndpoint?: string;
  /** Account ID (optional) */
  accountId?: string;
  /** Project ID (optional) */
  projectId?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Batch size before auto-flush (default: 100) */
  batchSize?: number;
  /** Batch timeout in ms (default: 5000) */
  batchTimeout?: number;
  /** Max retries for failed requests (default: 3) */
  maxRetries?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Disable auto-flush on process exit */
  disableAutoFlush?: boolean;
  /** Print traces to console before sending */
  printTraces?: boolean;
}

/**
 * Trace creation options
 */
export interface TraceOptions {
  /** Custom trace ID (auto-generated if not provided) */
  traceId?: string;
  /** Session ID (auto-generated if not provided) */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Span creation options
 */
export interface SpanOptions {
  /** Custom span ID (auto-generated if not provided) */
  spanId?: string;
  /** Parent span ID for nested spans */
  parentSpanId?: string;
  /** Span type */
  type?: SpanType;
  /** Initial attributes */
  attributes?: SpanAttributes;
  /** Initial metadata */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Session for multi-turn conversations
 */
export interface SessionOptions {
  /** Custom session ID (auto-generated if not provided) */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, string | number | boolean>;
}

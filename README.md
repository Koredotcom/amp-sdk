# AMP SDK

**Agent Management Platform** - Production-ready TypeScript SDK for AI observability, governance, and analytics.

[![npm version](https://img.shields.io/npm/v/@amp/sdk)](https://www.npmjs.com/package/@amp/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Core Concepts](#core-concepts)
- [Examples](#examples)
- [API Reference](#api-reference)
- [Advanced Topics](#advanced-topics)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Introduction

### What is AMP?

**Agent Management Platform (AMP)** is a comprehensive observability and governance platform for AI agents and LLM applications. AMP provides real-time insights, policy enforcement, cost tracking, and performance analytics for your entire AI stack.

### Key Capabilities

- **Observability** - Real-time trace streaming, session tracking, and performance metrics
- **Governance** - Policy enforcement, guardrails, and compliance monitoring
- **Analytics** - Cost tracking, token usage, latency analysis, and custom dashboards
- **Intelligence** - Automated evaluation, bias detection, toxicity scoring, and quality metrics

### How It Works

AMP SDK is built on **OpenTelemetry (OTEL) GenAI Semantic Conventions**, ensuring compatibility with industry standards:

1. **Ingests** traces in OTEL format
2. **Normalizes** data according to OTEL GenAI conventions (v1.37+)
3. **Enriches** traces with intelligence metrics (bias, toxicity, completeness)
4. **Stores** data in optimized time-series databases
5. **Streams** updates to the AMP dashboard for live monitoring

### Supported Trace Types

| Type | Description | Use Case |
|------|-------------|----------|
| **LLM** | Language model inference | Chat completions, text generation, embeddings |
| **Tool** | Function/tool execution | API calls, database queries, external services |
| **RAG** | Retrieval-augmented generation | Vector search, document retrieval, context injection |
| **Agent** | Agent lifecycle events | Agent creation, task execution, decision points |
| **Orchestration** | Chain/workflow execution | Multi-step pipelines, LangChain, CrewAI workflows |
| **Custom** | Any other operation | Custom business logic, integrations |

---

## Installation

### Prerequisites

- **Node.js** 18+ or **Python** 3.9+
- An AMP account and API key

**Getting Your API Key**:
1. Go to [https://dev-amp.kore.ai/](https://dev-amp.kore.ai/) (production URL will be updated later)
2. Sign up or log in to your account
3. Create a new project or select an existing one
4. Navigate to **Settings** → **API Keys**
5. Click **Create API Key** and copy it
6. Your API key format: `sk-amp-{accountId}-{randomString}`

### TypeScript/JavaScript

```bash
# npm
npm install @amp/sdk

# yarn
yarn add @amp/sdk

# pnpm
pnpm add @amp/sdk
```

### Python

```bash
# Coming soon
pip install amp-sdk
```

### Verify Installation

```typescript
import { AMP } from '@amp/sdk';

const amp = new AMP({
  apiKey: 'sk-amp-xxxxxx',
});

console.log('AMP SDK initialized successfully!');
```

---

## Quick Start

### 3-Line Integration

```typescript
import { AMP } from '@amp/sdk';

const amp = new AMP({ apiKey: process.env.AMP_API_KEY });
const trace = amp.trace('user-query');
const span = trace.startLLMSpan('chat-completion', 'openai', 'gpt-4');
span.setTokens(150, 75);
span.end();
trace.end();
await amp.flush();
```

### What Happens Behind the Scenes

1. **SDK Initialization** - Creates a client with your API key
2. **Trace Creation** - Generates unique `trace_id` and `session_id`
3. **Span Recording** - Captures LLM call metadata (tokens, model, latency)
4. **Automatic Batching** - Queues traces for efficient batch sending
5. **Ingestion** - Sends to AMP ingestion service
6. **Processing** - AMP normalizes, enriches, and stores your data
7. **Dashboard** - Traces appear in real-time in the AMP UI

### Next Steps

- [Configure the SDK](#configuration) for your environment
- [Explore Examples](#examples) for different use cases
- [View Your Traces](https://dev-amp.kore.ai/dashboard) in the AMP dashboard

---

## Configuration

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `apiKey` | `string` | Your AMP API key | `'sk-amp-xxxxxx'` |

### Optional Parameters

#### Environment

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `baseURL` | `string` | `'https://dev-amp.kore.ai'` | AMP API endpoint (production URL will be updated) |
| `accountId` | `string` | Auto-extracted | Account ID (from API key) |
| `projectId` | `string` | Auto-extracted | Project ID (from API key) |

#### Batching

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `batchSize` | `number` | `100` | Traces per batch |
| `batchTimeout` | `number` | `5000` | Auto-flush timeout (ms) |

#### Networking

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxRetries` | `number` | `3` | Retry attempts on failure |
| `timeout` | `number` | `30000` | Request timeout (ms) |

#### Debugging

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `debug` | `boolean` | `false` | Enable console logging |
| `printTraces` | `boolean` | `false` | Print trace JSON before sending |

### Configuration Examples

#### Local Development

```typescript
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY!,
  debug: true,                        // Enable debug logs
  batchSize: 10,                      // Smaller batches for testing
});
```

#### Production

```typescript
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY!,
  baseURL: 'https://dev-amp.kore.ai',  // Production URL will be updated later
  batchSize: 100,                      // Larger batches for efficiency
  maxRetries: 5,                       // More retries for reliability
});
```

#### Environment Variables

```bash
# .env
AMP_API_KEY=sk-amp-xxxxxx
AMP_BASE_URL=https://dev-amp.kore.ai  # Production URL will be updated later
AMP_BATCH_SIZE=100
AMP_DEBUG=false
```

```typescript
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY!,
  baseURL: process.env.AMP_BASE_URL,
  batchSize: parseInt(process.env.AMP_BATCH_SIZE || '100'),
  debug: process.env.AMP_DEBUG === 'true',
});
```

---

## Core Concepts

### Traces, Spans, and Sessions

- **Trace** - A single operation (e.g., "user query", "RAG pipeline")
- **Span** - A unit of work within a trace (e.g., "LLM call", "vector search")
- **Session** - A group of related traces (e.g., multi-turn conversation)

### OpenTelemetry Compliance

AMP SDK follows [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/):

- ✅ Standard attribute names (`gen_ai.usage.input_tokens`, `gen_ai.tool.name`)
- ✅ Standard span kinds (`INTERNAL`, `CLIENT`, `SERVER`)
- ✅ Standard event types (`gen_ai.operation`, `gen_ai.response`)
- ✅ Standard error handling and status codes

### Supported Span Types

| Type | OTEL Standard | Description |
|------|---------------|-------------|
| `llm` | ✅ | LLM inference calls |
| `tool` | ✅ | Tool/function execution |
| `rag` | ✅ (OpenInference) | Retrieval operations |
| `agent` | ✅ | Agent lifecycle |
| `orchestration` | ✅ | Chain/workflow |
| `custom` | ✅ | Any other operation |

---

## Supported Attributes & OTEL Mapping

The SDK supports OpenTelemetry GenAI Semantic Conventions along with industry-standard extensions. Below is a comprehensive list of all supported attributes categorized by span type.

### Common Attributes (All Spans)

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `setAttribute(key, value)` | Custom attributes | Any | Add custom metadata to any span |
| `addEvent(name, attrs)` | Events | Object | Add timeline events to span |
| Auto-set | `span.name` | String | Span name (auto-set by SDK) |
| Auto-set | `span.kind` | String | Span kind: INTERNAL, CLIENT, SERVER |
| Auto-set | `span.status` | Object | Span status: OK, ERROR |

### LLM Span Attributes

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `setTokens(input, output)` | `gen_ai.usage.input_tokens` | Number | Input token count |
| `setTokens(input, output)` | `gen_ai.usage.output_tokens` | Number | Output token count |
| `startLLMSpan(name, provider, model)` | `gen_ai.system` | String | LLM provider (openai, anthropic, etc.) |
| `startLLMSpan(name, provider, model)` | `gen_ai.request.model` | String | Model name (gpt-4, claude-3, etc.) |
| `setOperation(op)` | `gen_ai.operation.name` | String | Operation: chat, text_completion, embeddings |
| `setLLMInputMessages(msgs)` | `gen_ai.prompt` | Array | Input messages (user, system, assistant) |
| `setLLMOutputMessages(msgs)` | `gen_ai.completion` | Array | Output messages (assistant responses) |
| `setLLMResponse(reason, id)` | `gen_ai.response.finish_reason` | String | stop, length, content_filter, tool_calls |
| `setLLMResponse(reason, id)` | `gen_ai.response.id` | String | Response/completion ID |
| `setAttribute('gen_ai.request.temperature', val)` | `gen_ai.request.temperature` | Number | Temperature parameter (0-2) |
| `setAttribute('gen_ai.request.top_p', val)` | `gen_ai.request.top_p` | Number | Top-p sampling parameter |
| `setAttribute('gen_ai.request.max_tokens', val)` | `gen_ai.request.max_tokens` | Number | Maximum tokens to generate |
| `setAttribute('gen_ai.request.frequency_penalty', val)` | `gen_ai.request.frequency_penalty` | Number | Frequency penalty |
| `setAttribute('gen_ai.request.presence_penalty', val)` | `gen_ai.request.presence_penalty` | Number | Presence penalty |

### Tool Span Attributes

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `startToolSpan(name, toolName)` | `gen_ai.tool.name` | String | Name of the tool/function |
| `setToolType(type)` | `gen_ai.tool.type` | String | function, extension, datastore, api |
| `setToolParameters(params)` | `tool_input` | Object | Tool input parameters |
| `setToolResult(result)` | `tool_output` | Object | Tool execution result |
| `setToolStatus(status, latency)` | `tool_status` | String | success, error, timeout |
| `setToolStatus(status, latency)` | `tool_duration_ms` | Number | Execution time in milliseconds |
| `setAttribute('tool_description', val)` | `tool_description` | String | Tool purpose/description |

### RAG Span Attributes

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `startRAGSpan(name, db, method)` | `db.system` | String | Vector DB: pinecone, weaviate, chromadb |
| `startRAGSpan(name, db, method)` | `retrieval.method` | String | vector_search, keyword_search, hybrid |
| `setUserQuery(query)` | `user_query` | String | User's search query |
| `setRetrievedContext(docs)` | `retrieved_context` | Array | Retrieved documents with scores |
| `setAttribute('retrieval.top_k', val)` | `retrieval.top_k` | Number | Number of results requested |
| `setAttribute('context_count', val)` | `context_count` | Number | Actual documents retrieved |
| `setAttribute('retrieval_latency_ms', val)` | `retrieval_latency_ms` | Number | Retrieval time in milliseconds |
| `setAttribute('relevance_scores', val)` | `relevance_scores` | Array | Similarity/relevance scores |
| `setAttribute('db.collection', val)` | `db.collection` | String | Collection/index name |
| `setAttribute('db.operation', val)` | `db.operation` | String | query, insert, update, delete |

### Agent Span Attributes

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `startAgentSpan(name, agentName, type, goal)` | `agent.name` | String | Agent identifier |
| `startAgentSpan(name, agentName, type, goal)` | `agent.type` | String | researcher, writer, reviewer, executor |
| `startAgentSpan(name, agentName, type, goal)` | `agent.goal` | String | Agent's objective/task |
| `setAttribute('agent.role', val)` | `agent.role` | String | Agent role in workflow |
| `setAttribute('agent.task', val)` | `agent.task` | String | Current task description |
| `setAttribute('agent.status', val)` | `agent.status` | String | running, completed, failed, waiting |
| `setAttribute('agent.iterations', val)` | `agent.iterations` | Number | Number of reasoning iterations |
| `setAttribute('agent.decision', val)` | `agent.decision` | String | Decision made by agent |
| `setFramework(name, version)` | `framework.name` | String | langchain, autogen, crewai |
| `setFramework(name, version)` | `framework.version` | String | Framework version |

### Orchestration Span Attributes

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `setChain(chainType)` | `chain.type` | String | sequential, parallel, map_reduce, router |
| `setAttribute('chain.total_steps', val)` | `chain.total_steps` | Number | Total steps in workflow |
| `setAttribute('chain.current_step', val)` | `chain.current_step` | Number | Current step being executed |
| `setAttribute('is_multi_agent', val)` | `is_multi_agent` | Boolean | Whether workflow uses multiple agents |
| `setAttribute('crew.name', val)` | `crew.name` | String | Multi-agent crew identifier |
| `setAttribute('workflow.status', val)` | `workflow.status` | String | pending, running, completed, failed |
| `setFramework(name, version)` | `framework.name` | String | Framework orchestrating workflow |
| `setFramework(name, version)` | `framework.version` | String | Framework version |

### Session Attributes

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `session({ sessionId, userId, metadata })` | `session.id` | String | Session identifier (auto-generated) |
| `session({ sessionId, userId, metadata })` | `user.id` | String | User identifier |
| `session({ sessionId, userId, metadata })` | `session.metadata` | Object | Session-level metadata |
| `trace(name, { metadata })` | `trace.metadata` | Object | Trace-level metadata |

### Custom & Extended Attributes

You can add any custom attributes using the `setAttribute()` method. We recommend following these naming conventions:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `custom.*` | Business-specific attributes | `custom.tenant_id`, `custom.region` |
| `user.*` | User-related attributes | `user.subscription_tier`, `user.locale` |
| `app.*` | Application attributes | `app.version`, `app.environment` |
| `feature.*` | Feature flags | `feature.new_ui_enabled` |
| `cost.*` | Cost tracking | `cost.estimated_usd`, `cost.token_cost` |

### OTEL Compliance Reference

All standard OTEL attributes are automatically supported. For the complete specification, see:
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [OpenInference Specification](https://github.com/Arize-ai/openinference)

---

## Examples

### Example 1: Simple LLM Chat

```typescript
import { AMP } from '@amp/sdk';

const amp = new AMP({ apiKey: process.env.AMP_API_KEY! });

async function handleUserQuery(userMessage: string) {
  const trace = amp.trace('chat-completion');
  const span = trace.startLLMSpan('OpenAI Chat', 'openai', 'gpt-4-turbo');

  // Your LLM call here
  const response = await callOpenAI(userMessage);

  span
    .setTokens(response.usage.prompt_tokens, response.usage.completion_tokens)
    .setOperation('chat')
    .setLLMInputMessages([{ role: 'user', content: userMessage }])
    .setLLMOutputMessages([{ role: 'assistant', content: response.content }])
    .setLLMResponse('stop', response.id);

  span.end();
  trace.end();
  await amp.flush();

  return response;
}
```

### Example 2: RAG Pipeline

```typescript
async function ragPipeline(userQuery: string) {
  const trace = amp.trace('rag-pipeline');

  // Step 1: Vector Search
  const retrievalSpan = trace.startRAGSpan('Vector Search', 'pinecone', 'vector_search');
  const documents = await vectorSearch(userQuery);

  retrievalSpan
    .setUserQuery(userQuery)
    .setRetrievedContext(documents)
    .setAttribute('retrieval.top_k', 5)
    .setAttribute('context_count', documents.length);
  retrievalSpan.end();

  // Step 2: LLM with Context
  const llmSpan = trace.startLLMSpan('LLM with Context', 'openai', 'gpt-4');
  const answer = await callLLM(userQuery, documents);

  llmSpan
    .setTokens(answer.inputTokens, answer.outputTokens)
    .setLLMInputMessages([
      { role: 'system', content: 'Answer using the provided context.' },
      { role: 'user', content: userQuery },
    ])
    .setLLMOutputMessages([{ role: 'assistant', content: answer.text }]);
  llmSpan.end();

  trace.end();
  await amp.flush();
}
```

### Example 3: Tool Execution

```typescript
async function executeTool(toolName: string, parameters: any) {
  const trace = amp.trace('tool-execution');
  const span = trace.startToolSpan(toolName, toolName);

  const startTime = Date.now();
  try {
    const result = await callTool(toolName, parameters);
    const latency = Date.now() - startTime;

    span
      .setToolType('function')
      .setToolParameters(parameters)
      .setToolResult(result)
      .setToolStatus('success', latency);
  } catch (error) {
    span
      .setToolStatus('error', Date.now() - startTime)
      .setAttribute('error.message', error.message);
  }

  span.end();
  trace.end();
  await amp.flush();
}
```

### Example 4: Multi-Agent Workflow

```typescript
async function multiAgentWorkflow(task: string) {
  const trace = amp.trace('crew-workflow');

  // Orchestrator
  const orchSpan = trace.startSpan('Content Crew', { type: 'orchestration' });
  orchSpan
    .setChain('CrewAI')
    .setFramework('crewai', '0.30.0')
    .setAttribute('chain.total_steps', 3)
    .setAttribute('is_multi_agent', true);

  // Writer Agent
  const writerSpan = trace.startAgentSpan('Writer', 'WriterBot', 'writer', 'Write blog post');
  writerSpan.setAttribute('agent.role', 'writer');
  await writerAgent.execute(task);
  writerSpan.end();

  // Editor Agent
  const editorSpan = trace.startAgentSpan('Editor', 'EditorBot', 'editor', 'Review and polish');
  editorSpan.setAttribute('agent.role', 'editor');
  await editorAgent.execute(task);
  editorSpan.end();

  orchSpan.end();
  trace.end();
  await amp.flush();
}
```

### Example 5: Session Management (Multi-Turn)

```typescript
// Create a session for a conversation
const session = amp.session({
  sessionId: `user-${userId}-${Date.now()}`,
  userId: userId,
  metadata: { channel: 'web', language: 'en' },
});

// Turn 1
const trace1 = session.trace('turn-1');
const span1 = trace1.startLLMSpan('chat', 'openai', 'gpt-4');
// ... set messages, tokens
span1.end();
trace1.end();

// Turn 2 (same session)
const trace2 = session.trace('turn-2');
const span2 = trace2.startLLMSpan('chat', 'openai', 'gpt-4');
// ... set messages, tokens
span2.end();
trace2.end();

// All traces are automatically grouped by sessionId
await amp.flush();
```

---

## API Reference

### AMP Client

#### `new AMP(config: AMPConfig)`

Creates a new AMP SDK client.

```typescript
const amp = new AMP({
  apiKey: 'sk-amp-xxxxxx',
  baseURL: 'https://dev-amp.kore.ai',
});
```

#### `amp.trace(name: string, options?: TraceOptions): Trace`

Creates a new trace.

```typescript
const trace = amp.trace('operation-name', {
  sessionId: 'session-123',
  traceId: 'custom-trace-id',
  metadata: { user_id: 'u123' },
});
```

#### `amp.session(options: SessionOptions): Session`

Creates a session for grouping related traces.

```typescript
const session = amp.session({
  sessionId: 'session-123',
  userId: 'user-456',
  metadata: { channel: 'web' },
});
```

#### `amp.flush(): Promise<void>`

Manually flush queued traces to AMP.

```typescript
await amp.flush();
```

#### `amp.shutdown(): Promise<void>`

Gracefully shutdown the SDK (auto-flushes).

```typescript
await amp.shutdown();
```

#### `amp.queueSize: number`

Get current queue size.

```typescript
console.log(`Queued traces: ${amp.queueSize}`);
```

### Trace Methods

#### `trace.startLLMSpan(name: string, provider: string, model: string): Span`

Create an LLM span for language model calls.

#### `trace.startToolSpan(name: string, toolName: string): Span`

Create a tool span for function/tool execution.

#### `trace.startRAGSpan(name: string, dbSystem: string, method: string): Span`

Create a RAG span for retrieval operations.

#### `trace.startAgentSpan(name: string, agentName: string, agentType: string, goal?: string): Span`

Create an agent span for agent lifecycle events.

#### `trace.startSpan(name: string, options?: SpanOptions): Span`

Create a custom span.

#### `trace.end(): void`

End the trace.

### Span Methods

#### `span.setTokens(inputTokens: number, outputTokens: number): this`

Set token counts for LLM spans.

#### `span.setOperation(operation: string): this`

Set operation type (`chat`, `text_completion`, `embeddings`).

#### `span.setLLMInputMessages(messages: Message[]): this`

Set LLM input messages.

#### `span.setLLMOutputMessages(messages: Message[]): this`

Set LLM output messages.

#### `span.setLLMResponse(finishReason: string, responseId: string): this`

Set LLM response metadata.

#### `span.setToolType(type: string): this`

Set tool type (`function`, `extension`, `datastore`).

#### `span.setToolParameters(params: any): this`

Set tool input parameters.

#### `span.setToolResult(result: any): this`

Set tool output result.

#### `span.setToolStatus(status: string, latencyMs?: number): this`

Set tool execution status and latency.

#### `span.setUserQuery(query: string): this`

Set user query for RAG spans.

#### `span.setRetrievalMethod(method: string): this`

Set retrieval method (`vector_search`, `keyword_search`, `hybrid`).

#### `span.setRetrievedContext(context: any): this`

Set retrieved documents/context.

#### `span.setAgent(agentName: string, agentType: string): this`

Set agent information.

#### `span.setChain(chainType: string): this`

Set chain/workflow type.

#### `span.setFramework(name: string, version?: string): this`

Set framework information (e.g., `langchain`, `crewai`).

#### `span.setAttribute(key: string, value: any): this`

Set custom attribute.

#### `span.addEvent(name: string, attributes?: Record<string, any>): this`

Add event to span timeline.

#### `span.end(): void`

End the span.

---

## Advanced Topics

### Batching and Performance

The SDK automatically batches traces for efficient sending:

```typescript
const amp = new AMP({
  apiKey: 'sk-amp-xxxxxx',
  batchSize: 100,        // Send 100 traces per batch
  batchTimeout: 5000,    // Auto-flush after 5 seconds
});
```

### Custom Attributes

Add custom metadata to spans using OTEL conventions:

```typescript
span
  .setAttribute('custom.business_unit', 'sales')
  .setAttribute('custom.feature_flag', 'v2_enabled')
  .setAttribute('custom.user_tier', 'premium');
```

### Error Handling

```typescript
try {
  const trace = amp.trace('operation');
  const span = trace.startLLMSpan('llm', 'openai', 'gpt-4');

  // Your logic here

  span.end();
  trace.end();
} catch (error) {
  console.error('Trace failed:', error);
  // Traces are queued, so errors don't block your application
}
```

### Framework Adapters

Coming soon: Pre-built integrations for popular frameworks.

- LangChain
- CrewAI
- AutoGen
- LlamaIndex
- Semantic Kernel

---

## Troubleshooting

### Connection Errors

**Error**: `connect ECONNREFUSED`

**Solution**: Verify `baseURL` is correct and the AMP service is accessible.

```typescript
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY!,
  baseURL: 'https://dev-amp.kore.ai',
  debug: true,                          // Enable debug logs
});
```

### Invalid API Key

**Error**: `Unauthorized - Invalid API key`

**Solution**: Verify your API key format and permissions.

- Format: `sk-amp-{accountId}-{randomString}`
- Check [amp.kore.ai/settings](https://amp.kore.ai/settings) for valid keys

### Traces Not Appearing in Dashboard

1. **Enable debug mode**:
   ```typescript
   const amp = new AMP({ apiKey: '...', debug: true });
   ```

2. **Verify flush**:
   ```typescript
   await amp.flush();  // Explicitly flush traces
   ```

3. **Check queue size**:
   ```typescript
   console.log(`Queued: ${amp.queueSize}`);
   ```

4. **Verify API key permissions** in the AMP dashboard

### High Memory Usage

**Solution**: Reduce `batchSize` or call `amp.flush()` more frequently.

```typescript
const amp = new AMP({
  apiKey: '...',
  batchSize: 50,      // Reduce from default 100
  batchTimeout: 3000, // Flush more frequently
});
```

---

## Support

- **Dashboard**: [https://dev-amp.kore.ai](https://dev-amp.kore.ai) (production URL will be updated later)
- **Documentation**: [https://docs.amp.kore.ai](https://docs.amp.kore.ai)
- **Support Email**: [support@kore.ai](mailto:support@kore.ai)
- **GitHub Issues**: [https://github.com/Koredotcom/amp-sdk/issues](https://github.com/Koredotcom/amp-sdk/issues)

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Kore.ai**

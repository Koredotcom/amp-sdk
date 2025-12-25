# AMP SDK

**Agent Management Platform** - SDK for telemetry ingestion from AI/LLM applications.

> **Note:** AMP is the user-facing product name. Internal codename is "ACP" (Agent Control Plane).

---

## Quick Start

```typescript
import { AMP } from '@amp/sdk';

const amp = new AMP({
  apiKey: 'sk-acp-xxxxxx',            // Required: Your API key
  baseURL: 'http://localhost:3004',    // Required: Ingestion service URL
});

// Create a trace for an LLM call
const trace = amp.trace('user-query');
const span = trace.startLLMSpan('chat-completion', 'openai', 'gpt-4');
span.setTokens(150, 75);
span.setLLMInputMessages([{ role: 'user', content: 'Hello!' }]);
span.setLLMOutputMessages([{ role: 'assistant', content: 'Hi there!' }]);
span.end();
trace.end();

// Flush and shutdown
await amp.flush();
await amp.shutdown();
```

---

## Installation

```bash
# From local (for development)
cd sdk/packages/core
npm install
npm run build
```

---

## Configuration

```typescript
const amp = new AMP({
  // ===== REQUIRED =====
  apiKey: string;              // API key (e.g., 'sk-acp-xxxxxx')
  
  // ===== OPTIONAL =====
  baseURL?: string;            // Default: 'https://api.amp.kore.ai'
  accountId?: string;          // Account ID (extracted from API key if not set)
  projectId?: string;          // Project ID (extracted from API key if not set)
  
  // Batching
  batchSize?: number;          // Default: 100 traces per batch
  batchTimeout?: number;       // Default: 5000ms before auto-flush
  
  // Networking
  maxRetries?: number;         // Default: 3 retry attempts
  timeout?: number;            // Default: 30000ms request timeout
  
  // Debug
  debug?: boolean;             // Default: false (enable console logs)
  printTraces?: boolean;       // Print trace JSON before sending
  disableAutoFlush?: boolean;  // Disable auto-flush on process exit
});
```

### Environment Examples

```typescript
// Local development
const amp = new AMP({
  apiKey: 'sk-acp-xxxxxx',
  baseURL: 'http://localhost:3004',
  debug: true,
});

// Production
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY!,
  baseURL: 'https://api.amp.kore.ai',
});
```

---

## Span Types

The SDK supports these span types (validated by backend):

| Type | Description | Key Methods |
|------|-------------|-------------|
| `llm` | LLM inference calls | `startLLMSpan()`, `setTokens()`, `setLLMInputMessages()` |
| `tool` | Tool/function execution | `startToolSpan()`, `setToolParameters()`, `setToolResult()` |
| `rag` | Retrieval/vector search | `startRAGSpan()`, `setUserQuery()`, `setRetrievedContext()` |
| `agent` | Agent lifecycle | `startAgentSpan()`, `setAgent()` |
| `orchestration` | Chain/workflow | `setChain()` |
| `custom` | Any other operation | `startSpan({ type: 'custom' })` |

---

## API Reference

### Creating Traces

```typescript
// Basic trace
const trace = amp.trace('operation-name');

// With session (for multi-turn conversations)
const trace = amp.trace('operation-name', {
  sessionId: 'session-123',    // Groups related traces
  traceId: 'custom-trace-id',  // Optional custom ID
  metadata: { user_id: 'u123' },
});
```

### LLM Spans

```typescript
const trace = amp.trace('chat-completion');
const span = trace.startLLMSpan('OpenAI Chat', 'openai', 'gpt-4-turbo');

span
  .setTokens(256, 128)                              // input, output tokens
  .setOperation('chat')                             // chat, text_completion, embeddings
  .setAttribute('gen_ai.request.temperature', 0.7)
  .setLLMInputMessages([
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'What is AI?' }
  ])
  .setLLMOutputMessages([
    { role: 'assistant', content: 'AI is...' }
  ])
  .setLLMResponse('stop', 'chatcmpl-123');          // finish_reason, response_id

span.end();
trace.end();
```

### Tool Spans

```typescript
const trace = amp.trace('tool-execution');
const span = trace.startToolSpan('Web Search', 'google_search');

span
  .setToolType('function')
  .setToolParameters({ query: 'AI news', limit: 5 })
  .setToolResult({ results: ['...'] })
  .setToolStatus('success', 342);   // status, latency_ms

span.end();
trace.end();
```

### RAG Spans

```typescript
const trace = amp.trace('rag-retrieval');
const span = trace.startRAGSpan('Vector Search', 'pinecone', 'vector_search');

span
  .setUserQuery('What are the benefits of serverless?')
  .setRetrievalMethod('vector_search')
  .setRetrievedContext([
    { content: 'Serverless reduces overhead...', score: 0.95 },
    { content: 'Scalability is key...', score: 0.92 }
  ])
  .setAttribute('retrieval.top_k', 5)
  .setAttribute('context_count', 3);

span.end();
trace.end();
```

### Agent Spans

```typescript
const trace = amp.trace('agent-execution');
const span = trace.startAgentSpan('Research Agent', 'ResearchBot', 'research', 'Find AI trends');

span
  .setFramework('langchain', '0.1.0')
  .setAttribute('agent.role', 'researcher')
  .setAttribute('agent.iterations', 3)
  .addEvent('agent.step', { step: 1, action: 'search' });

span.end();
trace.end();
```

### Orchestration / Multi-Agent

```typescript
const trace = amp.trace('crew-workflow');

// Orchestrator span
const orchSpan = trace.startSpan('Content Crew', { type: 'orchestration' });
orchSpan
  .setChain('CrewAI')
  .setFramework('crewai', '0.30.0')
  .setAttribute('chain.total_steps', 3)
  .setAttribute('is_multi_agent', true);

// Child agent spans
const writerSpan = trace.startAgentSpan('Writer', 'WriterBot', 'writer', 'Write blog');
writerSpan.setAttribute('crew.name', 'BlogCrew');
writerSpan.end();

orchSpan.end();
trace.end();
```

---

## Sessions (Multi-Turn Conversations)

```typescript
// Create session
const session = amp.session({
  sessionId: 'custom-session-id',  // Optional
  userId: 'user-123',              // Optional
  metadata: { channel: 'web' },
});

// Turn 1
const trace1 = session.trace('turn-1');
trace1.startLLMSpan('llm', 'openai', 'gpt-4').end();
trace1.end();

// Turn 2
const trace2 = session.trace('turn-2');
trace2.startLLMSpan('llm', 'openai', 'gpt-4').end();
trace2.end();
```

---

## Batch Control

```typescript
// Manual flush
await amp.flush();

// Check queue size
console.log(amp.queueSize);

// Graceful shutdown (auto-flushes)
await amp.shutdown();
```

---

## Running Demo Tests

The SDK includes example scripts in `sdk/examples/`:

```bash
cd sdk

# Run the comprehensive demo test
npx ts-node examples/sdk-demo-test.ts

# Other examples
npx ts-node examples/basic-usage.ts
npx ts-node examples/session-example.ts
npx ts-node examples/openai-integration.ts
```

### Demo Test Output

```
🚀 AMP SDK Demo Test
====================
Suffix: test2-8gf9

📤 1. LLM Chat Completion...
   Session: sdk-test2-llm-test2-8gf9

📤 2. Tool Function Call...
   Session: sdk-test2-tool-test2-8gf9

📤 3. RAG Vector Retrieval...
   Session: sdk-test2-rag-test2-8gf9

📤 4. AI Agent Execution...
   Session: sdk-test2-agent-test2-8gf9

📤 5. Multi-Agent CrewAI...
   Session: sdk-test2-crew-test2-8gf9

⏳ Flushing...
✅ Done!
```

---

## OTEL GenAI Attributes

The SDK follows [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/):

| SDK Method | OTEL Attribute | Description |
|------------|----------------|-------------|
| `setTokens(in, out)` | `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` | Token counts |
| `setLLM(system, model)` | `gen_ai.system`, `gen_ai.request.model` | Provider & model |
| `setOperation(op)` | `gen_ai.operation.name` | chat, text_completion, embeddings |
| `setLLMResponse(reason, id)` | `gen_ai.response.finish_reason`, `gen_ai.response.id` | Response info |
| `setToolType(type)` | `gen_ai.tool.type` | function, extension, datastore |

### AMP Custom Attributes (OpenInference patterns)

Some attributes are AMP-specific but follow industry patterns:

| Attribute | Source | Description |
|-----------|--------|-------------|
| `user_query` | OpenInference | User's search query (RAG) |
| `retrieved_context` | OpenInference | Retrieved documents (RAG) |
| `retrieval_method` | OpenInference | vector_search, keyword_search, hybrid |
| `agent.role` | OpenInference | researcher, writer, reviewer |
| `agent.task` | OpenInference | Current task description |
| `crew.name` | OpenInference/CrewAI | Multi-agent crew name |

---

## UI Field Display by Span Type

When viewing spans in the AMP UI, different fields are shown based on span type:

| Span Type | Input Field | Output Field | Additional Info |
|-----------|-------------|--------------|-----------------|
| `llm` | `llm_input_messages` | `llm_output_messages` | model, tokens |
| `tool` | `tool_parameters` | `tool_result` | tool_name, tool_status, latency_ms |
| `rag` | `user_query` | `retrieved_context` | retrieval_method, context_count |
| `agent` | - | - | agent_name, agent_type |
| `orchestration` | `chain_type` | - | framework |

---

## File Structure

```
sdk/
├── packages/
│   └── core/
│       ├── src/
│       │   ├── client.ts       # Main AMP class
│       │   ├── batcher.ts      # Batch processing
│       │   ├── types/          # Type definitions
│       │   │   └── index.ts    # SpanType, Attributes, Config
│       │   └── spans/
│       │       ├── span.ts     # Span builder class
│       │       └── trace.ts    # Trace class
│       └── __tests__/
│           └── client.test.ts
├── examples/
│   ├── sdk-demo-test.ts        # Comprehensive demo
│   ├── basic-usage.ts          # Simple example
│   ├── session-example.ts      # Multi-turn sessions
│   └── openai-integration.ts   # OpenAI integration
└── README.md
```

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3004
```
→ Make sure the ingestion service is running: `docker compose up ingestion-service`

### Invalid API Key
```
Error: Unauthorized - Invalid API key
```
→ Check your API key format: `sk-acp-{accountId}-{randomString}`

### Traces Not Appearing in UI
1. Check processing service logs: `docker logs acp-processing-service`
2. Verify traces are accepted: Look for `Flush successful: N traces accepted` in SDK output
3. Check session names in UI search

---

## Support

- Documentation: https://docs.amp.kore.ai
- Email: support@kore.ai

# AMP SDK

**Agent Management Platform** - Production-ready TypeScript SDK for AI observability, governance, and analytics.

[![npm version](https://img.shields.io/npm/v/@koreaiinc/amp-sdk)](https://www.npmjs.com/package/@koreaiinc/amp-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

- [Introduction](#introduction)
  - [What is AMP?](#what-is-amp)
  - [Key Capabilities](#key-capabilities)
  - [Supported Span Types](#supported-span-types)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Decorator Approach (Recommended)](#decorator-approach-recommended)
  - [Manual Approach](#manual-approach)
- [Configuration](#configuration)
  - [Required Parameters](#required-parameters)
  - [Optional Parameters](#optional-parameters)
- [Core Concepts](#core-concepts)
  - [Session](#session)
  - [Trace](#trace)
  - [Span](#span)
  - [OpenTelemetry Compliance](#opentelemetry-compliance)
- [Supported Attributes & OTEL Mapping](#supported-attributes--otel-mapping)
  - [LLM Span Attributes](#llm-span-attributes)
  - [Tool Span Attributes](#tool-span-attributes)
  - [RAG Span Attributes](#rag-span-attributes)
  - [Agent Span Attributes](#agent-span-attributes)
  - [Orchestration Span Attributes](#orchestration-span-attributes)
- [Decorator-Based Instrumentation (Recommended)](#decorator-based-instrumentation-recommended)
  - [Setup (One Line)](#setup-one-line)
  - [Available Decorators](#available-decorators)
  - [Full Decorator Example](#full-decorator-example)
  - [Accessing Span Inside Decorated Methods](#accessing-span-inside-decorated-methods)
- [Zero-Impact Guarantee](#zero-impact-guarantee)
- [Examples](#examples)
  - [Example 0: Decorator-Based (Recommended)](#example-0-decorator-based-recommended)
  - [Example 1: Simple LLM Chat](#example-1-simple-llm-chat)
  - [Example 2: RAG Pipeline](#example-2-rag-pipeline)
  - [Example 3: Tool Execution](#example-3-tool-execution)
  - [Example 4: Multi-Agent Workflow](#example-4-multi-agent-workflow)
  - [Example 5: Session Management](#example-5-session-management-multi-turn)
  - [Complete Working Example (All Span Types)](#complete-working-example-all-span-types)
- [API Reference](#api-reference)
  - [AMP Client](#amp-client)
  - [Session Methods (Grouping Traces)](#session-methods-grouping-traces)
  - [Trace Methods (Creating Spans)](#trace-methods-creating-spans)
  - [Span Methods - Quick Reference](#span-methods---quick-reference)
    - [Child Span Methods](#child-span-methods-for-nested-operations)
  - [Decorator Reference](#decorator-reference)
- [Development (Building from Source)](#development-building-from-source)
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

### Supported Span Types

| Type | Description | Use Case |
|------|-------------|----------|
| **LLM** | Language model inference | Chat completions, text generation, embeddings |
| **Tool** | Function/tool execution | API calls, database queries, external services |
| **RAG** | Retrieval-augmented generation | Vector search, document retrieval, context injection |
| **Agent** | Agent lifecycle events | Agent creation, task execution, decision points |
| **Orchestration** | Chain/workflow execution | Multi-step pipelines, LangChain, LangGraph workflows |
| **Custom** | Any other operation | Custom business logic, integrations |

---

## Installation

### Prerequisites

- **Node.js** 18+
- An AMP account and API key

**SDK Links:**
- **npm:** <a href="https://www.npmjs.com/package/@koreaiinc/amp-sdk" target="_blank">https://www.npmjs.com/package/@koreaiinc/amp-sdk</a>
- **GitHub:** <a href="https://github.com/Koredotcom/amp-sdk" target="_blank">https://github.com/Koredotcom/amp-sdk</a>

**Getting Your API Key**:
1. Go to <a href="https://amp.kore.ai/" target="_blank">https://amp.kore.ai/</a>
2. Sign up or log in to your account
3. Create a new project or select an existing one
4. Navigate to **Settings** → **API Keys**
5. Click **Create API Key** and copy it
6. Your API key will start with `sk-amp-`

### TypeScript/JavaScript

```bash
# npm
npm install @koreaiinc/amp-sdk

# yarn
yarn add @koreaiinc/amp-sdk

# pnpm
pnpm add @koreaiinc/amp-sdk
```

### Verify Installation

```typescript
import { AMP } from '@koreaiinc/amp-sdk';

const amp = new AMP({
  apiKey: 'sk-amp-xxxxxx',
});

console.log('AMP SDK initialized successfully!');
```

### Try the Examples

**Option 1: After npm install**
```bash
# Run demo example (tests all span types)
AMP_API_KEY=your-api-key npx tsx node_modules/@koreaiinc/amp-sdk/examples/sdk-demo-test.ts

# Or run specific examples
AMP_API_KEY=your-api-key npx tsx node_modules/@koreaiinc/amp-sdk/examples/llm-span.ts
AMP_API_KEY=your-api-key npx tsx node_modules/@koreaiinc/amp-sdk/examples/agent-span.ts
```

**Option 2: From GitHub clone**
```bash
git clone https://github.com/Koredotcom/amp-sdk.git
cd amp-sdk
npm install

# Run examples
AMP_API_KEY=your-api-key npm run example:demo      # All span types
AMP_API_KEY=your-api-key npm run example:llm       # LLM spans
AMP_API_KEY=your-api-key npm run example:agent     # Agent spans
AMP_API_KEY=your-api-key npm run example:tool      # Tool spans
AMP_API_KEY=your-api-key npm run example:rag       # RAG spans
AMP_API_KEY=your-api-key npm run example:workflow  # Workflows
```

**Optional:** Override the API endpoint:
```bash
AMP_API_KEY=your-api-key AMP_BASE_URL=https://your-amp-instance.com npm run example:demo
```

---

## Quick Start

### Decorator Approach (Recommended)

The fastest way to instrument — **one line of setup, one decorator per method**:

```typescript
import { AMP, LLMTrace, ToolTrace } from '@koreaiinc/amp-sdk';

// One-time setup
AMP.init({ apiKey: process.env.AMP_API_KEY! });

// Add decorators to your existing methods — that's it
class MyService {
  @LLMTrace('chat', 'openai', 'gpt-4')
  async chat(prompt: string) {
    return await openai.chat.completions.create({ model: 'gpt-4', messages: [{ role: 'user', content: prompt }] });
  }

  @ToolTrace('search', 'web_search')
  async search(query: string) {
    return await searchAPI.query(query);
  }
}

// Use normally — instrumentation is automatic
const svc = new MyService();
await svc.chat('What is AMP?');
```

> **Requires:** `"experimentalDecorators": true` in your `tsconfig.json`

### Manual Approach

For more control, use the trace/span API directly:

```typescript
import { AMP } from '@koreaiinc/amp-sdk';

const amp = new AMP({ apiKey: process.env.AMP_API_KEY! });
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

- [Use Decorators](#decorator-based-instrumentation-recommended) for zero-effort instrumentation
- [Configure the SDK](#configuration) for your environment
- [Explore Examples](#examples) for different use cases
- <a href="https://amp.kore.ai/dashboard" target="_blank">View Your Traces</a> in the AMP dashboard

---

## Decorator-Based Instrumentation (Recommended)

The easiest way to instrument your application. Add a **single decorator** to any method — the SDK automatically creates traces, captures timing, records errors, and sends telemetry. **Zero code changes inside your methods.**

> **Requires:** `experimentalDecorators: true` in your `tsconfig.json`

### Setup (One Line)

```typescript
import { AMP } from '@koreaiinc/amp-sdk';

// At app startup — one line, once
AMP.init({ apiKey: process.env.AMP_API_KEY! });
```

That's it. Now decorators work everywhere in your app.

### Available Decorators

| Decorator | Use Case | Example |
|-----------|----------|---------|
| `@LLMTrace(name, provider, model)` | LLM/model calls | `@LLMTrace('chat', 'openai', 'gpt-4')` |
| `@ToolTrace(name, toolName, toolType?)` | Tool/function calls | `@ToolTrace('search', 'web_search')` |
| `@RAGTrace(name, vectorDb, method?)` | Retrieval/RAG operations | `@RAGTrace('retrieve', 'pinecone')` |
| `@AgentTrace(name, agentName, agentType?, version?)` | Agent operations | `@AgentTrace('plan', 'PlannerBot', 'research', '2.0')` |
| `@TraceDecorator(name?, options?)` | Generic custom operations | `@TraceDecorator('process', { type: 'custom' })` |

### Full Decorator Example

```typescript
import { AMP, LLMTrace, ToolTrace, RAGTrace, AgentTrace } from '@koreaiinc/amp-sdk';

// Initialize once at app startup
AMP.init({ apiKey: process.env.AMP_API_KEY! });

class AIService {
  // LLM call — auto-captures timing, model info, errors
  @LLMTrace('chat-completion', 'openai', 'gpt-4')
  async chat(prompt: string) {
    const span = AMP.currentSpan();
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });
    // Optionally enrich the span with token counts
    span?.setTokens(response.usage.prompt_tokens, response.usage.completion_tokens);
    return response.choices[0].message.content;
  }

  // Tool call — auto-sets tool.status to SUCCESS/ERROR
  @ToolTrace('db-lookup', 'search_database')
  async searchDatabase(query: string) {
    return await db.query(query);
  }

  // RAG retrieval — auto-captures vector DB and method
  @RAGTrace('context-retrieval', 'pinecone', 'vector_search')
  async retrieveContext(query: string) {
    const span = AMP.currentSpan();
    span?.setUserQuery(query);
    const results = await vectorDb.search(query);
    span?.setRetrievedContext(results);
    return results;
  }

  // Agent operation — auto-captures agent name, type, version
  @AgentTrace('research-step', 'ResearchBot', 'research', '2.0')
  async executeResearch(task: string) {
    return await this.chat(`Research: ${task}`);
  }
}

// Use your service normally — instrumentation is automatic
const service = new AIService();
const answer = await service.chat('What is AMP?');
```

### Accessing Span Inside Decorated Methods

Use `AMP.currentSpan()` to optionally add custom attributes:

```typescript
@LLMTrace('chat', 'anthropic', 'claude-3')
async chat(prompt: string) {
  const span = AMP.currentSpan();

  // Add token counts, cost, messages, etc.
  span?.setTokens(inputTokens, outputTokens);
  span?.setCost(0.0082);
  span?.setMessages(inputMessages, outputMessages);
  span?.setLLMParams({ temperature: 0.7, maxTokens: 1000 });

  return result;
}
```

If you don't need custom attributes, just add the decorator — everything else is automatic.

---

## Zero-Impact Guarantee

The SDK is designed to **never affect your application's performance or reliability**:

| Concern | How SDK Handles It |
|---------|-------------------|
| **Latency** | All telemetry sends are fire-and-forget (non-blocking). Your methods return immediately. |
| **Failures** | Network errors, API timeouts — all silently caught. Your application never sees SDK errors. |
| **Memory** | Queue has a max size (default: 1000). Oldest traces are dropped if the queue fills up — no memory leak. |
| **Errors** | If SDK initialization fails or decorators malfunction, your method runs as-is with zero instrumentation overhead. |
| **Retries** | Failed batches are dropped (not re-queued) to prevent cascading delays. |

```typescript
// Even if AMP is completely down, your code works fine:
@LLMTrace('chat', 'openai', 'gpt-4')
async chat(prompt: string) {
  // This ALWAYS works, regardless of AMP status
  return await openai.chat.completions.create({ ... });
}
```

---

## Metadata & Custom Attributes

You can attach metadata at every level — span, trace, and session:

### Span-Level Attributes

```typescript
const span = trace.startLLMSpan('chat', 'openai', 'gpt-4');
span.setAttribute('user.id', 'user-123');
span.setAttribute('deployment.environment', 'production');
span.setMetadata('request_source', 'web');
span.setMetadata('feature_flag', 'new-ui');
```

### Trace-Level Metadata

```typescript
const trace = amp.trace('user-query', {
  sessionId: 'session-abc',
  metadata: {
    user_id: 'user-123',
    tenant: 'acme-corp',
    environment: 'production',
  },
});

// Or set after creation
trace.setMetadata('priority', 'high');
trace.setMetadataAll({ region: 'us-east', version: '2.1' });
```

### Session-Level Metadata

```typescript
const session = amp.session({
  sessionId: 'chat-session-456',
  metadata: {
    user_id: 'user-123',
    channel: 'web',
    language: 'en',
  },
});
```

### Default Attributes (Applied to All Spans)

```typescript
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY!,
  defaults: {
    agent: { name: 'MyBot', type: 'conversational', version: '1.0' },
    service: { name: 'chat-service', version: '2.1.0', environment: 'production' },
  },
});
// Every span automatically gets agent.name, service.name, etc.
```

### Context-Based Attributes (Auto-Propagated)

```typescript
// All traces/spans created inside automatically get these attributes
amp.withContext({ sessionId: 'user-123', userId: 'u-456' }, async () => {
  const trace = amp.trace('query'); // sessionId auto-set
  // ...
});

amp.withAgent({ name: 'ResearchBot', type: 'research', version: '2.0' }, async () => {
  const trace = amp.trace('query');
  const span = trace.startSpan('search', { type: 'agent' });
  // agent.name, agent.type, agent.version are auto-set on all spans
});
```

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
| `baseURL` | `string` | `'https://amp.kore.ai'` | AMP API endpoint |
| `accountId` | `string` | Auto-extracted | Account ID (from API key) |
| `projectId` | `string` | Auto-extracted | Project ID (from API key) |

#### Batching

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `batchSize` | `number` | `100` | Traces per batch |
| `batchTimeout` | `number` | `5000` | Auto-flush timeout (ms) |
| `maxQueueSize` | `number` | `1000` | Max queued traces before dropping oldest |

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

### Configuration Example

```typescript
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY!,
  // baseURL: 'https://amp.kore.ai',  // Override base URL if needed
  batchSize: 100,
  maxRetries: 3,
  debug: false,                        // Set to true for debug logs
});
```

#### Environment Variables

```bash
# .env
AMP_API_KEY=sk-amp-xxxxxx
AMP_BASE_URL=https://amp.kore.ai
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

### Understanding the Hierarchy: Session → Trace → Span

AMP uses a three-level hierarchy to organize your AI observability data:

- **Session** - A group of related traces (e.g., multi-turn conversation)
- **Trace** - A single operation (e.g., "user query", "RAG pipeline")
- **Span** - A unit of work within a trace (e.g., "LLM call", "vector search")

```
┌─────────────────────────────────────────────────────────────┐
│  SESSION                                                    │
│  Groups related traces together (e.g., a conversation)      │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │  TRACE 1            │    │  TRACE 2            │        │
│  │  (Turn 1)           │    │  (Turn 2)           │        │
│  │                     │    │                     │        │
│  │  ┌─────┐ ┌─────┐   │    │  ┌─────┐ ┌─────┐   │        │
│  │  │Span │ │Span │   │    │  │Span │ │Span │   │        │
│  │  │RAG  │ │LLM  │   │    │  │Tool │ │LLM  │   │        │
│  │  └─────┘ └─────┘   │    │  └─────┘ └─────┘   │        │
│  └─────────────────────┘    └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Session

A **Session** groups related traces together, enabling you to track multi-turn conversations, user journeys, or any sequence of related operations.

**When to use sessions:**
- Multi-turn chatbot conversations
- User workflows spanning multiple requests
- A/B testing cohorts
- Any scenario where you need to correlate traces

**Creating a Session ID:**

You have two options for session IDs:

1. **Use your own ID** - Pass an existing ID from your database (e.g., conversation ID, user session ID)
2. **Generate on demand** - Create a unique ID when starting a new session

```typescript
// Option 1: Use existing ID from your database
const session = amp.session({
  sessionId: existingConversationId,  // From your DB
  userId: 'user-123',
});

// Option 2: Generate a new session ID
const session = amp.session({
  sessionId: `chat-${Date.now()}`,    // Generated on demand
  userId: 'user-123',
});

// Create traces within the session
const trace1 = session.trace('turn-1');
// ... spans ...
trace1.end();

const trace2 = session.trace('turn-2');
// ... spans ...
trace2.end();
```

**Alternative: Pass sessionId directly to trace**

```typescript
const sessionId = 'my-session-123';

// All traces with the same sessionId are grouped together
const trace1 = amp.trace('turn-1', { sessionId });
const trace2 = amp.trace('turn-2', { sessionId });
```

### Trace

A **Trace** represents a single operation or request (e.g., one user query, one API call). Each trace contains one or more spans.

```typescript
const trace = amp.trace('user-query', {
  sessionId: 'session-123',           // Optional: group with other traces
  metadata: { userId: 'u123' },       // Optional: trace-level metadata
});
```

### Span

A **Span** is the smallest unit of work within a trace. Spans represent individual operations like LLM calls, tool executions, or vector searches.

#### Span Hierarchy (Parent-Child Relationships)

Spans can be organized in a hierarchy using parent-child relationships:

- **Sibling spans**: Independent operations at the same level (e.g., parallel RAG + LLM)
- **Child spans**: Operations that are part of a parent's work (e.g., tools inside an agent)

```
Trace: user-request
├── RAG Span (parent: null)      ← Sibling
├── LLM Span (parent: null)      ← Sibling
└── Agent Span (parent: null)    ← Root for nested operations
    ├── Tool Span (parent: Agent) ← Child
    └── LLM Span (parent: Agent)  ← Child
```

**Creating Sibling Spans (parallel/sequential operations):**
```typescript
// Sibling spans - all at root level (parent_span_id = null)
const ragSpan = trace.startRAGSpan('vector-search', 'pinecone');
ragSpan.end();

const llmSpan = trace.startLLMSpan('chat-completion', 'openai', 'gpt-4');
llmSpan.setTokens(150, 75);
llmSpan.end();
```

**Creating Child Spans (nested operations):**
```typescript
// Agent with nested tool and LLM calls
const agentSpan = trace.startSpan('Agent Execution', { type: 'agent' });
agentSpan.setAgent('ResearchBot', 'research', 'Analyze market trends');

// Tool call - child of agent (pass parentSpanId in options)
const toolSpan = trace.startSpan('Tool: Web Search', {
  type: 'tool',
  parentSpanId: agentSpan.spanId  // Link to parent
});
toolSpan.setTool('web_search', { query: 'AI news' }, { results: [...] });
toolSpan.end();

// LLM call - child of agent
const llmSpan = trace.startSpan('LLM Decision', {
  type: 'llm',
  parentSpanId: agentSpan.spanId  // Link to parent
});
llmSpan.setLLM('openai', 'gpt-4');
llmSpan.setTokens(100, 50);
llmSpan.end();

agentSpan.end();
```

**Alternative: Using startChildSpan() method:**
```typescript
// Creates child span automatically linked to parent
const toolSpan = agentSpan.startChildSpan('Tool: Search', { type: 'tool' });
const llmSpan = agentSpan.startChildSpan('LLM Call', { type: 'llm' });
```

**When to use Child Spans:**
| Scenario | Use Child Span? | Example |
|----------|-----------------|---------|
| Tool call inside Agent | ✅ Yes | `agentSpan.startChildSpan('Tool')` |
| LLM call inside Agent | ✅ Yes | `agentSpan.startChildSpan('LLM')` |
| RAG → LLM pipeline | ❌ No (siblings) | `trace.startRAGSpan()`, `trace.startLLMSpan()` |
| Parallel operations | ❌ No (siblings) | Multiple `trace.startSpan()` calls |

### OpenTelemetry Compliance

AMP SDK follows <a href="https://opentelemetry.io/docs/specs/semconv/gen-ai/" target="_blank">OpenTelemetry GenAI Semantic Conventions</a>:

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

### Session Attributes

**See:** [Example 5: Session Management](#example-5-session-management-multi-turn) | For detailed working example, see <a href="examples/session-example.ts" target="_blank">`examples/session-example.ts`</a>

**Note:** ✅ = Standard OTEL attribute, ⚠️ = Custom attribute (SDK extension)

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `session({ sessionId, userId, metadata })` | `session.id` | String | ✅ **OTEL Standard** - Session identifier (provided by user or auto-generated). Standard OTEL semantic convention for session tracking. |
| `session({ sessionId, userId, metadata })` | `user.id` | String | ✅ **OTEL Standard** - User identifier. Standard OTEL service resource attribute. |
| `session({ sessionId, userId, metadata })` | `session.metadata` | Object | ⚠️ **Custom** - Session-level metadata. Custom attribute (not part of OTEL standard). |

### Trace Attributes

**See:** [Example 5: Session Management](#example-5-session-management-multi-turn) | For detailed working example, see <a href="examples/session-example.ts" target="_blank">`examples/session-example.ts`</a>

**Note:** ⚠️ = Custom attribute (SDK extension)

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `trace(name, { metadata })` | `trace.metadata` | Object | ⚠️ **Custom** - Trace-level metadata. Custom attribute (not part of OTEL standard). |

### Common Attributes (All Spans)

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `setAttribute(key, value)` | Custom attributes | Any | Add custom metadata to any span |
| `addEvent(name, attrs)` | Events | Object | Add timeline events to span |
| Auto set by span Constructor startLlmSpan('span name') (set when call startSpan( 'span.name')) | `span.name` | String | Span name (auto-set by SDK) |
| optional  | `span.kind` | String | Span kind per OTEL spec: INTERNAL (internal operation), CLIENT (outbound request), SERVER (inbound request), PRODUCER (message producer), CONSUMER (message consumer). **Note:** This SDK uses `span.type` (llm, tool, rag, agent, orchestration, custom) instead of `span.kind` for categorization. |
| Required (set by SDK API)  | `span.type` | String | Span type: llm, tool, rag, agent, orchestration, custom (used for categorization instead of span.kind) |
| setStatus()  | `span.status` | Object | Span status: OK, ERROR |

### LLM Span Attributes

**See:** [Example 1: Simple LLM Chat](#example-1-simple-llm-chat) | For detailed working example, see <a href="examples/llm-span.ts" target="_blank">`examples/llm-span.ts`</a>

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `startLLMSpan(name, provider, model)` | `gen_ai.system` | String | LLM provider (openai, anthropic, etc.) |
| `startLLMSpan(name, provider, model)` | `gen_ai.request.model` | String | Model name (gpt-4, claude-3, etc.) |
| `setTokens(input, output)` | `gen_ai.usage.input_tokens` | Number | Input token count |
| `setTokens(input, output)` | `gen_ai.usage.output_tokens` | Number | Output token count |
| `setOperation(op)` | `gen_ai.operation.name` | String | Operation: chat, text_completion, embeddings |
| `setMessages(inputMsgs, outputMsgs)` | `gen_ai.input.messages` | Array | Input messages sent to model |
| `setMessages(inputMsgs, outputMsgs)` | `gen_ai.output.messages` | Array | Output messages from model |
| `setLLMParams({...})` | `gen_ai.request.temperature` | Number | Temperature parameter (0-2) |
| `setLLMParams({...})` | `gen_ai.request.top_p` | Number | Top-p sampling parameter |
| `setLLMParams({...})` | `gen_ai.request.max_tokens` | Number | Maximum tokens to generate |
| `setLLMResponse(reason, id)` | `gen_ai.response.finish_reason` | String | stop, length, content_filter, tool_calls |
| `setLLMResponse(reason, id)` | `gen_ai.response.id` | String | Response/completion ID |
| `setCost(costUsd)` | `span_cost_usd` | Number | Cost in USD |

**`setMessages()` usage:**
```typescript
span.setMessages(
  // inputMsgs: Messages sent TO the model
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  // outputMsgs: Messages received FROM the model
  [
    { role: 'assistant', content: 'Hi there! How can I help?' }
  ]
);
```

### Tool Span Attributes

**See:** [Example 3: Tool Execution](#example-3-tool-execution) | For detailed working example, see <a href="examples/tool-span.ts" target="_blank">`examples/tool-span.ts`</a>

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `startToolSpan(name, toolName)` | `tool.name` | String | Name of the tool/function |
| `setTool(name, params, result)` | `tool.parameters` | Object | Tool input parameters |
| `setTool(name, params, result)` | `tool.result` | Object | Tool execution result |
| `setToolInfo(type, description)` | `tool.type` | String | function, extension, datastore, api |
| `setToolInfo(type, description)` | `gen_ai.tool.description` | String | Tool purpose/description |
| `setToolStatus(status, latencyMs)` | `tool.status` | String | SUCCESS, ERROR, TIMEOUT |
| `setToolStatus(status, latencyMs)` | `tool.latency_ms` | Number | Execution time in milliseconds |

### RAG Span Attributes

**See:** [Example 2: RAG Pipeline](#example-2-rag-pipeline) | For detailed working example, see <a href="examples/rag-span.ts" target="_blank">`examples/rag-span.ts`</a>

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `startRAGSpan(name, dbSystem)` | `vector_db` | String | Vector DB: pinecone, weaviate, chromadb |
| `setRAG(vectorDb, method, docsRetrieved)` | `retrieval.method` | String | vector_search, keyword_search, hybrid |
| `setRAG(vectorDb, method, docsRetrieved)` | `documents_retrieved` | Number | Number of documents retrieved |
| `setUserQuery(query)` | `user_query` | String | User's search query |
| `setRetrievedContext(docs[])` | `retrieved_context` | Array | Retrieved documents with scores |
| `setRetrievedContext(docs[])` | `top_score` | Number | Highest relevance score |
| `setRAGParams({topK, ...})` | `retrieval.top_k` | Number | Number of results requested |
| `setRAGParams({similarityThreshold})` | `similarity.threshold` | Number | Minimum similarity threshold |
| `setRAGParams({indexName})` | `index_name` | String | Collection/index name |

### Agent Span Attributes

**See:** [Example 4: Multi-Agent Workflow](#example-4-multi-agent-workflow) | For detailed working example, see <a href="examples/agent-span.ts" target="_blank">`examples/agent-span.ts`</a>

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `startAgentSpan(name, agentName, type, version?)` | `gen_ai.agent.name` / `agent.name` | String | Agent identifier |
| `startAgentSpan(name, agentName, type, version?)` | `agent.type` | String | researcher, writer, reviewer, executor |
| `startAgentSpan(name, agentName, type, version?)` | `gen_ai.agent.version` / `agent.version` | String | Agent version (semver or custom) |
| `setAgent(name, type, goal?, version?)` | `agent.goal` | String | Agent's objective/task |
| `setAttribute('agent.role', val)` | `agent.role` | String | Agent role in workflow |
| `setAttribute('agent.task', val)` | `agent.task` | String | Current task description |
| `setAttribute('agent.status', val)` | `agent.status` | String | running, completed, failed, waiting |
| `setAttribute('agent.iterations', val)` | `agent.iterations` | Number | Number of reasoning iterations |
| `setAttribute('agent.decision', val)` | `agent.decision` | String | Decision made by agent |
| `setFramework(name, version)` | `framework.name` | String | langchain, langgraph, autogen |
| `setFramework(name, version)` | `framework.version` | String | Framework version |

### Orchestration Span Attributes

**See:** [Example 4: Multi-Agent Workflow](#example-4-multi-agent-workflow) | For detailed working example, see <a href="examples/workflow-span.ts" target="_blank">`examples/workflow-span.ts`</a>

| SDK Method | OTEL Attribute | Type | Description |
|------------|----------------|------|-------------|
| `setChain(chainType)` | `chain.type` | String | sequential, parallel, map_reduce, router |
| `setAttribute('chain.total_steps', val)` | `chain.total_steps` | Number | Total steps in workflow |
| `setAttribute('chain.current_step', val)` | `chain.current_step` | Number | Current step being executed |
| `setAttribute('is_multi_agent', val)` | `is_multi_agent` | Boolean | Whether workflow uses multiple agents |
| `setAttribute('workflow.name', val)` | `workflow.name` | String | Multi-agent workflow identifier |
| `setAttribute('workflow.status', val)` | `workflow.status` | String | pending, running, completed, failed |
| `setFramework(name, version)` | `framework.name` | String | Framework orchestrating workflow |
| `setFramework(name, version)` | `framework.version` | String | Framework version |

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
- <a href="https://opentelemetry.io/docs/specs/semconv/gen-ai/" target="_blank">OpenTelemetry GenAI Semantic Conventions</a>
- <a href="https://github.com/Arize-ai/openinference" target="_blank">OpenInference Specification</a>

---

## Examples

### Example 0: Decorator-Based (Recommended)

> **Detailed Example:** <a href="examples/decorator-example.ts" target="_blank">examples/decorator-example.ts</a>

```typescript
import { AMP, LLMTrace, ToolTrace, RAGTrace, AgentTrace, getCurrentSpan } from '@koreaiinc/amp-sdk';

// One-time setup
AMP.init({ apiKey: process.env.AMP_API_KEY! });

class AIService {
  @LLMTrace('chat', 'openai', 'gpt-4')
  async chat(prompt: string) {
    const span = AMP.currentSpan(); // Optional: enrich the span
    const response = await openai.chat.completions.create({ model: 'gpt-4', messages: [{ role: 'user', content: prompt }] });
    span?.setTokens(response.usage.prompt_tokens, response.usage.completion_tokens);
    return response.choices[0].message.content;
  }

  @ToolTrace('db-search', 'search_users')
  async searchUsers(query: string) {
    return await db.query(query); // Auto-tracked, auto-SUCCESS on success
  }

  @RAGTrace('retrieve', 'pinecone', 'vector_search')
  async retrieveContext(query: string) {
    const span = AMP.currentSpan();
    span?.setUserQuery(query);
    const results = await vectorDb.search(query);
    span?.setRetrievedContext(results);
    return results;
  }

  @AgentTrace('research', 'ResearchBot', 'research', '2.0')
  async research(task: string) {
    const context = await this.retrieveContext(task);
    return await this.chat(`Context: ${context}. Task: ${task}`);
  }
}
```

**Run the example:**
```bash
AMP_API_KEY=your-api-key npx tsx examples/decorator-example.ts
```

---

### Example 1: Simple LLM Chat

> **Detailed Example:** <a href="examples/llm-span.ts" target="_blank">examples/llm-span.ts</a>

```typescript
import { AMP } from '@koreaiinc/amp-sdk';

const amp = new AMP({ apiKey: process.env.AMP_API_KEY! });

async function handleUserQuery(userMessage: string) {
  const trace = amp.trace('chat-completion');
  const span = trace.startLLMSpan('OpenAI Chat', 'openai', 'gpt-4-turbo');

  // Your LLM call here
  const response = await callOpenAI(userMessage);

  span
    .setTokens(response.usage.prompt_tokens, response.usage.completion_tokens)
    .setOperation('chat')
    .setMessages(
      [{ role: 'user', content: userMessage }],           // inputMsgs: messages sent TO the model
      [{ role: 'assistant', content: response.content }]  // outputMsgs: messages FROM the model
    )
    .setLLMResponse('stop', response.id);

  span.end();
  trace.end();
  await amp.flush();

  return response;
}
```

### Example 2: RAG Pipeline

> **Detailed Example:** <a href="examples/rag-span.ts" target="_blank">examples/rag-span.ts</a>

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
    .setMessages(
      // inputMsgs: messages sent TO the model
      [
        { role: 'system', content: 'Answer using the provided context.' },
        { role: 'user', content: userQuery },
      ],
      // outputMsgs: messages FROM the model
      [{ role: 'assistant', content: answer.text }]
    );
  llmSpan.end();

  trace.end();
  await amp.flush();
}
```

### Example 3: Tool Execution

> **Detailed Example:** <a href="examples/tool-span.ts" target="_blank">examples/tool-span.ts</a>

```typescript
async function executeTool(toolName: string, parameters: any) {
  const trace = amp.trace('tool-execution');
  const span = trace.startToolSpan(toolName, toolName);

  const startTime = Date.now();
  try {
    const result = await callTool(toolName, parameters);
    const latency = Date.now() - startTime;

    span
      .setTool(toolName, parameters, result)  // name, params (input), result (output)
      .setToolInfo('function', 'Tool description')
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

> **Detailed Examples:** <a href="examples/workflow-span.ts" target="_blank">examples/workflow-span.ts</a> | <a href="examples/agent-span.ts" target="_blank">examples/agent-span.ts</a>

```typescript
async function multiAgentWorkflow(task: string) {
  const trace = amp.trace('multi-agent-workflow');

  // Orchestrator (root span)
  const orchSpan = trace.startSpan('Content Workflow', { type: 'orchestration' });
  orchSpan
    .setChain('multi_agent')
    .setFramework('langgraph', '0.0.40')
    .setAttribute('chain.total_steps', 2)
    .setAttribute('is_multi_agent', true);

  // Writer Agent (child of orchestrator)
  const writerSpan = trace.startSpan('Writer Agent', {
    type: 'agent',
    parentSpanId: orchSpan.spanId  // Link to orchestrator
  });
  writerSpan.setAgent('WriterBot', 'writer', 'Write blog post', '2.1.0');
  await writerAgent.execute(task);
  writerSpan.end();

  // Editor Agent (child of orchestrator)
  const editorSpan = trace.startSpan('Editor Agent', {
    type: 'agent',
    parentSpanId: orchSpan.spanId  // Link to orchestrator
  });
  editorSpan.setAgent('EditorBot', 'editor', 'Review and polish', '1.3.0');
  await editorAgent.execute(task);
  editorSpan.end();

  orchSpan.end();
  trace.end();
  await amp.flush();
}

// Result hierarchy:
// Trace: multi-agent-workflow
// └── Content Workflow (orchestration)
//     ├── Writer Agent (agent) - child of orchestrator
//     └── Editor Agent (agent) - child of orchestrator
```

### Example 5: Session Management (Multi-Turn)

> **Detailed Example:** <a href="examples/session-example.ts" target="_blank">examples/session-example.ts</a>

```typescript
// Create a session for a conversation
const session = amp.session({
  sessionId: 'your-conversation-id',  // Your conversation/session ID
  userId: 'user-123',                  // Optional: user identifier
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

### Complete Working Example (All Span Types)

> **Full Demo:** <a href="examples/sdk-demo-test.ts" target="_blank">examples/sdk-demo-test.ts</a>

The `sdk-demo-test.ts` file demonstrates all span types in a single runnable script:
- LLM Chat Completion
- Tool/Function Execution
- RAG Vector Retrieval
- Agent Execution
- Multi-Agent Workflow
- Conversational Session (multi-turn)

**How to run:**

```bash
# Set your API key and run
AMP_API_KEY=your-api-key npx tsx examples/sdk-demo-test.ts

# Optional: Override base URL
AMP_API_KEY=your-api-key AMP_BASE_URL=https://amp.kore.ai npx tsx examples/sdk-demo-test.ts
```

---

## API Reference

### AMP Client

#### `AMP.init(config: AMPConfig): AMP` (Static — for Decorators)

Initializes a global AMP instance. **Required for decorators.** Call once at app startup.

```typescript
const amp = AMP.init({ apiKey: process.env.AMP_API_KEY! });
```

#### `AMP.currentSpan(): Span | undefined` (Static)

Get the active span inside a decorated method. Returns `undefined` outside decorators.

```typescript
@LLMTrace('chat', 'openai', 'gpt-4')
async chat(prompt: string) {
  const span = AMP.currentSpan();
  span?.setTokens(100, 50);
}
```

#### `AMP.currentTrace(): Trace | undefined` (Static)

Get the active trace inside a decorated method.

#### `new AMP(config: AMPConfig)`

Creates a new AMP SDK client (manual usage without decorators).

```typescript
const amp = new AMP({
  apiKey: 'sk-amp-xxxxxx',
  baseURL: 'https://amp.kore.ai',
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

### Session Methods (Grouping Traces)

Use sessions to group related traces together (e.g., multi-turn conversations).

```typescript
// 1. Create a session
const session = amp.session({
  sessionId: 'conversation-123',  // Your ID or auto-generated
  userId: 'user-456',             // Optional
  metadata: { channel: 'web' },   // Optional
});

// 2. Create traces within the session (automatically grouped)
const trace1 = session.trace('turn-1');
// ... add spans, end trace
trace1.end();

const trace2 = session.trace('turn-2');
// ... add spans, end trace
trace2.end();
```

| Method | Returns | Description |
|--------|---------|-------------|
| `session.trace(name, options?)` | `Trace` | Create a trace within this session (auto-assigns sessionId) |

---

### Trace Methods (Creating Spans)

Use trace methods to create spans. Each method returns a `Span` object you can configure.

```typescript
const trace = amp.trace('my-operation');
const span = trace.startLLMSpan('chat', 'openai', 'gpt-4');  // Returns Span
span.setTokens(100, 50);  // Configure the span
span.end();
trace.end();
```

| Method | Returns | Description |
|--------|---------|-------------|
| `trace.startLLMSpan(name, provider, model)` | `Span` | Create LLM span for model calls |
| `trace.startToolSpan(name, toolName)` | `Span` | Create tool span for function execution |
| `trace.startRAGSpan(name, dbSystem)` | `Span` | Create RAG span for retrieval operations |
| `trace.startAgentSpan(name, agentName, agentType, version?)` | `Span` | Create agent span for agent lifecycle |
| `trace.startSpan(name, options?)` | `Span` | Create custom/orchestration span |
| `trace.end()` | `void` | End the trace (call after all spans end) |

### Span Methods - Quick Reference

#### Child Span Methods (for nested operations)

| Method | Parameters | Description |
|--------|------------|-------------|
| `span.startChildSpan(name, options?)` | `name`: span name, `options`: `{ type, parentSpanId, attributes }` | Create child span nested under this span |
| `span.startChildLLMSpan(name, provider, model)` | `name`: span name, `provider`: LLM provider, `model`: model name | Create child LLM span |
| `span.startChildToolSpan(name, toolName)` | `name`: span name, `toolName`: tool name | Create child tool span |
| `span.startChildRAGSpan(name, dbSystem)` | `name`: span name, `dbSystem`: vector DB name | Create child RAG span |

**SpanOptions for parentSpanId:**
```typescript
trace.startSpan('child-operation', {
  type: 'tool',
  parentSpanId: parentSpan.spanId  // Links this span as child of parentSpan
});
```

---

#### LLM Span Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLLM(provider, model, responseModel?)` | `provider`: openai, anthropic, google, azure, etc. `model`: gpt-4, claude-3, etc. `responseModel`: actual model used (optional) | Set/change LLM provider and model |
| `setTokens(input, output)` | `input`: prompt token count, `output`: completion token count | Set token usage (auto-calculates total) |
| `setMessages(inputMsgs[], outputMsgs[])` | `inputMsgs`: messages sent TO model `[{role, content}]`, `outputMsgs`: messages FROM model | Set conversation messages (OTEL + OpenInference) |
| `setSystemPrompt(prompt)` | `prompt`: system instructions string | Set system prompt separately |
| `setOperation(op)` | `op`: `'chat'`, `'text_completion'`, `'embeddings'` | Set operation type |
| `setLLMParams({...})` | `temperature`: 0-2, `topP`: 0-1, `maxTokens`: limit, `frequencyPenalty`, `presencePenalty`, `stopSequences[]` | Set model parameters |
| `setLLMResponse(reason, id?)` | `reason`: `'stop'`, `'length'`, `'content_filter'`, `'tool_calls'`, `id`: response ID | Set completion metadata |
| `setCost(costUsd)` | `costUsd`: cost in USD (e.g., 0.0082) | Set cost for this call |
| `setConversationId(id)` | `id`: conversation/thread identifier | Link span to conversation thread |
| `recordPrompt(content)` | `content`: prompt text | Record prompt as OTEL event |
| `recordCompletion(content)` | `content`: completion text | Record completion as OTEL event |

---

#### Tool Span Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setTool(name, params?, result?)` | `name`: tool/function name, `params`: input parameters (object), `result`: execution result (object) | Set tool name, input parameters, and output result |
| `setToolInfo(type, description?, callId?)` | `type`: `'function'`, `'api'`, `'datastore'`, `'extension'`, `description`: purpose, `callId`: unique call ID | Set tool type and description |
| `setToolStatus(status, latencyMs?, errorMsg?)` | `status`: `'SUCCESS'`, `'ERROR'`, `'TIMEOUT'` (or lowercase), `latencyMs`: execution time, `errorMsg`: error details | Set execution status and timing |

---

#### RAG Span Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setRAG(vectorDb, method, docsRetrieved)` | `vectorDb`: pinecone, weaviate, chroma, qdrant, etc., `method`: `'vector_search'`, `'hybrid_search'`, `'keyword_search'`, `'reranking'`, `docsRetrieved`: count | Set core RAG retrieval info |
| `setUserQuery(query)` | `query`: user's search query string | Set the retrieval query (input) |
| `setRetrievedContext(docs[])` | `docs`: array of `{doc_id, content, score}` | Set retrieved documents (output). Auto-calculates `context_length` and `top_score` |
| `setRAGParams({...})` | `topK`: max docs, `similarityThreshold`: 0-1, `embeddingModel`: model name, `indexName`: index/collection, `dataSourceId`: KB identifier | Set retrieval parameters |

---

#### Agent Span Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setAgent(name, type, goal?, version?)` | `name`: agent identifier, `type`: `'research'`, `'writer'`, `'coder'`, `'planner'`, etc., `goal`: task objective, `version`: agent version (semver or custom) | Set core agent info |
| `setAgentDetails({...})` | `id`: unique ID, `description`: agent purpose, `role`: role in workflow, `version`: agent version, `status`: `'running'`, `'completed'`, `'failed'`, `steps`: iteration count, `maxIterations`: limit | Set agent metadata |
| `setFramework(name, version?)` | `name`: `'langchain'`, `'langgraph'`, `'autogen'`, etc., `version`: semver | Set framework info |
| `setCost(costUsd)` | `costUsd`: total cost in USD | Set agent execution cost |
| `setTokens(input, output)` | `input`: total input tokens, `output`: total output tokens | Set aggregate token usage |

---

#### Orchestration/Workflow Span Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setChain(chainType)` | `chainType`: `'multi_agent_workflow'`, `'sequential'`, `'parallel'`, `'conditional'`, `'router'` | Set workflow/chain type |
| `setFramework(name, version?)` | `name`: `'langgraph'`, `'langchain'`, etc., `version`: semver | Set orchestration framework |
| `setTokens(input, output)` | `input`: aggregate input tokens, `output`: aggregate output tokens | Set total token usage across workflow |
| `setCost(costUsd)` | `costUsd`: total workflow cost in USD | Set aggregate cost |

---

#### Common Methods (All Spans)

| Method | Parameters | Description |
|--------|------------|-------------|
| `setAttribute(key, value)` | `key`: attribute name, `value`: string, number, boolean, or string[] | Set custom attribute |
| `setAttributes({...})` | Object with multiple key-value pairs | Set multiple attributes at once |
| `setMetadata(key, value)` | `key`: metadata name, `value`: string, number, or boolean | Set metadata (separate from attributes) |
| `setLatency(latencyMs)` | `latencyMs`: execution time in milliseconds | Set latency metric |
| `setService(name, version?, env?)` | `name`: service name, `version`: semver, `env`: deployment environment | Set service info |
| `addEvent(name, attrs?)` | `name`: event name, `attrs`: event attributes object | Add event to span timeline |
| `setOk()` | - | Set status to OK |
| `setError(message?)` | `message`: error description | Set status to ERROR |
| `recordException(error)` | `error`: Error object | Record exception with type, message, and stack trace |
| `end()` | - | End the span (captures end_time) |

---

### Decorator Reference

Decorators auto-create a trace + typed span around any method. Requires `AMP.init()` and `experimentalDecorators: true`.

| Decorator | Creates | Auto-Sets |
|-----------|---------|-----------|
| `@LLMTrace(name, provider, model)` | LLM span | `gen_ai.provider.name`, `gen_ai.request.model` |
| `@ToolTrace(name, toolName, toolType?)` | Tool span | `tool.name`, `tool.type`, `tool.status` (SUCCESS/ERROR) |
| `@RAGTrace(name, vectorDb, method?)` | RAG span | `vector_db`, `retrieval.method` |
| `@AgentTrace(name, agentName, type?, version?)` | Agent span | `gen_ai.agent.name`, `agent.type`, `gen_ai.agent.version` |
| `@TraceDecorator(name?, options?)` | Custom span | Configurable via `options.type`, `options.attributes` |

**Helper functions:**

| Function | Returns | Description |
|----------|---------|-------------|
| `AMP.currentSpan()` | `Span \| undefined` | Get active span inside a decorated method |
| `AMP.currentTrace()` | `Trace \| undefined` | Get active trace inside a decorated method |
| `getCurrentSpan()` | `Span \| undefined` | Same as `AMP.currentSpan()` (standalone import) |
| `getCurrentTrace()` | `Trace \| undefined` | Same as `AMP.currentTrace()` (standalone import) |

---

## Development (Building from Source)

If you're working directly with the SDK source code instead of installing from npm:

### Setup

```bash
# Clone the repository
git clone https://github.com/Koredotcom/amp-sdk.git
cd amp-sdk

# Install dependencies
cd packages/core
npm install

# Build the SDK
npm run build
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the SDK (outputs to `dist/`) |
| `npm run dev` | Build in watch mode |
| `npm run test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |

### Running Examples

```bash
# From sdk root directory
AMP_API_KEY=your-api-key npx tsx examples/sdk-demo-test.ts
```

---

## Advanced Topics

### Batching and Performance

The SDK is designed to have **zero impact** on your application:

- **Fire-and-forget** — all telemetry sends are non-blocking. Your code never waits for HTTP calls.
- **Drop policy** — failed batches are dropped (not re-queued) to prevent cascading delays.
- **Bounded queue** — `maxQueueSize` caps memory usage. Oldest traces are dropped if the queue fills up.
- **Silent errors** — SDK errors are logged as warnings, never thrown into your code.

```typescript
const amp = new AMP({
  apiKey: 'sk-amp-xxxxxx',
  batchSize: 100,        // Send 100 traces per batch
  batchTimeout: 5000,    // Auto-flush after 5 seconds
  maxQueueSize: 1000,    // Drop oldest if queue exceeds this (prevents memory leak)
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

The SDK handles all errors silently — your application is never affected:

```typescript
// With decorators: errors are captured but re-thrown to your handler
@LLMTrace('chat', 'openai', 'gpt-4')
async chat(prompt: string) {
  // If this throws, AMP captures the error in the span
  // but still re-throws it to YOUR catch block
  return await openai.chat.completions.create({ ... });
}

// With manual API: same behavior
const trace = amp.trace('operation');
const span = trace.startLLMSpan('llm', 'openai', 'gpt-4');
try {
  // Your logic
  span.end();
  trace.end();
} catch (error) {
  span.setError(error.message);
  span.end();
  trace.end();
  throw error; // Your error handling stays intact
}
```

---

## Troubleshooting

### Connection Errors

**Error**: `connect ECONNREFUSED`

**Solution**: Verify `baseURL` is correct and the AMP service is accessible.

```typescript
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY!,
  baseURL: 'https://amp.kore.ai',
  debug: true,                          // Enable debug logs
});
```

### Invalid API Key

**Error**: `Unauthorized - Invalid API key`

**Solution**: Verify your API key format and permissions.

- API keys start with `sk-amp-`
- Check <a href="https://amp.kore.ai/settings" target="_blank">amp.kore.ai/settings</a> for valid keys

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

**Solution**: The SDK now has a bounded queue with automatic overflow protection. Tune with `maxQueueSize`:

```typescript
const amp = new AMP({
  apiKey: '...',
  batchSize: 50,        // Reduce from default 100
  batchTimeout: 3000,   // Flush more frequently
  maxQueueSize: 500,    // Lower max queue (default: 1000)
});
```

If queue fills up, the oldest traces are dropped automatically — no memory leak.

---

## Support

- **Dashboard**: <a href="https://amp.kore.ai" target="_blank">https://amp.kore.ai</a>
- **Documentation**: <a href="https://docs.amp.kore.ai" target="_blank">https://docs.amp.kore.ai</a>
- **Support Email**: <a href="mailto:support@kore.ai">support@kore.ai</a>
- **GitHub Issues**: <a href="https://github.com/Koredotcom/amp-sdk/issues" target="_blank">https://github.com/Koredotcom/amp-sdk/issues</a>

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by Kore.ai**

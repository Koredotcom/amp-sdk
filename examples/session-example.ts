/**
 * Session Example (Multi-Trace Conversation)
 *
 * Demonstrates how to create multiple traces within a single session.
 * Sessions group related traces together, typically representing:
 * - A user conversation (multiple turns)
 * - A workflow with multiple steps
 * - A user's interaction period
 *
 * Each trace can contain multiple spans (LLM calls, tool calls, RAG, etc.)
 *
 * Usage:
 *   AMP_API_KEY=your-api-key npx ts-node examples/session-example.ts
 *   AMP_API_KEY=your-api-key AMP_BASE_URL=https://your-server.com npx ts-node examples/session-example.ts
 *
 * Note: Timestamps are captured automatically by the SDK.
 */

import { AMP } from '@koreaiinc/amp-sdk';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_KEY = process.env.AMP_API_KEY;
if (!API_KEY) {
  console.error('Error: AMP_API_KEY environment variable is required');
  console.error('Usage: AMP_API_KEY=your-api-key npx ts-node examples/session-example.ts');
  process.exit(1);
}

const BASE_URL = process.env.AMP_BASE_URL;

// Helper to simulate async operations
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// MAIN EXAMPLE
// =============================================================================

async function main() {
  console.log('Session Example (Multi-Trace Conversation)\n');

  const amp = new AMP({
    apiKey: API_KEY,
    ...(BASE_URL && { baseURL: BASE_URL }),
    debug: true,
  });

  // ---------------------------------------------------------------------------
  // Create a session for grouping related traces
  // ---------------------------------------------------------------------------

  // session() creates a session that can spawn multiple traces
  //
  // Session ID options:
  //   1. Provide your own ID from your app (e.g., from user's DB, auth session)
  //   2. Let the SDK auto-generate one if not provided
  //
  // Example with your own session ID:
  //   const session = amp.session({ sessionId: userSessionFromDb });
  //
  // Example with auto-generated ID:
  //   const session = amp.session();
  //
  const session = amp.session({
    // sessionId: 'your-session-id-from-db',  // Provide your own, or omit to auto-generate
    metadata: {
      channel: 'web',
      app_version: '2.0.0',
    },
  });

  console.log(`Session ID: ${session.sessionId}`);
  console.log('Creating 3 conversation turns...\n');

  // ===========================================================================
  // Turn 1: User asks about product features
  // ===========================================================================

  console.log('Turn 1: User asks about features...');

  // session.trace() creates a trace automatically linked to this session
  const turn1 = session.trace('conversation-turn-1');
  turn1.setMetadata('user_message', 'What features does your AI platform offer?');

  // RAG retrieval to find relevant docs
  const turn1Rag = turn1.startRAGSpan('Knowledge Search', 'pinecone');
  turn1Rag.setRAG('pinecone', 'vector_search', 2);
  turn1Rag.setUserQuery('What features does your AI platform offer?');
  turn1Rag.setRetrievedContext([
    { doc_id: 'feat-001', content: 'Real-time AI observability and monitoring for LLM applications', score: 0.95 },
    { doc_id: 'feat-002', content: 'Multi-model support: OpenAI, Anthropic, Google, Azure', score: 0.92 },
  ]);
  turn1Rag.setAttribute('latency_ms', 85);
  await delay(85);
  turn1Rag.end();

  // LLM generates response based on retrieved context
  const turn1Llm = turn1.startLLMSpan('Generate Response', 'openai', 'gpt-4');
  turn1Llm.setTokens(320, 145);
  turn1Llm.setMessages(
    [{ role: 'user', content: 'What features does your AI platform offer?' }],
    [{ role: 'assistant', content: 'Our AI platform offers real-time observability, multi-model support for OpenAI, Anthropic, and more, plus comprehensive monitoring capabilities.' }]
  );
  turn1Llm.setLLMResponse('stop');
  turn1Llm.setCost(0.0125);
  turn1Llm.setAttribute('latency_ms', 1850);
  await delay(100);
  turn1Llm.end();

  turn1.end();
  console.log(`  Trace ID: ${turn1.traceId}`);

  // ===========================================================================
  // Turn 2: User asks about pricing
  // ===========================================================================

  console.log('Turn 2: User asks about pricing...');

  const turn2 = session.trace('conversation-turn-2');
  turn2.setMetadata('user_message', 'What are your pricing plans?');

  // Tool call to pricing API
  const turn2Tool = turn2.startToolSpan('Pricing Lookup', 'pricing_api');
  turn2Tool.setTool(
    'pricing_api',
    { plan_type: 'all', include_enterprise: true },
    {
      plans: [
        { name: 'Starter', price: '$99/mo', features: ['10K traces', 'Basic analytics'] },
        { name: 'Pro', price: '$299/mo', features: ['100K traces', 'Advanced analytics'] },
        { name: 'Enterprise', price: 'Custom', features: ['Unlimited', 'SLA', 'Support'] },
      ]
    }
  );
  turn2Tool.setToolInfo('api', 'Fetch pricing plans from pricing service');
  turn2Tool.setToolStatus('SUCCESS', 125);
  await delay(50);
  turn2Tool.end();

  // LLM generates pricing response
  const turn2Llm = turn2.startLLMSpan('Generate Response', 'openai', 'gpt-4');
  turn2Llm.setTokens(280, 180);
  turn2Llm.setMessages(
    [{ role: 'user', content: 'What are your pricing plans?' }],
    [{ role: 'assistant', content: 'We offer three plans: Starter at $99/mo, Pro at $299/mo, and Enterprise with custom pricing.' }]
  );
  turn2Llm.setLLMResponse('stop');
  turn2Llm.setCost(0.0142);
  turn2Llm.setAttribute('latency_ms', 2100);
  await delay(100);
  turn2Llm.end();

  turn2.end();
  console.log(`  Trace ID: ${turn2.traceId}`);

  // ===========================================================================
  // Turn 3: User requests a demo
  // ===========================================================================

  console.log('Turn 3: User requests a demo...');

  const turn3 = session.trace('conversation-turn-3');
  turn3.setMetadata('user_message', 'Can I schedule a demo?');

  // Agent handles demo scheduling
  const turn3Agent = turn3.startAgentSpan('Demo Scheduler', 'SchedulerAgent', 'scheduler');
  turn3Agent.setAgent('SchedulerAgent', 'scheduler', 'Schedule product demonstrations');
  turn3Agent.setAgentDetails({
    id: 'agent-scheduler-001',
    role: 'scheduler',
    status: 'completed',
    steps: 2,
  });
  turn3Agent.setAttribute('agent.task', 'Schedule a product demo');
  turn3Agent.setAttribute('agent.iterations', 2);
  turn3Agent.setAttribute('latency_ms', 3500);
  turn3Agent.setFramework('langchain', '0.1.0');
  await delay(150);
  turn3Agent.end();

  // LLM confirms the demo
  const turn3Llm = turn3.startLLMSpan('Generate Response', 'openai', 'gpt-4');
  turn3Llm.setTokens(150, 95);
  turn3Llm.setMessages(
    [{ role: 'user', content: 'Can I schedule a demo?' }],
    [{ role: 'assistant', content: 'Absolutely! I\'ve scheduled a demo for you. You\'ll receive a calendar invite shortly.' }]
  );
  turn3Llm.setLLMResponse('stop');
  turn3Llm.setCost(0.0078);
  turn3Llm.setAttribute('latency_ms', 980);
  await delay(50);
  turn3Llm.end();

  turn3.end();
  console.log(`  Trace ID: ${turn3.traceId}`);

  // ---------------------------------------------------------------------------
  // End session and flush
  // ---------------------------------------------------------------------------

  session.end();

  console.log('\nFlushing traces...');
  await amp.flush();

  console.log('\nSession complete!');
  console.log(`\nSession ID: ${session.sessionId}`);
  console.log('In the AMP UI, search for this session to see all 3 conversation turns');

  await amp.shutdown();
}

// =============================================================================
// SESSION CONCEPTS
// =============================================================================
/*
  SESSION HIERARCHY:
  ------------------
  Session (session-xxx)
    ├─ Trace (conversation-turn-1)
    │    ├─ RAG Span (Knowledge Search)
    │    └─ LLM Span (Generate Response)
    ├─ Trace (conversation-turn-2)
    │    ├─ Tool Span (Pricing Lookup)
    │    └─ LLM Span (Generate Response)
    └─ Trace (conversation-turn-3)
         ├─ Agent Span (Demo Scheduler)
         └─ LLM Span (Generate Response)

  KEY METHODS:
  ------------
  amp.session(options?)     - Create a session
                              options.sessionId: custom ID (optional)
                              options.metadata: key-value pairs

  session.trace(name)       - Create a trace linked to session

  session.sessionId         - Get the session ID

  session.end()             - End the session

  -------------------------------------------------------------------------
  ALTERNATIVE: Using trace() directly with sessionId
  -------------------------------------------------------------------------
  // If you don't want to use the session object, pass sessionId to trace():

  // Option 1: Use session ID from your app (e.g., from user DB, auth session)
  // const sessionId = userSessionFromDb;

  // Option 2: Let SDK generate one
  const sessionId = `session-${Date.now()}`;

  const trace1 = amp.trace('turn-1', { sessionId });
  const trace2 = amp.trace('turn-2', { sessionId });
  const trace3 = amp.trace('turn-3', { sessionId });

  -------------------------------------------------------------------------
  AUTOMATIC TIMESTAMPS:
  -------------------------------------------------------------------------
  start_time          - Captured when trace/span is created
  end_time            - Captured when end() is called
  duration_ms         - Calculated by backend from timestamps
*/

main().catch(console.error);

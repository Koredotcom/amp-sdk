/**
 * Decorator-Based Instrumentation Example
 *
 * Demonstrates the easiest way to instrument your application with AMP SDK.
 * Just add decorators to your methods — zero code changes inside your functions.
 *
 * Usage:
 *   AMP_API_KEY=your-api-key npx tsx examples/decorator-example.ts
 *   AMP_API_KEY=your-api-key AMP_BASE_URL=https://your-server.com npx tsx examples/decorator-example.ts
 *
 * Requires: "experimentalDecorators": true in tsconfig.json
 */

import {
  AMP,
  LLMTrace,
  ToolTrace,
  RAGTrace,
  AgentTrace,
  getCurrentSpan,
} from '@koreaiinc/amp-sdk';

// =============================================================================
// SETUP — One line, once at app startup
// =============================================================================

const API_KEY = process.env.AMP_API_KEY;
if (!API_KEY) {
  console.error('Error: AMP_API_KEY environment variable is required');
  console.error('Usage: AMP_API_KEY=your-api-key npx tsx examples/decorator-example.ts');
  process.exit(1);
}

const BASE_URL = process.env.AMP_BASE_URL;

// This single line enables all decorators
const amp = AMP.init({
  apiKey: API_KEY,
  ...(BASE_URL && { baseURL: BASE_URL }),
  debug: true,
});

// Helper to simulate async operations
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// =============================================================================
// YOUR SERVICE — Just add decorators, that's it
// =============================================================================

class AIService {
  /**
   * LLM call — @LLMTrace auto-creates trace + LLM span with provider/model set.
   * Use AMP.currentSpan() to optionally enrich with tokens, cost, etc.
   */
  @LLMTrace('chat-completion', 'openai', 'gpt-4')
  async chat(prompt: string): Promise<string> {
    const span = AMP.currentSpan();

    // Simulate LLM call
    await sleep(200);

    // Optionally set token counts and cost
    span?.setTokens(150, 75);
    span?.setCost(0.0065);
    span?.setMessages(
      [{ role: 'user', content: prompt }],
      [{ role: 'assistant', content: `Response to: ${prompt}` }],
    );
    span?.setLLMParams({ temperature: 0.7, maxTokens: 1000 });
    span?.setLLMResponse('stop', 'chatcmpl-abc123');

    return `Response to: ${prompt}`;
  }

  /**
   * Tool call — @ToolTrace auto-creates trace + tool span.
   * Tool status is automatically set to SUCCESS on success, ERROR on failure.
   */
  @ToolTrace('database-search', 'search_users')
  async searchUsers(query: string): Promise<Array<{ id: number; name: string }>> {
    // Simulate database query
    await sleep(100);

    return [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
  }

  /**
   * RAG retrieval — @RAGTrace auto-creates trace + RAG span with vector DB info.
   * Use AMP.currentSpan() to add query and retrieved context.
   */
  @RAGTrace('context-retrieval', 'pinecone', 'vector_search')
  async retrieveContext(query: string): Promise<Array<{ content: string; score: number }>> {
    const span = AMP.currentSpan();
    span?.setUserQuery(query);
    span?.setRAGParams({ topK: 5, similarityThreshold: 0.8, embeddingModel: 'text-embedding-3-small' });

    // Simulate vector search
    await sleep(150);

    const results = [
      { doc_id: 'doc-1', content: 'AMP is an observability platform for AI agents.', score: 0.95 },
      { doc_id: 'doc-2', content: 'AMP supports OpenTelemetry conventions.', score: 0.87 },
      { doc_id: 'doc-3', content: 'AMP SDK provides TypeScript decorators.', score: 0.82 },
    ];

    span?.setRetrievedContext(results);
    return results;
  }

  /**
   * Agent operation — @AgentTrace auto-creates trace + agent span.
   * Agent name, type, and version are all set automatically.
   */
  @AgentTrace('research-task', 'ResearchBot', 'research', '2.1.0')
  async executeResearch(task: string): Promise<string> {
    const span = AMP.currentSpan();
    span?.setAgentDetails({ role: 'researcher', steps: 3, maxIterations: 10 });

    // Step 1: Retrieve context
    const context = await this.retrieveContext(task);

    // Step 2: Search for related users
    const users = await this.searchUsers(task);

    // Step 3: Generate answer
    const answer = await this.chat(
      `Based on context: ${context.map(c => c.content).join(' ')} — Answer: ${task}`,
    );

    return answer;
  }
}

// =============================================================================
// MAIN — Use your service normally, instrumentation is automatic
// =============================================================================

async function main() {
  console.log('=== AMP SDK Decorator Example ===\n');

  const service = new AIService();

  // 1. Simple LLM call (auto-instrumented)
  console.log('1. Chat completion (with @LLMTrace):');
  const chatResult = await service.chat('What is observability?');
  console.log(`   Result: ${chatResult}\n`);

  // 2. Tool call (auto-instrumented, auto-SUCCESS status)
  console.log('2. Database search (with @ToolTrace):');
  const users = await service.searchUsers('engineers');
  console.log(`   Found ${users.length} users\n`);

  // 3. RAG retrieval (auto-instrumented)
  console.log('3. Context retrieval (with @RAGTrace):');
  const docs = await service.retrieveContext('What is AMP?');
  console.log(`   Retrieved ${docs.length} documents\n`);

  // 4. Full agent flow (calls multiple decorated methods)
  console.log('4. Research task (with @AgentTrace, calls other decorated methods):');
  const research = await service.executeResearch('How does AMP work?');
  console.log(`   Research result: ${research}\n`);

  // Flush remaining telemetry
  console.log('5. Flushing telemetry...');
  await amp.shutdown();
  console.log('   Done!\n');

  console.log('=== Check your AMP dashboard to see the traces ===');
}

main().catch(console.error);

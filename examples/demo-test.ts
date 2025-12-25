#!/usr/bin/env npx ts-node --transpile-only
/**
 * AMP SDK Demo Test
 * 
 * Quick test to verify SDK generates correct traces matching backend format.
 * This works without needing the backend service running.
 * 
 * Usage: npx ts-node examples/demo-test.ts
 */

import { AMP, Trace } from '../packages/core/src';

console.log('🚀 AMP SDK Demo Test\n');
console.log('This test generates sample traces to verify SDK output format.');
console.log('Compare output with test-data/sample-traces/*.json\n');

// Initialize - Ingestion service is on port 3004
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY || 'sk-acp-694aa356-e40311186d9540e588fc28a9ed6e800e',
  baseURL: process.env.AMP_BASE_URL || 'http://localhost:3004',
  debug: true,
  disableAutoFlush: true,
});

// ========================================
// Test 1: Simple LLM Span
// ========================================
console.log('=' .repeat(60));
console.log('TEST 1: Simple LLM Span');
console.log('=' .repeat(60));

const trace1 = amp.trace('simple-llm', { sessionId: 'session-test-1' });

const llmSpan = trace1.startSpan('ChatCompletion.Create', { type: 'llm' });
llmSpan
  .setLLM('openai', 'gpt-4', 'gpt-4-0613')
  .setOperation('chat')
  .setTokens(150, 75)
  .setLLMParams({ temperature: 0.7, maxTokens: 1000 })
  .setLLMResponse('stop', 'chatcmpl-abc123')
  .setCost(0.0082)
  .setConversationId('conv-001')
  .setService('my-app', '1.0.0', 'production')
  .setUserId('user-123')
  .setMessages(
    [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is AI?' },
    ],
    [
      { role: 'assistant', content: 'AI is...' },
    ]
  );

llmSpan.end();
trace1.end();

console.log('\n✅ LLM Trace:');
console.log(JSON.stringify(trace1.toData(), null, 2));

// ========================================
// Test 2: RAG with User Query
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('TEST 2: RAG with User Query');
console.log('=' .repeat(60));

const trace2 = amp.trace('rag-pipeline', { sessionId: 'session-test-2' });

const ragSpan = trace2.startSpan('RAG.VectorSearch', { type: 'rag' });
ragSpan
  .setUserQuery('What is the return policy?')  // ✅ user_query attribute
  .setRAG('pinecone', 'vector', 5)
  .setRAGParams({
    topK: 5,
    similarityThreshold: 0.75,
    embeddingModel: 'text-embedding-ada-002',
    dataSourceId: 'kb-prod-001',
  })
  .setRetrievedContext([
    { doc_id: 'doc-1', content: 'Return policy...', score: 0.92 },
    { doc_id: 'doc-2', content: 'Extended warranty...', score: 0.88 },
  ])
  .setLatency(4500);

ragSpan.end();
trace2.end();

console.log('\n✅ RAG Trace:');
console.log(JSON.stringify(trace2.toData(), null, 2));

// ========================================
// Test 3: Tool Call
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('TEST 3: Tool Call');
console.log('=' .repeat(60));

const trace3 = amp.trace('tool-call', { sessionId: 'session-test-3' });

const toolSpan = trace3.startSpan('Tool.WebSearch', { type: 'tool' });
toolSpan
  .setTool('web_search', 
    { query: 'latest news', limit: 5 },
    { results: [{ title: 'News 1', url: 'https://...' }] }
  )
  .setToolInfo('function', 'Search the web', 'call_abc123')
  .setToolStatus('success', 2500);

toolSpan.end();
trace3.end();

console.log('\n✅ Tool Trace:');
console.log(JSON.stringify(trace3.toData(), null, 2));

// ========================================
// Test 4: Agent Span
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('TEST 4: Agent Span');
console.log('=' .repeat(60));

const trace4 = amp.trace('agent-run', { sessionId: 'session-test-4' });

const agentSpan = trace4.startSpan('Agent.Execute', { type: 'agent' });
agentSpan
  .setAgent('ResearchAgent', 'task_executor', 'Find relevant information')
  .setAgentDetails({
    id: 'agent-001',
    description: 'Researches and analyzes data',
    role: 'Lead Researcher',
    status: 'completed',
    steps: 5,
  })
  .setFramework('langchain', '0.1.0')
  .setCrew('crew-001', 'ResearchTeam');

agentSpan.end();
trace4.end();

console.log('\n✅ Agent Trace:');
console.log(JSON.stringify(trace4.toData(), null, 2));

// ========================================
// Test 5: Events (OTEL style)
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('TEST 5: Span Events (OTEL)');
console.log('=' .repeat(60));

const trace5 = amp.trace('with-events', { sessionId: 'session-test-5' });

const eventSpan = trace5.startSpan('llm.completion', { type: 'llm' });
eventSpan
  .setLLM('openai', 'gpt-4')
  .setTokens(100, 50)
  .recordPrompt('What is machine learning?')
  .recordCompletion('Machine learning is a branch of AI...')
  .recordInferenceDetails(
    [{ role: 'user', content: 'What is ML?' }],
    [{ role: 'assistant', content: 'ML is...' }]
  )
  .addEvent('custom.event', { custom_key: 'custom_value' });

eventSpan.end();
trace5.end();

console.log('\n✅ Trace with Events:');
console.log(JSON.stringify(trace5.toData(), null, 2));

// ========================================
// Summary
// ========================================
console.log('\n' + '=' .repeat(60));
console.log('📊 SUMMARY');
console.log('=' .repeat(60));

console.log(`
✅ All trace types generated successfully!

AMP Span Types (validated by backend - NOT same as OTEL SpanKind):
  - llm           : LLM inference (gen_ai.operation.name: chat/text_completion/embeddings)
  - rag           : Retrieval with user_query, context, scores
  - tool          : Tool/function calls with parameters, results
  - orchestration : Chains/workflows
  - agent         : Agent lifecycle with framework info
  - custom        : Fallback for other operations

Note: SpanKind (INTERNAL/CLIENT/SERVER/etc.) describes WHO calls WHO.
      SpanType (llm/rag/tool/etc.) describes WHAT operation is performed.

OTEL GenAI Standard Attributes:
  - gen_ai.system, gen_ai.request.model, gen_ai.response.model
  - gen_ai.usage.input_tokens, gen_ai.usage.output_tokens
  - gen_ai.operation.name (chat, text_completion, embeddings)

OTEL GenAI Standard Events:
  - gen_ai.content.prompt, gen_ai.content.completion

AMP Extensions:
  - user_query (RAG), span_cost_usd, llm_input_messages/llm_output_messages

Ready for demo! 🎉
`);

// Cleanup
amp.shutdown().then(() => {
  console.log('SDK shutdown complete.');
});


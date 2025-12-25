/**
 * SDK Wrapper E2E Test
 * 
 * Uses the ACTUAL SDK wrapper classes with correct API
 */

import { AMP } from '../packages/core/src';

const API_KEY = 'sk-acp-694aa356-e40311186d9540e588fc28a9ed6e800e';

async function main() {
  console.log('🚀 AMP SDK Wrapper E2E Test');
  console.log('============================');
  console.log('Using actual SDK: AMP, Trace, Span\n');

  // Initialize SDK client (baseURL should NOT include /api/v1)
  const amp = new AMP({
    apiKey: API_KEY,
    baseURL: 'http://localhost:3004',
    debug: true,
  });

  // ===== Test 1: LLM Trace =====
  console.log('📤 Test 1: LLM Trace...');
  const llmTrace = amp.trace('sdk-wrapper-llm-01');
  
  // startLLMSpan(name, system, model)
  const llmSpan = llmTrace.startLLMSpan('chat-completion', 'openai', 'gpt-4-turbo');
  llmSpan.setTokens(150, 75);
  llmSpan.setAttribute('gen_ai.operation.name', 'chat');
  llmSpan.addEvent('gen_ai.content.prompt', { 'gen_ai.prompt': 'What is AI?' });
  llmSpan.addEvent('gen_ai.content.completion', { 'gen_ai.completion': 'AI is...' });
  llmSpan.end();
  llmTrace.end();
  
  console.log(`   Trace ID: ${llmTrace.traceId}`);
  console.log(`   Spans: ${llmTrace.spanCount}`);

  // ===== Test 2: Tool Trace =====
  console.log('\n📤 Test 2: Tool Trace...');
  const toolTrace = amp.trace('sdk-wrapper-tool-02');
  
  // startToolSpan(name, toolName)
  const toolSpan = toolTrace.startToolSpan('web-search', 'web_search');
  toolSpan.setAttribute('tool.type', 'function');
  toolSpan.setAttribute('tool.status', 'SUCCESS');
  toolSpan.setAttribute('tool.latency_ms', 250);
  toolSpan.setAttribute('framework', 'langchain');
  // Also set OTEL standard attributes
  toolSpan.setAttribute('gen_ai.tool.name', 'web_search');
  toolSpan.setAttribute('gen_ai.tool.type', 'function');
  toolSpan.end();
  toolTrace.end();
  
  console.log(`   Trace ID: ${toolTrace.traceId}`);
  console.log(`   Spans: ${toolTrace.spanCount}`);

  // ===== Test 3: RAG Trace =====
  console.log('\n📤 Test 3: RAG Trace...');
  const ragTrace = amp.trace('sdk-wrapper-rag-03');
  
  // startRAGSpan(name, dbSystem)
  const ragSpan = ragTrace.startRAGSpan('vector-retrieval', 'pinecone');
  ragSpan.setAttribute('user_query', 'How to implement auth?');
  ragSpan.setAttribute('retrieval_method', 'vector_search');
  ragSpan.setAttribute('retrieval.method', 'vector_search');
  ragSpan.setAttribute('context_count', 3);
  ragSpan.setAttribute('similarity_threshold', 0.75);
  ragSpan.end();
  ragTrace.end();
  
  console.log(`   Trace ID: ${ragTrace.traceId}`);
  console.log(`   Spans: ${ragTrace.spanCount}`);

  // ===== Test 4: Agent Trace =====
  console.log('\n📤 Test 4: Agent Trace...');
  const agentTrace = amp.trace('sdk-wrapper-agent-04');
  
  // startAgentSpan(name, agentName, agentType)
  const agentSpan = agentTrace.startAgentSpan('research-agent', 'ResearchBot', 'research');
  agentSpan.setAttribute('agent.id', 'agent-wrapper-004');
  agentSpan.setAttribute('agent.role', 'researcher');
  agentSpan.setAttribute('framework', 'langchain');
  // Also set OTEL standard
  agentSpan.setAttribute('gen_ai.agent.id', 'agent-wrapper-004');
  agentSpan.end();
  agentTrace.end();
  
  console.log(`   Trace ID: ${agentTrace.traceId}`);
  console.log(`   Spans: ${agentTrace.spanCount}`);

  // ===== Test 5: Orchestration Trace =====
  console.log('\n📤 Test 5: Orchestration Trace...');
  const orchTrace = amp.trace('sdk-wrapper-orch-05');
  
  // startSpan with type option
  const orchSpan = orchTrace.startSpan('crew-orchestrator', { type: 'orchestration' });
  orchSpan.setAttribute('chain_type', 'AgentExecutor');
  orchSpan.setAttribute('chain.type', 'AgentExecutor');
  orchSpan.setAttribute('chain.total_steps', 2);
  orchSpan.setAttribute('framework', 'crewai');
  orchSpan.setAttribute('is_multi_agent', true);
  
  // Child agent span
  const childSpan = orchTrace.startAgentSpan('writer-agent', 'WriterAgent', 'writer');
  childSpan.setAttribute('agent.id', 'agent-writer-005');
  childSpan.setAttribute('gen_ai.agent.id', 'agent-writer-005');
  childSpan.setAttribute('framework', 'crewai');
  childSpan.end();
  
  orchSpan.end();
  orchTrace.end();
  
  console.log(`   Trace ID: ${orchTrace.traceId}`);
  console.log(`   Spans: ${orchTrace.spanCount}`);

  // ===== Flush =====
  console.log('\n⏳ Flushing all traces...');
  
  try {
    await amp.flush();
    console.log('✅ All traces flushed!');
  } catch (error) {
    console.error('❌ Flush failed:', error);
  }

  // ===== Summary =====
  console.log('\n📊 Summary');
  console.log('============================');
  console.log('Trace IDs (look for these in UI):');
  console.log(`   sdk-wrapper-llm-01:   ${llmTrace.traceId}`);
  console.log(`   sdk-wrapper-tool-02:  ${toolTrace.traceId}`);
  console.log(`   sdk-wrapper-rag-03:   ${ragTrace.traceId}`);
  console.log(`   sdk-wrapper-agent-04: ${agentTrace.traceId}`);
  console.log(`   sdk-wrapper-orch-05:  ${orchTrace.traceId}`);
  
  console.log('\n💡 Look for: sdk-wrapper-*');
  
  await amp.shutdown();
  console.log('\n🔌 Done.');
}

main().catch(console.error);

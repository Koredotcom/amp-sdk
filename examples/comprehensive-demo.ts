/**
 * Comprehensive AMP SDK Demo
 * 
 * This script demonstrates ALL span types and attributes supported by AMP.
 * Run against the local ingestion service on localhost:3004
 * 
 * Usage:
 *   npx ts-node comprehensive-demo.ts
 */

import { AMP } from '../packages/core/src';

// Configuration - Ingestion service is on port 3004
const API_KEY = process.env.AMP_API_KEY || 'sk-acp-694aa356-e40311186d9540e588fc28a9ed6e800e';
const BASE_URL = process.env.AMP_BASE_URL || 'http://localhost:3004';

// Initialize AMP SDK
const amp = new AMP({
  apiKey: API_KEY,
  baseURL: BASE_URL,
  debug: true,
  printTraces: true,  // Print traces before sending
  batchSize: 10,      // Small batch for demo
  batchTimeout: 2000, // 2 second timeout
  disableAutoFlush: true, // Manual control for demo
});

// Helper to simulate async operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// DEMO 1: Simple LLM Chat (like test-data/01-simple-llm-chat-otel.json)
// ============================================
async function demoSimpleLLMChat() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 1: Simple LLM Chat');
  console.log('='.repeat(60));

  const trace = amp.trace('simple-llm-chat', {
    sessionId: 'session-demo-simple-llm',
    metadata: {
      environment: 'production',
      test_scenario: 'simple_llm_chat_otel',
    },
  });

  // LLM span
  const llmSpan = trace.startSpan('ChatCompletion.Create', { type: 'llm' });
  
  llmSpan
    .setLLM('openai', 'gpt-4', 'gpt-4-0613')
    .setOperation('chat')
    .setTokens(150, 75)
    .setLLMParams({
      temperature: 0.7,
      maxTokens: 1000,
      topP: 1.0,
    })
    .setLLMResponse('stop', 'chatcmpl-abc123xyz')
    .setConversationId('conv-demo-001')
    .setCost(0.00825)
    .setService('my-chatbot-app', '1.2.3', 'production')
    .setUserId('user-demo-123')
    .setMessages(
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is artificial intelligence?' },
      ],
      [
        { role: 'assistant', content: 'Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans.' },
      ]
    );

  // Record events
  llmSpan.recordInferenceDetails(
    [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is artificial intelligence?' },
    ],
    [
      { role: 'assistant', content: 'Artificial Intelligence (AI) refers to the simulation of human intelligence...' },
    ]
  );

  await delay(100);
  llmSpan.end();

  trace.setMetadata('total_cost_usd', '0.00825');
  trace.end();

  console.log('\n📦 Trace Data:');
  console.log(JSON.stringify(trace.toData(), null, 2));

  return trace;
}

// ============================================
// DEMO 2: Agent with Tool Call (like test-data/02-agent-with-tool-call.json)
// ============================================
async function demoAgentWithToolCall() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 2: Agent with Tool Call');
  console.log('='.repeat(60));

  const trace = amp.trace('agent-tool-demo', {
    sessionId: 'session-agent-demo',
    metadata: {
      environment: 'production',
      test_scenario: 'agent_with_tool_call',
    },
  });

  // Root agent span
  const agentSpan = trace.startSpan('Agent.Run', { type: 'agent' });
  agentSpan
    .setAgent('ResearchAgent', 'task_executor')
    .setAgentDetails({
      id: 'agent-researcher-001',
      description: 'Helps research and summarize information from the web',
    })
    .setFramework('langchain', '0.1.0')
    .setService('research-agent-app', undefined, 'production');

  // Tool span (child of agent)
  const toolSpan = trace.startSpan('Tool.WebSearch', {
    type: 'tool',
    parentSpanId: agentSpan.spanId,
  });
  
  toolSpan
    .setTool('web_search', 
      { query: 'latest developments in quantum computing 2025', limit: 5 },
      { results: [{ title: 'Quantum Computing Breakthrough 2025', url: 'https://example.com/quantum' }] }
    )
    .setToolInfo('function', 'Search the web for current information', 'call_search_abc123')
    .setToolStatus('success', 2500);

  await delay(50);
  toolSpan.end();

  // LLM synthesis span (child of agent)
  const llmSpan = trace.startSpan('ChatCompletion.Create', {
    type: 'llm',
    parentSpanId: agentSpan.spanId,
  });

  llmSpan
    .setLLM('openai', 'gpt-4', 'gpt-4-0613')
    .setOperation('chat')
    .setTokens(500, 300)
    .setLLMParams({ temperature: 0.7 })
    .setLLMResponse('stop', 'chatcmpl-synthesis-456')
    .setConversationId('conv-agent-002')
    .setCost(0.033)
    .setMessages(
      [
        { role: 'system', content: 'You are a research assistant. Synthesize information from search results.' },
        { role: 'user', content: 'Based on the search results about quantum computing, provide a summary.' },
      ],
      [
        { role: 'assistant', content: 'Recent developments in quantum computing for 2025 show significant progress in error correction and scalability.' },
      ]
    );

  await delay(100);
  llmSpan.end();
  agentSpan.end();

  trace.setMetadata('total_cost_usd', '0.033');
  trace.end();

  console.log('\n📦 Trace Data:');
  console.log(JSON.stringify(trace.toData(), null, 2));

  return trace;
}

// ============================================
// DEMO 3: RAG Retrieval System (like test-data/03-rag-retrieval-system.json)
// ============================================
async function demoRAGRetrieval() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 3: RAG Retrieval System');
  console.log('='.repeat(60));

  const trace = amp.trace('rag-pipeline-demo', {
    sessionId: 'session-rag-demo',
    metadata: {
      environment: 'production',
      test_scenario: 'rag_retrieval_system',
    },
  });

  // Orchestration span
  const chainSpan = trace.startSpan('RAG.Orchestration', { type: 'chain' });
  chainSpan
    .setChain('ConversationalRetrievalChain')
    .setFramework('langchain', '0.1.0')
    .setService('rag-qa-system');

  // RAG retrieval span
  const ragSpan = trace.startSpan('RAG.VectorSearch', {
    type: 'rag',
    parentSpanId: chainSpan.spanId,
  });

  ragSpan
    .setUserQuery('What is the company\'s return policy for electronics?')
    .setRAG('pinecone', 'vector', 5)
    .setRAGParams({
      topK: 5,
      similarityThreshold: 0.75,
      embeddingModel: 'text-embedding-ada-002',
      dataSourceId: 'datasource-kb-prod-001',
    })
    .setRetrievedContext([
      { doc_id: 'policy-001', content: 'Electronics can be returned within 30 days...', score: 0.92 },
      { doc_id: 'policy-002', content: 'Extended warranty items have 60-day returns...', score: 0.88 },
    ])
    .setLatency(4500);

  await delay(50);
  ragSpan.end();

  // LLM response generation span
  const llmSpan = trace.startSpan('ChatCompletion.Create', {
    type: 'llm',
    parentSpanId: chainSpan.spanId,
  });

  llmSpan
    .setLLM('anthropic', 'claude-3-sonnet-20240229')
    .setOperation('chat')
    .setTokens(850, 220)
    .setLLMParams({ temperature: 0.5, maxTokens: 500 })
    .setLLMResponse('stop', 'msg-rag-claude-789')
    .setCost(0.0321)
    .setSystemPrompt('You are a helpful customer service assistant. Use the provided context to answer questions accurately.')
    .setMessages(
      [
        { role: 'user', content: 'Based on the following context, answer the question.\n\nContext: Electronics can be returned within 30 days...\n\nQuestion: What is the company\'s return policy for electronics?' },
      ],
      [
        { role: 'assistant', content: 'Based on our policy, electronics can be returned within 30 days of purchase. For extended warranty items, you have up to 60 days.' },
      ]
    );

  await delay(100);
  llmSpan.end();
  chainSpan.end();

  trace.setMetadata('total_cost_usd', '0.0321');
  trace.end();

  console.log('\n📦 Trace Data:');
  console.log(JSON.stringify(trace.toData(), null, 2));

  return trace;
}

// ============================================
// DEMO 4: Multi-Agent CrewAI (like test-data/05-multi-agent-crewai.json)
// ============================================
async function demoMultiAgentCrew() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 4: Multi-Agent CrewAI');
  console.log('='.repeat(60));

  const trace = amp.trace('multiagent-crew-demo', {
    sessionId: 'session-crew-demo',
    metadata: {
      environment: 'production',
      test_scenario: 'multi_agent_crewai',
      crew_size: '3',
      workflow_type: 'sequential',
    },
  });

  // Crew orchestrator span
  const crewSpan = trace.startSpan('Crew.Execute', { type: 'agent' });
  crewSpan
    .setCrew('crew-research-team-001', 'ResearchTeam')
    .setFramework('crewai', '0.28.0')
    .setService('multi-agent-system', undefined, 'production');

  // Researcher agent
  const researcherSpan = trace.startSpan('Agent.Research', {
    type: 'agent',
    parentSpanId: crewSpan.spanId,
  });
  researcherSpan
    .setAgent('ResearcherAgent', 'researcher', 'Find comprehensive information about the topic')
    .setAgentDetails({
      id: 'agent-researcher-crewai-001',
      description: 'Gathers and analyzes research data',
      role: 'Lead Researcher',
    });

  // Researcher's LLM call
  const researcherLLM = trace.startSpan('ChatCompletion.Create', {
    type: 'llm',
    parentSpanId: researcherSpan.spanId,
  });
  researcherLLM
    .setLLM('openai', 'gpt-4', 'gpt-4-0613')
    .setOperation('chat')
    .setTokens(350, 450)
    .setLLMParams({ temperature: 0.7 })
    .setLLMResponse('stop')
    .setCost(0.042);

  await delay(30);
  researcherLLM.end();
  researcherSpan.end();

  // Analyst agent
  const analystSpan = trace.startSpan('Agent.Analyze', {
    type: 'agent',
    parentSpanId: crewSpan.spanId,
  });
  analystSpan
    .setAgent('AnalystAgent', 'analyst', 'Synthesize research into actionable insights')
    .setAgentDetails({
      id: 'agent-analyst-crewai-002',
      description: 'Analyzes research findings and draws conclusions',
      role: 'Senior Analyst',
    });

  // Analyst's LLM call
  const analystLLM = trace.startSpan('ChatCompletion.Create', {
    type: 'llm',
    parentSpanId: analystSpan.spanId,
  });
  analystLLM
    .setLLM('anthropic', 'claude-3-opus-20240229')
    .setOperation('chat')
    .setTokens(1200, 600)
    .setLLMParams({ temperature: 0.5 })
    .setLLMResponse('stop')
    .setCost(0.108);

  await delay(30);
  analystLLM.end();
  analystSpan.end();

  // Writer agent
  const writerSpan = trace.startSpan('Agent.Write', {
    type: 'agent',
    parentSpanId: crewSpan.spanId,
  });
  writerSpan
    .setAgent('WriterAgent', 'writer', 'Produce clear and comprehensive final report')
    .setAgentDetails({
      id: 'agent-writer-crewai-003',
      description: 'Creates polished reports from analysis',
      role: 'Technical Writer',
    });

  // Writer's LLM call
  const writerLLM = trace.startSpan('ChatCompletion.Create', {
    type: 'llm',
    parentSpanId: writerSpan.spanId,
  });
  writerLLM
    .setLLM('openai', 'gpt-4-turbo-2024-04-09')
    .setOperation('chat')
    .setTokens(2000, 800)
    .setLLMParams({ temperature: 0.6 })
    .setLLMResponse('stop')
    .setCost(0.084);

  await delay(30);
  writerLLM.end();
  writerSpan.end();
  crewSpan.end();

  trace.setMetadata('total_cost_usd', '0.234');
  trace.end();

  console.log('\n📦 Trace Data:');
  console.log(JSON.stringify(trace.toData(), null, 2));

  return trace;
}

// ============================================
// DEMO 5: Comprehensive E2E (like test-data/comprehensive-trace.json)
// ============================================
async function demoComprehensiveE2E() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 5: Comprehensive E2E Customer Support');
  console.log('='.repeat(60));

  const trace = amp.trace('e2e-customer-support', {
    sessionId: 'session-support-chat-demo',
    metadata: {
      environment: 'production',
      customer_id: 'cust_12345',
      session_type: 'support_chat',
      user_intent: 'product_return',
    },
  });

  // Root orchestration
  const orchestrationSpan = trace.startSpan('agent.customer_support.orchestration', { type: 'agent' });
  orchestrationSpan
    .setAgent('CustomerSupportAgent', 'customer_support')
    .setService('customer-support-app', 'v3.2.1', 'production')
    .setMetadata('customer_tier', 'enterprise')
    .setMetadata('region', 'us-east-1');

  // Intent classification LLM
  const intentSpan = trace.startSpan('llm.intent_classification', {
    type: 'llm',
    parentSpanId: orchestrationSpan.spanId,
  });
  intentSpan
    .setLLM('openai', 'gpt-4o-mini')
    .setOperation('chat')
    .setTokens(245, 28)
    .setLLMParams({ temperature: 0.3, maxTokens: 100 })
    .setCost(0.0015)
    .setLatency(2333)
    .setAttribute('intent_detected', 'product_return_inquiry')
    .setAttribute('confidence', 0.96);

  await delay(20);
  intentSpan.end();

  // Knowledge retrieval (RAG)
  const ragSpan = trace.startSpan('rag.knowledge_base_search', {
    type: 'rag',
    parentSpanId: orchestrationSpan.spanId,
  });
  ragSpan
    .setUserQuery('laptop return policy enterprise customer 30 days')
    .setRAG('pinecone', 'vector', 8)
    .setRAGParams({
      topK: 8,
      similarityThreshold: 0.82,
      indexName: 'kb-prod-us-east-1',
      embeddingModel: 'text-embedding-ada-002',
    })
    .setAttribute('top_score', 0.94)
    .setLatency(4767);

  await delay(20);
  ragSpan.end();

  // Database tool call
  const dbToolSpan = trace.startSpan('tool.database.order_lookup', {
    type: 'tool',
    parentSpanId: orchestrationSpan.spanId,
  });
  dbToolSpan
    .setTool('get_customer_orders',
      { customer_id: 'cust_12345', timeframe_days: 90 },
      { rows_returned: 5 }
    )
    .setToolInfo('database', 'Lookup customer orders')
    .setToolStatus('success', 658)
    .setAttribute('database', 'postgresql')
    .setAttribute('query_type', 'SELECT')
    .setAttribute('cache_hit', false);

  await delay(10);
  dbToolSpan.end();

  // Response generation LLM
  const responseLLM = trace.startSpan('llm.response_generation', {
    type: 'llm',
    parentSpanId: orchestrationSpan.spanId,
  });
  responseLLM
    .setLLM('openai', 'gpt-4-turbo-2024-04-09')
    .setOperation('chat')
    .setTokens(2847, 543)
    .setLLMParams({ temperature: 0.7, maxTokens: 2000 })
    .setLLMResponse('stop')
    .setCost(0.169)
    .setLatency(67778)
    .setAttribute('system_prompt_version', 'v4.2')
    .setAttribute('rag_context_used', true);

  // Record guardrails result as OTEL event (NOT a separate span)
  // This is how OTEL handles inline checks - as events on the parent span
  responseLLM.addEvent('guardrails.check', {
    evaluator: 'content_safety_v2',
    passed: true,
    toxicity_score: 0.02,
    pii_detected: false,
    latency_ms: 667,
  });

  // Record quality evaluation as OTEL event
  responseLLM.addEvent('evaluation.quality', {
    evaluator: 'llm_judge_v3',
    passed: true,
    overall_score: 0.91,
    latency_ms: 3656,
  });

  await delay(10);
  responseLLM.end();

  // Audit logging tool
  const auditSpan = trace.startSpan('tool.audit.log_interaction', {
    type: 'tool',
    parentSpanId: orchestrationSpan.spanId,
  });
  auditSpan
    .setTool('audit_logger', { event_type: 'customer_interaction' })
    .setAttribute('destination', 'elasticsearch')
    .setAttribute('compliance_category', 'customer_support')
    .setAttribute('retention_days', 2555)
    .setToolStatus('success', 333);

  await delay(5);
  auditSpan.end();
  orchestrationSpan.end();

  trace.setMetadata('resolution_status', 'resolved');
  trace.setMetadata('total_cost_usd', '0.1705');
  trace.end();

  console.log('\n📦 Trace Data:');
  console.log(JSON.stringify(trace.toData(), null, 2));

  return trace;
}

// ============================================
// MAIN - Run all demos and send to service
// ============================================
async function main() {
  console.log('🚀 AMP SDK Comprehensive Demo');
  console.log(`📡 Target: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log('');

  try {
    // Run all demos
    const trace1 = await demoSimpleLLMChat();
    const trace2 = await demoAgentWithToolCall();
    const trace3 = await demoRAGRetrieval();
    const trace4 = await demoMultiAgentCrew();
    const trace5 = await demoComprehensiveE2E();

    // Wait a bit for traces to be queued
    console.log('\n' + '='.repeat(60));
    console.log('📤 Flushing all traces to ingestion service...');
    console.log('='.repeat(60));

    console.log(`\nQueue size before flush: ${amp.queueSize}`);

    // Flush
    const response = await amp.flush();
    
    console.log('\n✅ Flush Response:');
    console.log(JSON.stringify(response, null, 2));

    // Health check
    console.log('\n🏥 Health Check:');
    try {
      const health = await amp.health();
      console.log(JSON.stringify(health, null, 2));
    } catch (e: any) {
      console.log('Health check failed:', e.message);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Demo Summary');
    console.log('='.repeat(60));
    console.log(`Total traces created: 5`);
    console.log(`Trace IDs:`);
    console.log(`  1. Simple LLM: ${trace1.traceId}`);
    console.log(`  2. Agent+Tool: ${trace2.traceId}`);
    console.log(`  3. RAG: ${trace3.traceId}`);
    console.log(`  4. Multi-Agent: ${trace4.traceId}`);
    console.log(`  5. Comprehensive E2E: ${trace5.traceId}`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }

  await amp.shutdown();
  console.log('\n🛑 SDK shutdown complete');
}

// Run
main().catch(console.error);


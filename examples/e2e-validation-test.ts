/**
 * E2E Validation Test - SDK to ClickHouse
 * 
 * Creates traces with identifiable prefixes for UI validation:
 * - sdk-llm-01: LLM span with all OTEL attributes
 * - sdk-tool-02: Tool span with OTEL + OpenInference attributes
 * - sdk-rag-03: RAG span with AMP custom attributes
 * - sdk-agent-04: Agent span with OpenInference attributes
 * - sdk-multi-05: Multi-agent/CrewAI span
 */

const API_KEY = 'sk-acp-694aa356-e40311186d9540e588fc28a9ed6e800e';
const INGESTION_URL = 'http://localhost:3004/api/v1/telemetry';

// Generate unique IDs with prefixes
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

// Current timestamp in ISO format
const now = () => new Date().toISOString();

// Test 1: LLM Span with full OTEL attributes
const llmTrace = {
  trace_id: generateId('sdk-llm-01'),
  session_id: generateId('session-llm'),
  spans: [{
    span_id: generateId('span-llm'),
    name: 'sdk-llm-01-chat-completion',
    start_time: now(),
    end_time: now(),
    status: { code: 'OK' },
    attributes: {
      // Span type
      'span.type': 'llm',
      
      // OTEL Standard - Provider & Model
      'gen_ai.provider.name': 'openai',
      'gen_ai.system': 'openai',
      'gen_ai.request.model': 'gpt-4-turbo',
      'gen_ai.response.model': 'gpt-4-turbo-2024-04-09',
      'gen_ai.operation.name': 'chat',
      
      // OTEL Standard - Tokens
      'gen_ai.usage.input_tokens': 150,
      'gen_ai.usage.output_tokens': 75,
      'gen_ai.usage.total_tokens': 225,
      
      // OTEL Standard - Request Parameters
      'gen_ai.request.temperature': 0.7,
      'gen_ai.request.max_tokens': 1000,
      'gen_ai.request.top_p': 0.9,
      
      // OTEL Standard - Response
      'gen_ai.response.id': 'chatcmpl-sdk-test-001',
      'gen_ai.response.finish_reason': 'stop',
      'gen_ai.conversation.id': 'conv-sdk-test-001',
      
      // Service info
      'service.name': 'sdk-e2e-test',
      'deployment.environment': 'development',
    },
    events: [
      {
        name: 'gen_ai.content.prompt',
        timestamp: now(),
        attributes: {
          'gen_ai.prompt': 'What is the capital of France?'
        }
      },
      {
        name: 'gen_ai.content.completion',
        timestamp: now(),
        attributes: {
          'gen_ai.completion': 'The capital of France is Paris.'
        }
      }
    ]
  }]
};

// Test 2: Tool Span with OTEL + Legacy attributes (validator needs legacy)
const toolTrace = {
  trace_id: generateId('sdk-tool-02'),
  session_id: generateId('session-tool'),
  spans: [{
    span_id: generateId('span-tool'),
    name: 'sdk-tool-02-web-search',
    start_time: now(),
    end_time: now(),
    status: { code: 'OK' },
    attributes: {
      'span.type': 'tool',
      
      // OTEL Standard Tool Attributes
      'gen_ai.tool.name': 'web_search',
      'gen_ai.tool.type': 'function',
      'gen_ai.tool.description': 'Search the web for real-time information',
      'gen_ai.tool.call.id': 'call_sdk_test_002',
      'gen_ai.tool.call.arguments': JSON.stringify({ query: 'latest news about AI' }),
      'gen_ai.tool.call.result': JSON.stringify({ results: ['Article 1', 'Article 2'] }),
      
      // Legacy (REQUIRED by validator)
      'tool.name': 'web_search',
      'tool.type': 'function',
      'tool.status': 'SUCCESS',
      'tool.latency_ms': 250,
      'tool.parameters': JSON.stringify({ query: 'latest news about AI' }),
      'tool.result': JSON.stringify({ results: ['Article 1', 'Article 2'] }),
      
      // Framework
      'framework': 'langchain',
      'framework.version': '0.1.0',
    }
  }]
};

// Test 3: RAG Span with AMP Custom + Legacy attributes
const ragTrace = {
  trace_id: generateId('sdk-rag-03'),
  session_id: generateId('session-rag'),
  spans: [{
    span_id: generateId('span-rag'),
    name: 'sdk-rag-03-vector-retrieval',
    start_time: now(),
    end_time: now(),
    status: { code: 'OK' },
    attributes: {
      'span.type': 'rag',
      
      // OTEL Standard
      'gen_ai.data_source.id': 'ds-sdk-test-003',
      
      // Legacy (REQUIRED by validator)
      'retrieval_method': 'vector_search',  // validator expects this
      'user_query': 'How do I implement authentication in Node.js?',
      'context_count': 3,
      'context_length': 2500,
      'similarity_threshold': 0.75,
      'retrieval_top_k': 5,
      'db.system': 'pinecone',
      
      // Also include OTEL-style for extraction
      'retrieval.method': 'vector_search',
      'retrieval.top_k': 5,
      'similarity.threshold': 0.75,
      
      // Retrieved context
      'retrieved_context': JSON.stringify([
        { content: 'JWT authentication guide...', score: 0.92 },
        { content: 'Passport.js tutorial...', score: 0.88 },
        { content: 'OAuth2 implementation...', score: 0.85 }
      ]),
    }
  }]
};

// Test 4: Agent Span with OTEL + Legacy attributes
const agentTrace = {
  trace_id: generateId('sdk-agent-04'),
  session_id: generateId('session-agent'),
  spans: [{
    span_id: generateId('span-agent'),
    name: 'sdk-agent-04-research-agent',
    start_time: now(),
    end_time: now(),
    status: { code: 'OK' },
    attributes: {
      'span.type': 'agent',
      
      // OTEL Standard Agent Attributes
      'gen_ai.agent.id': 'agent-sdk-test-004',
      'gen_ai.agent.name': 'ResearchBot',
      'gen_ai.agent.description': 'An AI agent that researches topics and summarizes findings',
      
      // Legacy (REQUIRED by validator)
      'agent.id': 'agent-sdk-test-004',
      'agent.name': 'ResearchBot',
      'agent.type': 'research',
      'agent.role': 'researcher',
      'agent.task': 'Research the latest trends in AI observability',
      'agent.iterations': 3,
      'agent.max_iterations': 10,
      
      // Framework
      'framework': 'langchain',
      'framework.version': '0.1.0',
    }
  }]
};

// Test 5: Multi-Agent/CrewAI Span
const multiAgentTrace = {
  trace_id: generateId('sdk-multi-05'),
  session_id: generateId('session-multi'),
  spans: [
    // Orchestrator span
    {
      span_id: generateId('span-orchestrator'),
      name: 'sdk-multi-05-crew-orchestrator',
      start_time: now(),
      end_time: now(),
      status: { code: 'OK' },
      attributes: {
        'span.type': 'orchestration',
        
        // Legacy (REQUIRED by validator)
        'chain_type': 'AgentExecutor',  // validator expects this
        
        // Orchestration attributes
        'chain.type': 'AgentExecutor',
        'chain.total_steps': 3,
        'chain.execution_order': 1,
        
        // Multi-agent / CrewAI attributes
        'crew.id': 'crew-sdk-test-005',
        'crew.name': 'ContentCreationCrew',
        'is_multi_agent': true,
        'agent.collaboration_mode': 'sequential',
        'agent.team_id': 'team-sdk-test-005',
        
        // Framework
        'framework': 'crewai',
        'framework.version': '0.28.0',
        
        // LangSmith integration
        'langsmith.run_id': 'run-sdk-test-005',
        'langsmith.run_type': 'chain',
        'langsmith.project': 'sdk-e2e-test',
      }
    },
    // Sub-agent span
    {
      span_id: generateId('span-sub-agent'),
      parent_span_id: generateId('span-orchestrator'),
      name: 'sdk-multi-05-writer-agent',
      start_time: now(),
      end_time: now(),
      status: { code: 'OK' },
      attributes: {
        'span.type': 'agent',
        
        // OTEL Standard
        'gen_ai.agent.id': 'agent-writer-005',
        'gen_ai.agent.name': 'WriterAgent',
        
        // Legacy (REQUIRED by validator)
        'agent.id': 'agent-writer-005',
        'agent.name': 'WriterAgent',
        'agent.type': 'writer',
        'agent.role': 'writer',
        'agent.orchestrator_id': 'crew-sdk-test-005',
        
        'framework': 'crewai',
      }
    }
  ]
};

// Send trace to ingestion service
async function sendTrace(name: string, trace: any) {
  console.log(`\n📤 Sending ${name}...`);
  console.log(`   Trace ID: ${trace.trace_id}`);
  console.log(`   Session ID: ${trace.session_id}`);
  
  try {
    const response = await fetch(INGESTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({ traces: [trace] }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success! Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(result, null, 2));
    } else {
      console.log(`   ❌ Failed! Status: ${response.status}`);
      console.log(`   Error:`, JSON.stringify(result, null, 2));
    }
    
    return { name, success: response.ok, traceId: trace.trace_id };
  } catch (error) {
    console.log(`   ❌ Error:`, error);
    return { name, success: false, traceId: trace.trace_id, error };
  }
}

// Main execution
async function main() {
  console.log('🚀 AMP SDK E2E Validation Test');
  console.log('================================');
  console.log(`API Key: ${API_KEY.substring(0, 15)}...`);
  console.log(`Ingestion URL: ${INGESTION_URL}`);
  console.log('');
  
  const results = [];
  
  // Send all test traces
  results.push(await sendTrace('LLM Trace (sdk-llm-01)', llmTrace));
  results.push(await sendTrace('Tool Trace (sdk-tool-02)', toolTrace));
  results.push(await sendTrace('RAG Trace (sdk-rag-03)', ragTrace));
  results.push(await sendTrace('Agent Trace (sdk-agent-04)', agentTrace));
  results.push(await sendTrace('Multi-Agent Trace (sdk-multi-05)', multiAgentTrace));
  
  // Summary
  console.log('\n📊 Summary');
  console.log('================================');
  const successful = results.filter(r => r.success).length;
  console.log(`Total: ${results.length}, Success: ${successful}, Failed: ${results.length - successful}`);
  
  console.log('\n🔍 Trace IDs for UI Verification:');
  results.forEach(r => {
    console.log(`   ${r.success ? '✅' : '❌'} ${r.name}: ${r.traceId}`);
  });
  
  console.log('\n💡 Look for traces with prefixes:');
  console.log('   - sdk-llm-01-*');
  console.log('   - sdk-tool-02-*');
  console.log('   - sdk-rag-03-*');
  console.log('   - sdk-agent-04-*');
  console.log('   - sdk-multi-05-*');
}

main().catch(console.error);


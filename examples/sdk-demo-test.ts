/**
 * SDK Demo Test - Proper fields for each span type
 */

import { AMP } from '../packages/core/src';

const API_KEY = 'sk-acp-694aa356-e40311186d9540e588fc28a9ed6e800e';
const suffix = 'test2-' + Date.now().toString(36).slice(-4);

async function main() {
  console.log('🚀 AMP SDK Demo Test');
  console.log('====================');
  console.log(`Suffix: ${suffix}\n`);

  const amp = new AMP({
    apiKey: API_KEY,
    baseURL: 'http://localhost:3004',
    debug: true,
  });

  // ===== 1. LLM Chat Completion =====
  // Input: llm_input_messages, Output: llm_output_messages
  console.log('📤 1. LLM Chat Completion...');
  const llmTrace = amp.trace(`llm-chat-${suffix}`, { sessionId: `sdk-test2-llm-${suffix}` });
  
  const llmSpan = llmTrace.startLLMSpan('OpenAI Chat', 'openai', 'gpt-4-turbo');
  llmSpan.setTokens(256, 128);
  llmSpan.setAttribute('gen_ai.operation.name', 'chat');
  llmSpan.setAttribute('gen_ai.request.temperature', 0.7);
  llmSpan.setAttribute('llm_input_messages', JSON.stringify([
    { role: 'system', content: 'You are a helpful AI assistant.' },
    { role: 'user', content: 'Explain quantum computing in simple terms' }
  ]));
  llmSpan.setAttribute('llm_output_messages', JSON.stringify([
    { role: 'assistant', content: 'Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, unlike classical bits. This allows quantum computers to process many possibilities at once.' }
  ]));
  llmSpan.end();
  llmTrace.end();
  console.log(`   Session: sdk-test2-llm-${suffix}`);

  // ===== 2. Tool/Function Call =====
  // Input: tool_parameters, Output: tool_result
  console.log('\n📤 2. Tool Function Call...');
  const toolTrace = amp.trace(`tool-search-${suffix}`, { sessionId: `sdk-test2-tool-${suffix}` });
  
  const toolSpan = toolTrace.startToolSpan('Web Search', 'google_search');
  toolSpan.setAttribute('tool.type', 'function');
  toolSpan.setAttribute('tool.status', 'SUCCESS');
  toolSpan.setAttribute('tool.latency_ms', 342);
  toolSpan.setAttribute('gen_ai.tool.name', 'google_search');
  toolSpan.setAttribute('gen_ai.tool.type', 'function');
  toolSpan.setAttribute('framework', 'langchain');
  toolSpan.setAttribute('tool_parameters', JSON.stringify({
    query: 'latest AI observability tools 2024',
    num_results: 5
  }));
  toolSpan.setAttribute('tool_result', JSON.stringify({
    results: [
      { title: 'LangSmith', url: 'https://langsmith.com' },
      { title: 'Arize AI', url: 'https://arize.com' }
    ]
  }));
  toolSpan.end();
  toolTrace.end();
  console.log(`   Session: sdk-test2-tool-${suffix}`);

  // ===== 3. RAG Retrieval =====
  // Input: user_query, Output: retrieved_context
  console.log('\n📤 3. RAG Vector Retrieval...');
  const ragTrace = amp.trace(`rag-retrieval-${suffix}`, { sessionId: `sdk-test2-rag-${suffix}` });
  
  const ragSpan = ragTrace.startRAGSpan('Vector Search', 'pinecone');
  ragSpan.setAttribute('retrieval_method', 'vector_search');
  ragSpan.setAttribute('retrieval.method', 'vector_search');
  ragSpan.setAttribute('context_count', 3);
  ragSpan.setAttribute('similarity_threshold', 0.82);
  ragSpan.setAttribute('user_query', 'What are the best practices for Node.js API security?');
  ragSpan.setAttribute('retrieved_context', JSON.stringify([
    { content: 'Always validate user input...', score: 0.94 },
    { content: 'Use HTTPS for all communications...', score: 0.91 },
    { content: 'Enable CORS only for trusted origins...', score: 0.87 }
  ]));
  ragSpan.end();
  ragTrace.end();
  console.log(`   Session: sdk-test2-rag-${suffix}`);

  // ===== 4. AI Agent =====
  // Key fields: agent.task, agent.role, iterations
  console.log('\n📤 4. AI Agent Execution...');
  const agentTrace = amp.trace(`agent-research-${suffix}`, { sessionId: `sdk-test2-agent-${suffix}` });
  
  const agentSpan = agentTrace.startAgentSpan('Research Agent', 'ResearchBot', 'research');
  agentSpan.setAttribute('agent.id', `agent-${suffix}`);
  agentSpan.setAttribute('agent.role', 'researcher');
  agentSpan.setAttribute('agent.task', 'Analyze market trends for AI observability tools');
  agentSpan.setAttribute('agent.iterations', 3);
  agentSpan.setAttribute('gen_ai.agent.id', `agent-${suffix}`);
  agentSpan.setAttribute('gen_ai.agent.name', 'ResearchBot');
  agentSpan.setAttribute('framework', 'langchain');
  agentSpan.end();
  agentTrace.end();
  console.log(`   Session: sdk-test2-agent-${suffix}`);

  // ===== 5. Multi-Agent Crew =====
  // Key fields: chain_type, crew.name, is_multi_agent
  console.log('\n📤 5. Multi-Agent CrewAI...');
  const crewTrace = amp.trace(`crew-content-${suffix}`, { sessionId: `sdk-test2-crew-${suffix}` });
  
  const orchSpan = crewTrace.startSpan('Content Crew', { type: 'orchestration' });
  orchSpan.setAttribute('chain_type', 'CrewAI');
  orchSpan.setAttribute('chain.type', 'CrewAI');
  orchSpan.setAttribute('chain.total_steps', 2);
  orchSpan.setAttribute('framework', 'crewai');
  orchSpan.setAttribute('crew.id', `crew-${suffix}`);
  orchSpan.setAttribute('crew.name', 'ContentCreationCrew');
  orchSpan.setAttribute('is_multi_agent', true);
  
  const writerSpan = crewTrace.startAgentSpan('Writer', 'ContentWriter', 'writer');
  writerSpan.setAttribute('agent.id', `writer-${suffix}`);
  writerSpan.setAttribute('agent.task', 'Write blog post');
  writerSpan.setAttribute('gen_ai.agent.id', `writer-${suffix}`);
  writerSpan.setAttribute('framework', 'crewai');
  writerSpan.end();
  
  const editorSpan = crewTrace.startAgentSpan('Editor', 'ContentEditor', 'editor');
  editorSpan.setAttribute('agent.id', `editor-${suffix}`);
  editorSpan.setAttribute('agent.task', 'Review and polish');
  editorSpan.setAttribute('gen_ai.agent.id', `editor-${suffix}`);
  editorSpan.setAttribute('framework', 'crewai');
  editorSpan.end();
  
  orchSpan.end();
  crewTrace.end();
  console.log(`   Session: sdk-test2-crew-${suffix}`);

  // ===== Flush =====
  console.log('\n⏳ Flushing...');
  try {
    await amp.flush();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Failed:', error);
  }

  console.log('\n📊 Sessions (search for these in UI):');
  console.log(`1. sdk-test2-llm-${suffix}`);
  console.log(`2. sdk-test2-tool-${suffix}`);
  console.log(`3. sdk-test2-rag-${suffix}`);
  console.log(`4. sdk-test2-agent-${suffix}`);
  console.log(`5. sdk-test2-crew-${suffix}`);

  await amp.shutdown();
}

main().catch(console.error);

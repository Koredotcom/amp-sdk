"use strict";
/**
 * SDK Demo Test - Demonstrates all span types and session-based tracing
 *
 * Usage:
 *   AMP_API_KEY=your-api-key npx tsx examples/sdk-demo-test.ts
 *
 * Optional:
 *   AMP_BASE_URL=https://amp.kore.ai (default)
 *
 * This script demonstrates:
 *   1. LLM Chat Completion - Basic LLM interaction
 *   2. Tool Function Call - External tool/function invocation
 *   3. RAG Vector Retrieval - Retrieval-augmented generation
 *   4. AI Agent Execution - Single agent with task
 *   5. Multi-Agent Workflow - Orchestrated multi-agent system
 *   6. Conversational Session - Multiple traces in one session (chat flow)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../packages/core/src");
// Get API key from environment variable
const API_KEY = process.env.AMP_API_KEY;
if (!API_KEY) {
    console.error('Error: AMP_API_KEY environment variable is required');
    console.error('Usage: AMP_API_KEY=your-api-key npx tsx examples/sdk-demo-test.ts');
    process.exit(1);
}
// Optional: Override base URL (defaults to https://amp.kore.ai)
const BASE_URL = process.env.AMP_BASE_URL;
const suffix = 'demo-' + Date.now().toString(36).slice(-4);
async function main() {
    console.log('AMP SDK Demo Test');
    console.log('=================');
    console.log(`Session suffix: ${suffix}\n`);
    const amp = new src_1.AMP({
        apiKey: API_KEY,
        ...(BASE_URL && { baseURL: BASE_URL }),
        debug: true,
    });
    // ===== 1. LLM Chat Completion =====
    // Uses setMessages() which sets both OTEL GenAI and OpenInference standard keys
    console.log('📤 1. LLM Chat Completion...');
    const llmTrace = amp.trace(`llm-chat-${suffix}`, { sessionId: `sdk-test2-llm-${suffix}` });
    const llmSpan = llmTrace.startLLMSpan('OpenAI Chat', 'openai', 'gpt-4-turbo');
    llmSpan.setTokens(256, 128);
    llmSpan.setOperation('chat');
    llmSpan.setLLMParams({ temperature: 0.7, maxTokens: 1000 });
    llmSpan.setMessages([
        { role: 'system', content: 'You are a helpful AI assistant.' },
        { role: 'user', content: 'Explain quantum computing in simple terms' }
    ], [
        { role: 'assistant', content: 'Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, unlike classical bits. This allows quantum computers to process many possibilities at once.' }
    ]);
    llmSpan.setLLMResponse('stop', 'chatcmpl-demo123');
    llmSpan.setCost(0.0045);
    llmSpan.end();
    llmTrace.end();
    console.log(`   Session: sdk-test2-llm-${suffix}`);
    // ===== 2. Tool/Function Call =====
    // Input: tool.parameters, Output: tool.result (extracted to tool_parameters/tool_result columns)
    console.log('\n📤 2. Tool Function Call...');
    const toolTrace = amp.trace(`tool-search-${suffix}`, { sessionId: `sdk-test2-tool-${suffix}` });
    const toolSpan = toolTrace.startToolSpan('Web Search', 'google_search');
    // Use setTool() to properly set tool.parameters and tool.result for extraction
    toolSpan.setTool('google_search', { query: 'latest AI observability tools 2024', num_results: 5 }, { results: [
            { title: 'LangSmith', url: 'https://langsmith.com' },
            { title: 'Arize AI', url: 'https://arize.com' }
        ]
    });
    toolSpan.setToolInfo('function', 'Search the web using Google');
    toolSpan.setAttribute('tool.status', 'SUCCESS');
    toolSpan.setAttribute('tool.latency_ms', 342);
    toolSpan.setAttribute('framework', 'langchain');
    toolSpan.end();
    toolTrace.end();
    console.log(`   Session: sdk-test2-tool-${suffix}`);
    // ===== 3. RAG Retrieval =====
    // Input: user_query, Output: retrieved_context (extracted to proper columns)
    console.log('\n📤 3. RAG Vector Retrieval...');
    const ragTrace = amp.trace(`rag-retrieval-${suffix}`, { sessionId: `sdk-test2-rag-${suffix}` });
    const ragSpan = ragTrace.startRAGSpan('Vector Search', 'pinecone');
    // Use SDK methods for proper extraction
    ragSpan.setRAG('pinecone', 'vector_search', 3);
    ragSpan.setUserQuery('What are the best practices for Node.js API security?');
    ragSpan.setRetrievedContext([
        { doc_id: 'doc-001', content: 'Always validate user input to prevent injection attacks...', score: 0.94 },
        { doc_id: 'doc-002', content: 'Use HTTPS for all communications to ensure data encryption...', score: 0.91 },
        { doc_id: 'doc-003', content: 'Enable CORS only for trusted origins to prevent XSS...', score: 0.87 }
    ]);
    ragSpan.setRAGParams({ topK: 3, similarityThreshold: 0.82, indexName: 'security-docs' });
    ragSpan.end();
    ragTrace.end();
    console.log(`   Session: sdk-test2-rag-${suffix}`);
    // ===== 4. AI Agent =====
    // Uses setAgent() and setAgentDetails() for proper agent metadata
    console.log('\n📤 4. AI Agent Execution...');
    const agentTrace = amp.trace(`agent-research-${suffix}`, { sessionId: `sdk-test2-agent-${suffix}` });
    const agentSpan = agentTrace.startAgentSpan('Research Agent', 'ResearchBot', 'research');
    agentSpan.setAgent('ResearchBot', 'research', 'Analyze market trends for AI observability tools');
    agentSpan.setAgentDetails({
        id: `agent-${suffix}`,
        description: 'AI research assistant for market analysis',
        role: 'researcher',
        status: 'completed',
        steps: 3,
        maxIterations: 10,
    });
    agentSpan.setFramework('langchain', '0.1.0');
    agentSpan.setAttribute('agent.task', 'Analyze market trends for AI observability tools');
    agentSpan.setAttribute('agent.llm_calls', 5);
    agentSpan.setAttribute('agent.tool_calls', 3);
    agentSpan.setAttribute('agent.tokens_used', 2450);
    agentSpan.setAttribute('latency_ms', 8500);
    agentSpan.setCost(0.0234);
    agentSpan.end();
    agentTrace.end();
    console.log(`   Session: sdk-test2-agent-${suffix}`);
    // ===== 5. Multi-Agent Workflow =====
    // Uses setChain() for orchestration and proper agent methods
    console.log('\n📤 5. Multi-Agent Workflow...');
    const workflowTrace = amp.trace(`workflow-content-${suffix}`, { sessionId: `sdk-test2-workflow-${suffix}` });
    const orchSpan = workflowTrace.startSpan('Content Pipeline', { type: 'orchestration' });
    orchSpan.setChain('multi_agent_workflow');
    orchSpan.setFramework('langgraph', '0.0.40');
    orchSpan.setAttribute('chain.total_steps', 2);
    orchSpan.setAttribute('workflow.id', `workflow-${suffix}`);
    orchSpan.setAttribute('workflow.name', 'ContentCreationPipeline');
    orchSpan.setAttribute('is_multi_agent', true);
    const writerSpan = workflowTrace.startAgentSpan('Writer Agent', 'ContentWriter', 'writer');
    writerSpan.setAgent('ContentWriter', 'writer', 'Write blog post about AI observability');
    writerSpan.setAgentDetails({ id: `writer-${suffix}`, role: 'writer', status: 'completed', steps: 2 });
    writerSpan.setFramework('langgraph', '0.0.40');
    writerSpan.setAttribute('agent.llm_calls', 3);
    writerSpan.setAttribute('agent.tokens_used', 1850);
    writerSpan.setCost(0.0156);
    writerSpan.end();
    const editorSpan = workflowTrace.startAgentSpan('Editor Agent', 'ContentEditor', 'editor');
    editorSpan.setAgent('ContentEditor', 'editor', 'Review, fact-check and polish content');
    editorSpan.setAgentDetails({ id: `editor-${suffix}`, role: 'editor', status: 'completed', steps: 1 });
    editorSpan.setFramework('langgraph', '0.0.40');
    editorSpan.setAttribute('agent.llm_calls', 2);
    editorSpan.setAttribute('agent.tokens_used', 920);
    editorSpan.setCost(0.0078);
    editorSpan.end();
    orchSpan.end();
    workflowTrace.end();
    console.log(`   Session: sdk-test2-workflow-${suffix}`);
    // ===== 6. Conversational Session (Multiple Traces, Same Session) =====
    // Demonstrates a multi-turn conversation with RAG + LLM in each turn
    console.log('\n📤 6. Conversational Session (3 turns)...');
    const chatSessionId = `sdk-test2-chat-${suffix}`;
    // Turn 1: User asks about product features
    const turn1Trace = amp.trace(`chat-turn-1-${suffix}`, { sessionId: chatSessionId });
    const turn1Rag = turn1Trace.startRAGSpan('Knowledge Retrieval', 'pinecone');
    turn1Rag.setRAG('pinecone', 'vector_search', 2);
    turn1Rag.setUserQuery('What features does your AI platform offer?');
    turn1Rag.setRetrievedContext([
        { doc_id: 'feat-001', content: 'Real-time AI observability and monitoring', score: 0.95 },
        { doc_id: 'feat-002', content: 'Multi-model support including OpenAI, Anthropic', score: 0.92 }
    ]);
    turn1Rag.end();
    const turn1Llm = turn1Trace.startLLMSpan('Generate Response', 'openai', 'gpt-4');
    turn1Llm.setTokens(150, 85);
    turn1Llm.setOperation('chat');
    turn1Llm.setMessages([{ role: 'user', content: 'What features does your AI platform offer?' }], [{ role: 'assistant', content: 'Our AI platform offers real-time observability, multi-model support, and comprehensive monitoring capabilities.' }]);
    turn1Llm.setLLMResponse('stop');
    turn1Llm.end();
    turn1Trace.end();
    // Turn 2: Follow-up about pricing
    const turn2Trace = amp.trace(`chat-turn-2-${suffix}`, { sessionId: chatSessionId });
    const turn2Tool = turn2Trace.startToolSpan('Pricing Lookup', 'pricing_api');
    turn2Tool.setTool('pricing_api', { plan_type: 'enterprise' }, { plans: ['Starter: $99/mo', 'Pro: $299/mo', 'Enterprise: Custom'] });
    turn2Tool.setToolStatus('success', 45);
    turn2Tool.end();
    const turn2Llm = turn2Trace.startLLMSpan('Generate Response', 'openai', 'gpt-4');
    turn2Llm.setTokens(120, 95);
    turn2Llm.setOperation('chat');
    turn2Llm.setMessages([{ role: 'user', content: 'What are your pricing plans?' }], [{ role: 'assistant', content: 'We offer Starter at $99/mo, Pro at $299/mo, and custom Enterprise pricing.' }]);
    turn2Llm.setLLMResponse('stop');
    turn2Llm.end();
    turn2Trace.end();
    // Turn 3: User asks for demo
    const turn3Trace = amp.trace(`chat-turn-3-${suffix}`, { sessionId: chatSessionId });
    const turn3Agent = turn3Trace.startAgentSpan('Demo Scheduler', 'SchedulerBot', 'scheduler');
    turn3Agent.setAgent('SchedulerBot', 'scheduler', 'Schedule product demo');
    turn3Agent.setAgentDetails({ status: 'completed', steps: 1 });
    turn3Agent.end();
    const turn3Llm = turn3Trace.startLLMSpan('Generate Response', 'openai', 'gpt-4');
    turn3Llm.setTokens(80, 60);
    turn3Llm.setOperation('chat');
    turn3Llm.setMessages([{ role: 'user', content: 'Can I schedule a demo?' }], [{ role: 'assistant', content: 'Absolutely! I have scheduled a demo for you. You will receive a calendar invite shortly.' }]);
    turn3Llm.setLLMResponse('stop');
    turn3Llm.end();
    turn3Trace.end();
    console.log(`   Session: ${chatSessionId} (3 traces, multiple spans each)`);
    // ===== Flush =====
    console.log('\n⏳ Flushing...');
    try {
        await amp.flush();
        console.log('✅ Done!');
    }
    catch (error) {
        console.error('❌ Failed:', error);
    }
    console.log('\n📊 Sessions (search for these in UI):');
    console.log(`1. sdk-test2-llm-${suffix}       - LLM Chat Completion`);
    console.log(`2. sdk-test2-tool-${suffix}      - Tool Function Call`);
    console.log(`3. sdk-test2-rag-${suffix}       - RAG Vector Retrieval`);
    console.log(`4. sdk-test2-agent-${suffix}     - AI Agent Execution`);
    console.log(`5. sdk-test2-workflow-${suffix}  - Multi-Agent Workflow`);
    console.log(`6. sdk-test2-chat-${suffix}      - Conversational Session (3 traces)`);
    await amp.shutdown();
}
main().catch(console.error);

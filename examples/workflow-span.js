"use strict";
/**
 * Workflow Span Example (Multi-Agent)
 *
 * Demonstrates how to create orchestration/workflow spans in AMP SDK.
 * Workflow spans track multi-agent systems where multiple agents collaborate
 * to complete complex tasks.
 *
 * Common frameworks:
 * - LangGraph (multi-agent orchestration)
 * - AutoGen (multi-agent conversations)
 * - Custom workflow engines
 *
 * Usage:
 *   AMP_API_KEY=your-api-key npx ts-node examples/workflow-span.ts
 *   AMP_API_KEY=your-api-key AMP_BASE_URL=https://your-server.com npx ts-node examples/workflow-span.ts
 *
 * Note: Timestamps (start_time, end_time) are captured automatically by the SDK.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../packages/core/src");
// =============================================================================
// CONFIGURATION
// =============================================================================
const API_KEY = process.env.AMP_API_KEY;
if (!API_KEY) {
    console.error('Error: AMP_API_KEY environment variable is required');
    console.error('Usage: AMP_API_KEY=your-api-key npx ts-node examples/workflow-span.ts');
    process.exit(1);
}
const BASE_URL = process.env.AMP_BASE_URL;
// =============================================================================
// MAIN EXAMPLE
// =============================================================================
async function main() {
    console.log('Workflow Span Example (Multi-Agent)\n');
    const amp = new src_1.AMP({
        apiKey: API_KEY,
        ...(BASE_URL && { baseURL: BASE_URL }),
        debug: true,
    });
    const sessionId = process.env.SESSION_ID || `workflow-example-${Date.now()}`;
    // ---------------------------------------------------------------------------
    // Create a trace for multi-agent workflow
    // ---------------------------------------------------------------------------
    const trace = amp.trace('content-creation-workflow', { sessionId });
    // ---------------------------------------------------------------------------
    // Create the orchestration span (parent span for workflow)
    // ---------------------------------------------------------------------------
    // The orchestration span represents the overall workflow
    const workflowSpan = trace.startSpan('Content Pipeline', { type: 'orchestration' });
    // setChain() marks this as a workflow/chain span
    // Parameters:
    //   chainType: string - Type of workflow
    //     'multi_agent_workflow' - Multiple agents collaborating
    //     'sequential'           - Steps run one after another
    //     'parallel'             - Steps run concurrently
    //     'conditional'          - Branching based on conditions
    workflowSpan.setChain('multi_agent_workflow');
    // Set framework - LangGraph for multi-agent orchestration
    workflowSpan.setFramework('langgraph', '0.0.40');
    // Workflow metadata
    workflowSpan.setAttribute('workflow.id', 'wf-content-001');
    workflowSpan.setAttribute('workflow.name', 'ContentCreationPipeline');
    workflowSpan.setAttribute('chain.total_steps', 3);
    workflowSpan.setAttribute('is_multi_agent', true);
    // Multi-agent coordination attributes
    workflowSpan.setAttribute('agent.collaboration_mode', 'sequential');
    workflowSpan.setAttribute('agent.team_id', 'team-content');
    // ---------------------------------------------------------------------------
    // Agent 1: Research Agent (child of workflow)
    // ---------------------------------------------------------------------------
    const researchAgent = workflowSpan.startChildSpan('Research Phase', { type: 'agent' });
    researchAgent.setAgent('ResearchAgent', 'researcher', 'Gather information and data');
    researchAgent.setAgentDetails({
        id: 'agent-research-001',
        role: 'researcher',
        status: 'completed',
        steps: 3,
    });
    researchAgent.setFramework('langgraph', '0.0.40');
    // Task info
    researchAgent.setAttribute('agent.task', 'Research AI observability best practices');
    researchAgent.setAttribute('agent.iterations', 3);
    researchAgent.setAttribute('chain.execution_order', 1);
    // Performance metrics
    researchAgent.setAttribute('latency_ms', 12500);
    researchAgent.setTokens(2500, 1200);
    researchAgent.setCost(0.0245);
    // Child LLM call within research agent
    const researchLlm = researchAgent.startChildLLMSpan('Research LLM Call', 'openai', 'gpt-4');
    researchLlm.setTokens(800, 400);
    researchLlm.setCost(0.012);
    researchLlm.setOperation('chat');
    researchLlm.setMessages([
        { role: 'system', content: 'You are a research assistant specializing in AI observability.' },
        { role: 'user', content: 'Research the best practices for AI observability in production systems.' }
    ], [
        { role: 'assistant', content: 'Key best practices for AI observability include: 1) Track token usage and costs per request, 2) Monitor latency at each pipeline stage, 3) Log prompts and completions for debugging, 4) Set up alerts for error rates and anomalies.' }
    ]);
    researchLlm.setLLMResponse('stop', 'chatcmpl-research-001');
    researchLlm.end();
    researchAgent.end();
    // ---------------------------------------------------------------------------
    // Agent 2: Writer Agent (child of workflow)
    // ---------------------------------------------------------------------------
    const writerAgent = workflowSpan.startChildSpan('Writing Phase', { type: 'agent' });
    writerAgent.setAgent('WriterAgent', 'writer', 'Create content based on research');
    writerAgent.setAgentDetails({
        id: 'agent-writer-001',
        role: 'writer',
        status: 'completed',
        steps: 2,
    });
    writerAgent.setFramework('langgraph', '0.0.40');
    // Task info
    writerAgent.setAttribute('agent.task', 'Write blog post about AI observability');
    writerAgent.setAttribute('agent.iterations', 2);
    writerAgent.setAttribute('chain.execution_order', 2);
    // Performance metrics
    writerAgent.setAttribute('latency_ms', 18200);
    writerAgent.setTokens(1800, 3500);
    writerAgent.setCost(0.0412);
    // Child RAG call within writer agent
    const writerRag = writerAgent.startChildRAGSpan('Retrieve Examples', 'pinecone');
    writerRag.setRAG('pinecone', 'vector_search', 3);
    writerRag.setUserQuery('AI observability blog examples');
    writerRag.setRetrievedContext([
        { doc_id: 'ex-001', content: 'Example blog structure for technical content...', score: 0.92 },
        { doc_id: 'ex-002', content: 'Best practices for AI documentation...', score: 0.88 },
    ]);
    writerRag.setAttribute('latency_ms', 145);
    writerRag.end();
    writerAgent.end();
    // ---------------------------------------------------------------------------
    // Agent 3: Editor Agent (child of workflow)
    // ---------------------------------------------------------------------------
    const editorAgent = workflowSpan.startChildSpan('Editing Phase', { type: 'agent' });
    editorAgent.setAgent('EditorAgent', 'editor', 'Review and polish content');
    editorAgent.setAgentDetails({
        id: 'agent-editor-001',
        role: 'editor',
        status: 'completed',
        steps: 2,
    });
    editorAgent.setFramework('langgraph', '0.0.40');
    // Task info
    editorAgent.setAttribute('agent.task', 'Review, fact-check and polish the blog post');
    editorAgent.setAttribute('agent.iterations', 2);
    editorAgent.setAttribute('chain.execution_order', 3);
    // Performance metrics
    editorAgent.setAttribute('latency_ms', 8900);
    editorAgent.setTokens(3200, 1800);
    editorAgent.setCost(0.0298);
    // Child tool call within editor agent
    const editorTool = editorAgent.startChildToolSpan('Grammar Check', 'grammarly_api');
    editorTool.setTool('grammarly_api', { text: 'Blog post content to check...' }, { suggestions: 5, score: 94 });
    editorTool.setAttribute('latency_ms', 230);
    editorTool.end();
    editorAgent.end();
    // ---------------------------------------------------------------------------
    // Complete the workflow span with aggregate metrics
    // ---------------------------------------------------------------------------
    // Total workflow metrics
    workflowSpan.setAttribute('latency_ms', 39600); // Sum of all agents
    workflowSpan.setTokens(7500, 6500); // Aggregate tokens
    workflowSpan.setCost(0.0955); // Total cost
    // Service info
    workflowSpan.setAttribute('service.name', 'workflow-orchestrator');
    workflowSpan.setAttribute('service.version', '1.0.0');
    workflowSpan.end();
    // ---------------------------------------------------------------------------
    // End the trace
    // ---------------------------------------------------------------------------
    trace.end();
    await amp.flush();
    console.log(`\nSession ID: ${sessionId}`);
    console.log('Check this session in the AMP UI to see the workflow with 3 agents');
    await amp.shutdown();
}
// =============================================================================
// AVAILABLE WORKFLOW/ORCHESTRATION METHODS REFERENCE
// =============================================================================
/*
  startSpan(name, { type: 'orchestration' })
                                    - Create an orchestration/workflow span

  setChain(chainType)               - Set workflow type
                                      'multi_agent_workflow' - Multiple agents
                                      'sequential' - Steps in order
                                      'parallel' - Concurrent steps
                                      'conditional' - Branching logic

  setFramework(framework, version?) - Set framework
                                      'langgraph' for multi-agent
                                      'langchain' for chains

  setTokens(input, output)          - Aggregate token counts

  setCost(costUsd)                  - Total workflow cost

  setAttribute(key, value)          - Set any custom attribute

  end()                             - Mark span as complete

  -------------------------------------------------------------------------
  SUPPORTED ATTRIBUTES (Workflow/Orchestration):
  -------------------------------------------------------------------------
  chain.type                - Workflow type (multi_agent_workflow, sequential)
  chain.total_steps         - Total steps in workflow
  chain.execution_order     - Step order (for child spans)
  workflow.id               - Unique workflow ID
  workflow.name             - Workflow name
  is_multi_agent            - Multi-agent flag
  agent.collaboration_mode  - sequential | parallel | hierarchical
  agent.team_id             - Team identifier
  framework                 - Framework name (langgraph)
  framework.version         - Framework version
  latency_ms                - Total execution time
  span_cost_usd             - Total cost
  service.name              - Service name

  -------------------------------------------------------------------------
  HIERARCHY (with child spans):
  -------------------------------------------------------------------------
  Trace (content-creation-workflow)
    └─ Orchestration Span (Content Pipeline)          [parent]
         ├─ Agent Span (Research Phase)               [child of orchestration]
         │    └─ LLM Span (Research LLM Call)         [child of research agent]
         ├─ Agent Span (Writing Phase)                [child of orchestration]
         │    └─ RAG Span (Retrieve Examples)         [child of writer agent]
         └─ Agent Span (Editing Phase)                [child of orchestration]
              └─ Tool Span (Grammar Check)            [child of editor agent]

  -------------------------------------------------------------------------
  AUTOMATIC TIMESTAMPS:
  -------------------------------------------------------------------------
  start_time                - Captured when span is created
  end_time                  - Captured when end() is called
  duration_ms               - Calculated by backend from timestamps
*/
main().catch(console.error);

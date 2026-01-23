/**
 * Agent Span Example
 *
 * Demonstrates how to create Agent spans in AMP SDK.
 * Agent spans track autonomous AI agents that reason, plan, and execute tasks.
 *
 * Common frameworks:
 * - LangChain Agents (single agent)
 * - LangGraph (multi-agent workflows)
 * - AutoGen
 * - Custom implementations
 *
 * Usage:
 *   AMP_API_KEY=your-api-key npx ts-node examples/agent-span.ts
 *   AMP_API_KEY=your-api-key AMP_BASE_URL=https://your-server.com npx ts-node examples/agent-span.ts
 *
 * Note: Timestamps (start_time, end_time) are captured automatically by the SDK.
 */

import { AMP } from '@koreaiinc/amp-sdk';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_KEY = process.env.AMP_API_KEY;
if (!API_KEY) {
  console.error('Error: AMP_API_KEY environment variable is required');
  console.error('Usage: AMP_API_KEY=your-api-key npx ts-node examples/agent-span.ts');
  process.exit(1);
}

const BASE_URL = process.env.AMP_BASE_URL;

// Helper to simulate async operations (for realistic timestamps)
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// MAIN EXAMPLE
// =============================================================================

async function main() {
  console.log('Agent Span Example\n');

  const amp = new AMP({
    apiKey: API_KEY,
    ...(BASE_URL && { baseURL: BASE_URL }),
    debug: true,
  });

  const sessionId = process.env.SESSION_ID || `agent-example-${Date.now()}`;

  // ---------------------------------------------------------------------------
  // Create a trace with an agent span
  // ---------------------------------------------------------------------------

  const trace = amp.trace('research-task', { sessionId });

  // startAgentSpan() creates an agent span
  // Parameters:
  //   name: string      - Display name for this agent execution
  //   agentName: string - The agent's identifier/name
  //   agentType: string - Type: research, writer, coder, planner, etc.
  const agentSpan = trace.startAgentSpan('Market Research', 'ResearchAgent', 'research');

  // ---------------------------------------------------------------------------
  // Set agent info using setAgent()
  // ---------------------------------------------------------------------------

  // setAgent() sets core agent information
  agentSpan.setAgent(
    'ResearchAgent',
    'research',
    'Analyze market trends and compile competitive intelligence report'
  );

  // ---------------------------------------------------------------------------
  // Set agent details using setAgentDetails()
  // ---------------------------------------------------------------------------

  agentSpan.setAgentDetails({
    id: 'agent-research-001',
    description: 'AI research assistant specialized in market analysis',
    role: 'researcher',
    status: 'completed',      // 'running' | 'completed' | 'failed'
    steps: 5,
    maxIterations: 10,
  });

  // ---------------------------------------------------------------------------
  // Set framework info
  // ---------------------------------------------------------------------------

  // For single agents use 'langchain', for multi-agent use 'langgraph'
  agentSpan.setFramework('langchain', '0.1.0');

  // ---------------------------------------------------------------------------
  // Supported attributes via setAttribute()
  // ---------------------------------------------------------------------------

  // Task and iteration tracking
  agentSpan.setAttribute('agent.task', 'Analyze Q4 2024 market trends for AI observability');
  agentSpan.setAttribute('agent.iterations', 5);

  // ---------------------------------------------------------------------------
  // Performance metrics (important for UI visualization)
  // ---------------------------------------------------------------------------

  agentSpan.setAttribute('latency_ms', 45230);           // Total execution time
  agentSpan.setAttribute('agent.llm_calls', 12);         // Number of LLM calls
  agentSpan.setAttribute('agent.tool_calls', 8);         // Number of tool calls
  agentSpan.setAttribute('agent.tokens_used', 15420);    // Total tokens consumed
  agentSpan.setCost(0.0892);                             // Total cost in USD

  // Agent capabilities
  agentSpan.setAttribute('agent.tools', JSON.stringify([
    'web_search', 'document_reader', 'data_analyzer'
  ]));

  // Service info
  agentSpan.setAttribute('service.name', 'agent-service');
  agentSpan.setAttribute('service.version', '2.0.0');

  // ---------------------------------------------------------------------------
  // End the span and trace
  // Timestamps are captured automatically:
  //   - start_time: when span/trace was created
  //   - end_time: when end() is called
  // ---------------------------------------------------------------------------

  // Simulate agent execution time (for realistic timestamps)
  await delay(2000);  // Simulates ~2s agent execution

  agentSpan.end();
  trace.end();

  await amp.flush();

  console.log(`\nSession ID: ${sessionId}`);
  console.log('Check this session in the AMP UI to see the agent span');

  await amp.shutdown();
}

// =============================================================================
// AVAILABLE AGENT SPAN METHODS REFERENCE
// =============================================================================
/*
  startAgentSpan(name, agentName, agentType) - Create an agent span

  setAgent(name, type, goal?)       - Set core agent info

  setAgentDetails({...})            - Set agent metadata
                                      id, description, role, status, steps, maxIterations

  setFramework(framework, version?) - Set framework
                                      langchain (single agent)
                                      langgraph (multi-agent)
                                      autogen, custom, etc.

  setCost(costUsd)                  - Set cost in USD

  setLatency(latencyMs)             - Set latency in milliseconds

  setAttribute(key, value)          - Set any custom attribute

  end()                             - Mark span as complete (captures end_time)

  -------------------------------------------------------------------------
  SUPPORTED ATTRIBUTES:
  -------------------------------------------------------------------------
  gen_ai.agent.id           - Unique agent instance ID
  gen_ai.agent.name         - Agent name
  gen_ai.agent.description  - Agent description
  agent.type                - Agent type classification
  agent.role                - Agent's role in the system
  agent.task                - Current task description
  agent.iterations          - Number of iterations executed
  agent.max_iterations      - Maximum iterations allowed
  framework                 - Framework name
  framework.version         - Framework version
  latency_ms                - Execution time in ms
  span_cost_usd             - Cost in USD
  service.name              - Service name
  service.version           - Service version

  -------------------------------------------------------------------------
  AUTOMATIC TIMESTAMPS:
  -------------------------------------------------------------------------
  start_time                - Captured when span is created
  end_time                  - Captured when end() is called
  duration_ms               - Calculated by backend from timestamps
*/

main().catch(console.error);

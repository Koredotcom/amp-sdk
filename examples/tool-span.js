"use strict";
/**
 * Tool Span Example
 *
 * Demonstrates how to create tool/function call spans in AMP SDK.
 * Tool spans track external tool invocations like API calls, database queries,
 * web searches, or any function calls made by your AI application.
 *
 * Usage:
 *   AMP_API_KEY=your-api-key npx ts-node examples/tool-span.ts
 *   AMP_API_KEY=your-api-key AMP_BASE_URL=https://your-server.com npx ts-node examples/tool-span.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../packages/core/src");
// =============================================================================
// CONFIGURATION
// =============================================================================
// API key is required - get from environment variable
const API_KEY = process.env.AMP_API_KEY;
if (!API_KEY) {
    console.error('Error: AMP_API_KEY environment variable is required');
    console.error('Usage: AMP_API_KEY=your-api-key npx ts-node examples/tool-span.ts');
    process.exit(1);
}
// Base URL is optional - defaults to https://amp.kore.ai
const BASE_URL = process.env.AMP_BASE_URL;
// Helper to simulate async operations (for realistic timestamps)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// =============================================================================
// MAIN EXAMPLE
// =============================================================================
async function main() {
    console.log('Tool Span Example\n');
    // Initialize AMP SDK
    const amp = new src_1.AMP({
        apiKey: API_KEY,
        ...(BASE_URL && { baseURL: BASE_URL }),
        debug: true, // Set to false in production
    });
    // Session ID groups related traces together (e.g., a conversation, user session)
    // You can use your own session ID or let AMP generate one
    const sessionId = process.env.SESSION_ID || `tool-example-${Date.now()}`;
    // ---------------------------------------------------------------------------
    // Create a trace with a tool span
    // ---------------------------------------------------------------------------
    // trace() creates a new trace - the top-level container for spans
    // Parameters:
    //   name: string     - Descriptive name for this trace
    //   options.sessionId - Groups traces into a session (optional but recommended)
    const trace = amp.trace('web-search-task', { sessionId });
    // startToolSpan() creates a tool span
    // Parameters:
    //   name: string     - Display name for this tool call
    //   toolName: string - Identifier of the tool being called
    const toolSpan = trace.startToolSpan('Google Search', 'google_search');
    // ---------------------------------------------------------------------------
    // Set tool input/output using setTool()
    // ---------------------------------------------------------------------------
    // setTool() sets the tool name, input parameters, and output result
    // Parameters:
    //   name: string   - Tool identifier (can override the one in startToolSpan)
    //   params: object - Input parameters passed to the tool (will be shown as Input in UI)
    //   result: object - Output/result from the tool (will be shown as Output in UI)
    toolSpan.setTool('google_search', 
    // Input parameters - what was sent to the tool
    {
        query: 'best practices for AI observability',
        num_results: 5,
        language: 'en',
    }, 
    // Output result - what the tool returned
    {
        results: [
            { title: 'AI Observability Guide', url: 'https://example.com/guide', snippet: 'Learn about...' },
            { title: 'Monitoring LLMs', url: 'https://example.com/llm', snippet: 'Best practices...' },
        ],
        total_results: 2,
        search_time_ms: 145,
    });
    // ---------------------------------------------------------------------------
    // Optional: Set additional tool metadata
    // ---------------------------------------------------------------------------
    // setToolInfo() adds tool type and description
    // Parameters:
    //   type: string        - Tool type: 'function', 'api', 'database', 'retrieval', etc.
    //   description: string - Human-readable description (optional)
    //   callId: string      - Unique call ID for this invocation (optional)
    toolSpan.setToolInfo('function', 'Search the web using Google Search API');
    // setToolStatus() records execution status and timing
    // Parameters:
    //   status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' - Execution result
    //   latencyMs: number   - How long the tool call took in milliseconds (optional)
    //   errorMessage: string - Error details if status is ERROR (optional)
    toolSpan.setToolStatus('SUCCESS', 342);
    // setAttribute() for any custom attributes
    // Common tool attributes:
    //   - framework: string      - Framework used (langchain, llamaindex, etc.)
    //   - tool.version: string   - Version of the tool
    //   - tool.category: string  - Category (search, database, api, etc.)
    toolSpan.setAttribute('framework', 'langchain');
    toolSpan.setAttribute('tool.version', '2.0');
    // ---------------------------------------------------------------------------
    // Simulate tool execution time (for realistic timestamps)
    // In real usage, this would be your actual tool call
    // ---------------------------------------------------------------------------
    await delay(350); // Simulates ~350ms tool execution
    // ---------------------------------------------------------------------------
    // End the span and trace
    // ---------------------------------------------------------------------------
    // Always end spans when the operation completes
    toolSpan.end();
    // End the trace when all spans are complete
    trace.end();
    // ---------------------------------------------------------------------------
    // Flush and shutdown
    // ---------------------------------------------------------------------------
    // flush() sends all queued traces to the server
    await amp.flush();
    console.log(`\nSession ID: ${sessionId}`);
    console.log('Check this session in the AMP UI to see the tool span');
    // shutdown() cleanly closes the SDK (flushes remaining data)
    await amp.shutdown();
}
// =============================================================================
// AVAILABLE TOOL SPAN METHODS REFERENCE
// =============================================================================
/*
  startToolSpan(name, toolName)     - Create a tool span

  setTool(name, params, result)     - Set tool name, input params, and output result
                                      params/result are objects shown as Input/Output in UI

  setToolInfo(type, description?, callId?)
                                    - Set tool type and description
                                      type: 'function' | 'api' | 'database' | 'retrieval'

  setToolStatus(status, latencyMs?, errorMessage?)
                                    - Set execution status
                                      status: 'SUCCESS' | 'ERROR' | 'TIMEOUT'

  setAttribute(key, value)          - Set custom attribute

  end()                             - Mark span as complete

  -------------------------------------------------------------------------
  SUPPORTED ATTRIBUTES:
  -------------------------------------------------------------------------
  tool.name           - Tool identifier
  tool.type           - Tool type (function, api, database, retrieval)
  tool.parameters     - Input parameters (set via setTool)
  tool.result         - Output result (set via setTool)
  tool.status         - Execution status (SUCCESS, ERROR, TIMEOUT)
  tool.latency_ms     - Execution time in ms
  tool.error_message  - Error details if failed
  gen_ai.tool.description - Tool description
  gen_ai.tool.call.id - Unique call ID
  framework           - Framework (langchain, llamaindex, etc.)
  service.name        - Service name
  service.version     - Service version

  -------------------------------------------------------------------------
  AUTOMATIC TIMESTAMPS:
  -------------------------------------------------------------------------
  start_time          - Captured when span is created
  end_time            - Captured when end() is called
  duration_ms         - Calculated by backend from timestamps
*/
main().catch(console.error);

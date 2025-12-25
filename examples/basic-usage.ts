/**
 * Basic AMP SDK Usage
 *
 * This example shows how to:
 * 1. Initialize the SDK
 * 2. Create traces with spans
 * 3. Set LLM attributes
 * 4. Handle errors
 */

import { AMP } from '../packages/core/src';

async function main() {
  // Initialize AMP SDK
  const amp = new AMP({
    apiKey: process.env.AMP_API_KEY || 'sk_test_xxx',
    baseURL: process.env.AMP_BASE_URL || 'http://localhost:3001',
    debug: true, // Enable debug logging
  });

  try {
    // =============================================
    // Example 1: Simple LLM Trace
    // =============================================
    console.log('\n--- Example 1: Simple LLM Trace ---');

    const trace1 = amp.trace('simple-llm-call');

    // Start an LLM span
    const llmSpan = trace1.startLLMSpan('llm.completion', 'openai', 'gpt-4');

    // Simulate LLM call
    await simulateLLMCall();

    // Set token counts
    llmSpan.setTokens(150, 75);
    llmSpan.setLLMResponse('stop', 'chatcmpl-abc123');
    llmSpan.end();

    // End trace (auto-queued for batch send)
    trace1.end();

    console.log('Trace 1 completed:', trace1.traceId);

    // =============================================
    // Example 2: RAG Pipeline Trace
    // =============================================
    console.log('\n--- Example 2: RAG Pipeline Trace ---');

    const trace2 = amp.trace('rag-pipeline');

    // Retrieval span
    const retrievalSpan = trace2.startRAGSpan('retrieval.vector_search', 'pinecone');
    retrievalSpan.setRAG('pinecone', 'vector_search', 5);
    retrievalSpan.setRAGParams({ query: 'What is AMP?', topK: 5 });
    await simulateRetrieval();
    retrievalSpan.end();

    // LLM span with context
    const llmSpan2 = trace2.startLLMSpan('llm.completion', 'openai', 'gpt-4');
    llmSpan2.setTokens(1500, 200); // More tokens due to context
    llmSpan2.setLLMParams({ temperature: 0.7 });
    await simulateLLMCall();
    llmSpan2.end();

    trace2.end();

    console.log('Trace 2 completed:', trace2.traceId);

    // =============================================
    // Example 3: Tool/Function Call Trace
    // =============================================
    console.log('\n--- Example 3: Tool Call Trace ---');

    const trace3 = amp.trace('tool-call-example');

    // LLM decides to call a tool
    const llmSpan3 = trace3.startLLMSpan('llm.completion', 'openai', 'gpt-4');
    llmSpan3.setTokens(50, 30);
    llmSpan3.setLLMResponse('tool_calls');
    llmSpan3.end();

    // Tool execution
    const toolSpan = trace3.startToolSpan('tool.execute', 'get_weather');
    toolSpan.setTool('get_weather', { city: 'San Francisco' }, { temperature: 72, conditions: 'sunny' });
    await simulateToolCall();
    toolSpan.end();

    // LLM processes tool result
    const llmSpan4 = trace3.startLLMSpan('llm.completion', 'openai', 'gpt-4');
    llmSpan4.setTokens(100, 50);
    llmSpan4.setLLMResponse('stop');
    llmSpan4.end();

    trace3.end();

    console.log('Trace 3 completed:', trace3.traceId);

    // =============================================
    // Example 4: Error Handling
    // =============================================
    console.log('\n--- Example 4: Error Handling ---');

    const trace4 = amp.trace('error-example');

    const llmSpan5 = trace4.startLLMSpan('llm.completion', 'openai', 'gpt-4');

    try {
      await simulateError();
    } catch (error) {
      llmSpan5.recordException(error as Error);
    }

    llmSpan5.end();
    trace4.end();

    console.log('Trace 4 completed (with error):', trace4.traceId);

    // =============================================
    // Flush and shutdown
    // =============================================
    console.log('\n--- Flushing traces ---');
    await amp.flush();
    console.log(`Queue size after flush: ${amp.queueSize}`);

    await amp.shutdown();
    console.log('AMP SDK shutdown complete');

  } catch (error) {
    console.error('Error:', error);
    await amp.shutdown();
  }
}

// Simulate async operations
async function simulateLLMCall(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function simulateRetrieval(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function simulateToolCall(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 30));
}

async function simulateError(): Promise<void> {
  throw new Error('Simulated API rate limit error');
}

// Run
main().catch(console.error);


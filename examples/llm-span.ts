/**
 * LLM Span Example
 *
 * Demonstrates how to create LLM (Large Language Model) spans in AMP SDK.
 * LLM spans track AI model interactions including chat completions, embeddings,
 * and other generative AI operations.
 *
 * Usage:
 *   AMP_API_KEY=your-api-key npx ts-node examples/llm-span.ts
 *   AMP_API_KEY=your-api-key AMP_BASE_URL=https://your-server.com npx ts-node examples/llm-span.ts
 */

import { AMP } from '@koreaiinc/amp-sdk';

// =============================================================================
// CONFIGURATION
// =============================================================================

// API key is required - get from environment variable
const API_KEY = process.env.AMP_API_KEY;
if (!API_KEY) {
  console.error('Error: AMP_API_KEY environment variable is required');
  console.error('Usage: AMP_API_KEY=your-api-key npx ts-node examples/llm-span.ts');
  process.exit(1);
}

// Base URL is optional - defaults to https://amp.kore.ai
const BASE_URL = process.env.AMP_BASE_URL;

// Helper to simulate async operations (for realistic timestamps)
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// MAIN EXAMPLE
// =============================================================================

async function main() {
  console.log('LLM Span Example\n');

  // Initialize AMP SDK
  const amp = new AMP({
    apiKey: API_KEY,
    ...(BASE_URL && { baseURL: BASE_URL }),
    debug: true,  // Set to false in production
  });

  // Session ID groups related traces together (e.g., a conversation, user session)
  // You can use your own session ID or let AMP generate one
  const sessionId = process.env.SESSION_ID || `llm-example-${Date.now()}`;

  // ---------------------------------------------------------------------------
  // Create a trace with an LLM span
  // ---------------------------------------------------------------------------

  // trace() creates a new trace - the top-level container for spans
  // Parameters:
  //   name: string     - Descriptive name for this trace
  //   options.sessionId - Groups traces into a session (optional but recommended)
  const trace = amp.trace('chat-completion', { sessionId });

  // startLLMSpan() creates an LLM span with provider and model pre-set
  // Parameters:
  //   name: string     - Display name for this LLM call
  //   provider: string - AI provider (openai, anthropic, google, azure, etc.)
  //   model: string    - Model identifier (gpt-4, claude-3, gemini-pro, etc.)
  const llmSpan = trace.startLLMSpan('Chat Completion', 'openai', 'gpt-4-turbo');

  // ---------------------------------------------------------------------------
  // Set token usage
  // ---------------------------------------------------------------------------

  // setTokens() records input (prompt) and output (completion) token counts
  // Parameters:
  //   inputTokens: number  - Tokens in the prompt/input
  //   outputTokens: number - Tokens in the completion/output
  // The SDK automatically calculates total_tokens
  llmSpan.setTokens(256, 128);

  // ---------------------------------------------------------------------------
  // Set LLM request parameters
  // ---------------------------------------------------------------------------

  // setLLMParams() sets common model parameters
  // All parameters are optional - only set what you use
  llmSpan.setLLMParams({
    temperature: 0.7,        // Randomness (0.0 = deterministic, 2.0 = very random)
    topP: 0.9,               // Nucleus sampling threshold
    maxTokens: 1000,         // Maximum tokens to generate
    frequencyPenalty: 0.0,   // Penalize repeated tokens (-2.0 to 2.0)
    presencePenalty: 0.0,    // Penalize tokens already present (-2.0 to 2.0)
    stopSequences: ['END'],  // Stop generation at these sequences
  });

  // ---------------------------------------------------------------------------
  // Set operation type
  // ---------------------------------------------------------------------------

  // setOperation() specifies the type of LLM operation
  // Common values:
  //   'chat'            - Chat completion (most common)
  //   'text_completion' - Text completion
  //   'embeddings'      - Text embeddings
  llmSpan.setOperation('chat');

  // ---------------------------------------------------------------------------
  // Set input and output messages
  // ---------------------------------------------------------------------------

  // setMessages() records the conversation messages
  // Parameters:
  //   inputMessages: array  - Messages sent to the model
  //   outputMessages: array - Messages received from the model
  //
  // Message format: { role: string, content: string, name?: string }
  // Roles: 'system', 'user', 'assistant', 'tool'
  llmSpan.setMessages(
    // Input messages - what was sent to the model
    [
      { role: 'system', content: 'You are a helpful AI assistant specialized in explaining technical concepts.' },
      { role: 'user', content: 'Explain quantum computing in simple terms' }
    ],
    // Output messages - what the model returned
    [
      { role: 'assistant', content: 'Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously, unlike classical bits that are either 0 or 1. This allows quantum computers to process many possibilities at once, making them potentially much faster for certain types of problems like cryptography and simulation.' }
    ]
  );

  // ---------------------------------------------------------------------------
  // Set response metadata
  // ---------------------------------------------------------------------------

  // setLLMResponse() records completion metadata
  // Parameters:
  //   finishReason: string - Why generation stopped
  //     'stop'           - Natural completion
  //     'length'         - Hit max_tokens limit
  //     'content_filter' - Blocked by content filter
  //     'tool_calls'     - Model wants to call a tool
  //   responseId?: string - Provider's response ID (optional)
  llmSpan.setLLMResponse('stop', 'chatcmpl-abc123xyz');

  // ---------------------------------------------------------------------------
  // Optional: Set cost and additional metadata
  // ---------------------------------------------------------------------------

  // setCost() records the cost of this LLM call in USD
  // Useful for tracking spend across models
  llmSpan.setCost(0.0082);

  // setConversationId() links this span to a conversation thread
  // Use when you need to track multi-turn conversations
  llmSpan.setConversationId('conv-12345');

  // setAttribute() for any custom attributes
  llmSpan.setAttribute('framework', 'langchain');
  llmSpan.setAttribute('service.name', 'my-chatbot');

  // Performance metric - latency in milliseconds
  llmSpan.setAttribute('latency_ms', 1250);

  // ---------------------------------------------------------------------------
  // Simulate LLM call time (for realistic timestamps)
  // In real usage, this would be your actual LLM API call
  // ---------------------------------------------------------------------------
  await delay(1250);  // Simulates ~1.25s LLM response time

  // ---------------------------------------------------------------------------
  // End the span and trace
  // Timestamps are captured automatically:
  //   - start_time: when span/trace was created
  //   - end_time: when end() is called
  // ---------------------------------------------------------------------------

  // Always end spans when the operation completes
  llmSpan.end();

  // End the trace when all spans are complete
  trace.end();

  // ---------------------------------------------------------------------------
  // Flush and shutdown
  // ---------------------------------------------------------------------------

  // flush() sends all queued traces to the server
  await amp.flush();

  console.log(`\nSession ID: ${sessionId}`);
  console.log('Check this session in the AMP UI to see the LLM span');

  // shutdown() cleanly closes the SDK (flushes remaining data)
  await amp.shutdown();
}

// =============================================================================
// AVAILABLE LLM SPAN METHODS REFERENCE
// =============================================================================
/*
  startLLMSpan(name, provider, model)
                                    - Create an LLM span with provider/model set

  setLLM(provider, model, responseModel?)
                                    - Set/change LLM provider and model
                                      responseModel is the actual model used (if different)

  setTokens(inputTokens, outputTokens)
                                    - Set token usage counts
                                      Automatically calculates total_tokens

  setLLMParams({...})               - Set request parameters
                                      temperature, topP, maxTokens, frequencyPenalty,
                                      presencePenalty, stopSequences

  setOperation(operation)           - Set operation type
                                      'chat', 'text_completion', 'embeddings'

  setMessages(input[], output[])    - Set input/output messages (RECOMMENDED)
                                      Message: { role, content, name? }
                                      Sets BOTH standard formats automatically:
                                        - OTEL GenAI: gen_ai.input.messages, gen_ai.output.messages
                                        - OpenInference: llm.input_messages, llm.output_messages

  setSystemPrompt(prompt)           - Set system prompt separately
                                      Sets BOTH standard formats:
                                        - OTEL GenAI: gen_ai.system_instructions
                                        - OpenInference: llm.system_instructions

  setLLMResponse(finishReason, responseId?)
                                    - Set completion metadata
                                      finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls'

  setCost(costUsd)                  - Set cost in USD

  setConversationId(id)             - Link to conversation thread

  setAttribute(key, value)          - Set custom attribute

  recordPrompt(content)             - Record prompt as OTEL event (alternative to setMessages)
                                      Event name: gen_ai.content.prompt

  recordCompletion(content)         - Record completion as OTEL event
                                      Event name: gen_ai.content.completion

  end()                             - Mark span as complete

  -------------------------------------------------------------------------
  SUPPORTED ATTRIBUTES (OTEL GenAI Standard):
  -------------------------------------------------------------------------
  gen_ai.provider.name        - Provider (openai, anthropic, etc.)
  gen_ai.system               - Provider (legacy, use provider.name)
  gen_ai.request.model        - Requested model
  gen_ai.response.model       - Actual model used
  gen_ai.usage.input_tokens   - Input token count
  gen_ai.usage.output_tokens  - Output token count
  gen_ai.usage.total_tokens   - Total token count
  gen_ai.request.temperature  - Temperature setting
  gen_ai.request.top_p        - Top-p sampling
  gen_ai.request.max_tokens   - Max tokens limit
  gen_ai.operation.name       - Operation type (chat, embeddings, etc.)
  gen_ai.response.finish_reason - Why generation stopped
  gen_ai.response.id          - Provider's response ID
  gen_ai.conversation.id      - Conversation thread ID
  gen_ai.input.messages       - Input messages (OTEL GenAI standard)
  gen_ai.output.messages      - Output messages (OTEL GenAI standard)
  gen_ai.system_instructions  - System prompt (OTEL GenAI standard)

  -------------------------------------------------------------------------
  SUPPORTED ATTRIBUTES (OpenInference Standard - Arize/Phoenix):
  -------------------------------------------------------------------------
  llm.input_messages          - Input messages (OpenInference)
  llm.output_messages         - Output messages (OpenInference)
  llm.system_instructions     - System prompt (OpenInference)

  -------------------------------------------------------------------------
  SUPPORTED ATTRIBUTES (AMP Custom):
  -------------------------------------------------------------------------
  span_cost_usd               - Cost in USD
  latency_ms                  - Execution time in ms
  framework                   - Framework (langchain, etc.)
  service.name                - Service name
  service.version             - Service version

  -------------------------------------------------------------------------
  AUTOMATIC TIMESTAMPS:
  -------------------------------------------------------------------------
  start_time                  - Captured when span is created
  end_time                    - Captured when end() is called
  duration_ms                 - Calculated by backend from timestamps
*/

main().catch(console.error);

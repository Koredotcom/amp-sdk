/**
 * OpenAI Integration Example
 *
 * This example shows how to integrate AMP SDK with OpenAI API calls.
 * NOTE: This is a pattern example - OpenAI SDK is not included as a dependency.
 */

import { AMP, Span } from '../packages/core/src';

// Mock OpenAI types (in real usage, import from 'openai')
interface ChatCompletion {
  id: string;
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIClient {
  chat: {
    completions: {
      create: (params: any) => Promise<ChatCompletion>;
    };
  };
}

// Initialize AMP
const amp = new AMP({
  apiKey: process.env.AMP_API_KEY || 'sk_test_xxx',
  baseURL: process.env.AMP_BASE_URL || 'http://localhost:3001',
  debug: true,
});

/**
 * Wrapper function to trace OpenAI calls
 */
async function tracedChatCompletion(
  openai: OpenAIClient,
  params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
  },
  traceName: string = 'openai-chat',
): Promise<ChatCompletion> {
  // Start trace
  const trace = amp.trace(traceName);

  // Create LLM span
  const span = trace.startLLMSpan('llm.completion', 'openai', params.model);

  // Record prompt
  const userMessage = params.messages.find(m => m.role === 'user');
  if (userMessage) {
    span.recordPrompt(userMessage.content);
  }

  // Set request params
  span.setLLMParams({
    temperature: params.temperature,
    maxTokens: params.max_tokens,
  });

  try {
    // Make OpenAI call
    const response = await openai.chat.completions.create(params);

    // Record response
    span.setTokens(response.usage.prompt_tokens, response.usage.completion_tokens);
    span.setLLMResponse(response.choices[0].finish_reason, response.id);
    span.recordCompletion(response.choices[0].message.content);
    span.setOk();

    return response;

  } catch (error) {
    span.recordException(error as Error);
    throw error;

  } finally {
    span.end();
    trace.end();
  }
}

/**
 * Example with tool/function calling
 */
async function tracedToolCall(
  openai: OpenAIClient,
  params: any,
  traceName: string = 'openai-tool-call',
): Promise<any> {
  const trace = amp.trace(traceName);

  // Initial LLM call to decide tool
  const llmSpan1 = trace.startLLMSpan('llm.tool_decision', 'openai', params.model);

  // Simulate response with tool call
  llmSpan1.setLLMResponse('tool_calls');
  llmSpan1.setTokens(50, 30);
  llmSpan1.end();

  // Tool execution span
  const toolSpan = trace.startToolSpan('tool.execute', 'get_weather');
  toolSpan.setTool(
    'get_weather',
    { location: 'San Francisco' },
    { temperature: 72, conditions: 'sunny' }
  );
  // Simulate tool call
  await new Promise(resolve => setTimeout(resolve, 50));
  toolSpan.end();

  // Final LLM call with tool result
  const llmSpan2 = trace.startLLMSpan('llm.completion', 'openai', params.model);
  llmSpan2.setTokens(100, 80);
  llmSpan2.setLLMResponse('stop');
  llmSpan2.end();

  trace.end();

  return { message: 'The weather in San Francisco is 72°F and sunny.' };
}

// =============================================
// Example usage
// =============================================

async function main() {
  // Mock OpenAI client (in real usage, use actual OpenAI SDK)
  const mockOpenAI: OpenAIClient = {
    chat: {
      completions: {
        create: async (params) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            id: 'chatcmpl-' + Math.random().toString(36).substr(2, 9),
            choices: [{
              message: { content: 'This is a mock response from GPT-4.' },
              finish_reason: 'stop',
            }],
            usage: {
              prompt_tokens: 50,
              completion_tokens: 20,
              total_tokens: 70,
            },
          };
        },
      },
    },
  };

  try {
    console.log('\n--- Example 1: Basic Chat Completion ---');
    const response1 = await tracedChatCompletion(mockOpenAI, {
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'What is the capital of France?' }
      ],
      temperature: 0.7,
    });
    console.log('Response:', response1.choices[0].message.content);

    console.log('\n--- Example 2: Tool Calling ---');
    const response2 = await tracedToolCall(mockOpenAI, {
      model: 'gpt-4',
    });
    console.log('Response:', response2.message);

    // Flush and shutdown
    await amp.flush();
    await amp.shutdown();

  } catch (error) {
    console.error('Error:', error);
    await amp.shutdown();
  }
}

main().catch(console.error);


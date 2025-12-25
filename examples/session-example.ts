/**
 * Multi-turn Session Example
 *
 * This example shows how to:
 * 1. Create a session for multi-turn conversations
 * 2. Track multiple traces within the same session
 * 3. Maintain conversation context
 */

import { AMP } from '../packages/core/src';

async function main() {
  const amp = new AMP({
    apiKey: process.env.AMP_API_KEY || 'sk_test_xxx',
    baseURL: process.env.AMP_BASE_URL || 'http://localhost:3001',
    debug: true,
  });

  try {
    // =============================================
    // Create a session for multi-turn conversation
    // =============================================
    const session = amp.session({
      userId: 'user-123',
      metadata: {
        channel: 'web',
        app_version: '2.0.0',
      },
    });

    console.log(`Created session: ${session.sessionId}`);

    // =============================================
    // Turn 1: User asks a question
    // =============================================
    console.log('\n--- Turn 1: Initial question ---');

    const turn1 = session.trace('turn-1');
    turn1.setMetadata('user_message', 'What is machine learning?');

    const span1 = turn1.startLLMSpan('llm.completion', 'openai', 'gpt-4');
    span1.recordPrompt('What is machine learning?');

    // Simulate LLM call
    await delay(100);

    span1.recordCompletion('Machine learning is a subset of AI that enables systems to learn from data...');
    span1.setTokens(10, 150);
    span1.setLLMParams({ temperature: 0.7 });
    span1.end();

    turn1.end();
    console.log(`Turn 1 completed: ${turn1.traceId}`);

    // =============================================
    // Turn 2: Follow-up question
    // =============================================
    console.log('\n--- Turn 2: Follow-up question ---');

    const turn2 = session.trace('turn-2');
    turn2.setMetadata('user_message', 'Can you give me an example?');

    const span2 = turn2.startLLMSpan('llm.completion', 'openai', 'gpt-4');
    span2.recordPrompt('Can you give me an example?');

    await delay(100);

    span2.recordCompletion('Sure! A common example is email spam filtering...');
    span2.setTokens(200, 250); // More context from conversation history
    span2.end();

    turn2.end();
    console.log(`Turn 2 completed: ${turn2.traceId}`);

    // =============================================
    // Turn 3: Complex query with RAG
    // =============================================
    console.log('\n--- Turn 3: Query with RAG ---');

    const turn3 = session.trace('turn-3');
    turn3.setMetadata('user_message', 'How do I implement this in Python?');

    // RAG retrieval
    const ragSpan = turn3.startRAGSpan('retrieval', 'pinecone');
    ragSpan.setRAG('pinecone', 'vector_search', 3);
    ragSpan.setRAGParams({ query: 'Python machine learning implementation' });
    await delay(50);
    ragSpan.end();

    // LLM with context
    const span3 = turn3.startLLMSpan('llm.completion', 'openai', 'gpt-4');
    span3.recordPrompt('How do I implement this in Python?');

    await delay(150);

    span3.recordCompletion('Here\'s a simple implementation using scikit-learn...');
    span3.setTokens(1500, 300); // Lots of context
    span3.end();

    turn3.end();
    console.log(`Turn 3 completed: ${turn3.traceId}`);

    // =============================================
    // End session and flush
    // =============================================
    session.end();

    console.log('\n--- Flushing all traces ---');
    await amp.flush();

    console.log(`Session ${session.sessionId} completed with 3 turns`);

    await amp.shutdown();

  } catch (error) {
    console.error('Error:', error);
    await amp.shutdown();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);


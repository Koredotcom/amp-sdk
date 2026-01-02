"use strict";
/**
 * RAG Span Example
 *
 * Demonstrates how to create RAG (Retrieval-Augmented Generation) spans in AMP SDK.
 * RAG spans track document retrieval operations from vector databases, search engines,
 * or any knowledge retrieval system used to augment LLM responses.
 *
 * Usage:
 *   AMP_API_KEY=your-api-key npx ts-node examples/rag-span.ts
 *   AMP_API_KEY=your-api-key AMP_BASE_URL=https://your-server.com npx ts-node examples/rag-span.ts
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
    console.error('Usage: AMP_API_KEY=your-api-key npx ts-node examples/rag-span.ts');
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
    console.log('RAG Span Example\n');
    // Initialize AMP SDK
    const amp = new src_1.AMP({
        apiKey: API_KEY,
        ...(BASE_URL && { baseURL: BASE_URL }),
        debug: true, // Set to false in production
    });
    // Session ID groups related traces together (e.g., a conversation, user session)
    // You can use your own session ID or let AMP generate one
    const sessionId = process.env.SESSION_ID || `rag-example-${Date.now()}`;
    // ---------------------------------------------------------------------------
    // Create a trace with a RAG span
    // ---------------------------------------------------------------------------
    // trace() creates a new trace - the top-level container for spans
    // Parameters:
    //   name: string     - Descriptive name for this trace
    //   options.sessionId - Groups traces into a session (optional but recommended)
    const trace = amp.trace('knowledge-retrieval', { sessionId });
    // startRAGSpan() creates a RAG span with vector DB pre-set
    // Parameters:
    //   name: string     - Display name for this retrieval operation
    //   vectorDb: string - Vector database (pinecone, weaviate, chroma, qdrant, etc.)
    const ragSpan = trace.startRAGSpan('Document Search', 'pinecone');
    // ---------------------------------------------------------------------------
    // Set RAG configuration using setRAG()
    // ---------------------------------------------------------------------------
    // setRAG() sets core retrieval information
    // Parameters:
    //   vectorDb: string           - Vector database name
    //   method: string             - Retrieval method:
    //     'vector_search'          - Pure vector similarity search
    //     'hybrid_search'          - Combines vector + keyword search
    //     'keyword_search'         - Traditional keyword/BM25 search
    //     'reranking'              - Two-stage retrieval with reranking
    //   documentsRetrieved: number - Number of documents returned
    ragSpan.setRAG('pinecone', 'hybrid_search', 5);
    // ---------------------------------------------------------------------------
    // Set the user query (Input)
    // ---------------------------------------------------------------------------
    // setUserQuery() records what the user asked (the retrieval query)
    // This is the input that drives the retrieval - shows as "Input" in UI
    ragSpan.setUserQuery('What are the best practices for Node.js API security?');
    // ---------------------------------------------------------------------------
    // Set RAG parameters
    // ---------------------------------------------------------------------------
    // setRAGParams() sets retrieval configuration
    // All parameters are optional - only set what you use
    ragSpan.setRAGParams({
        topK: 10, // Maximum documents to retrieve before filtering
        similarityThreshold: 0.75, // Minimum similarity score (0.0 to 1.0)
        embeddingModel: 'text-embedding-3-large', // Model used for embeddings
        indexName: 'security-knowledge-base', // Name of the vector index
        dataSourceId: 'kb-security-docs-v2', // Knowledge base/data source identifier
    });
    // ---------------------------------------------------------------------------
    // Set retrieved context (Output)
    // ---------------------------------------------------------------------------
    // setRetrievedContext() records the documents returned
    // Parameters:
    //   context: array - Array of retrieved documents
    //     doc_id: string  - Document identifier
    //     content: string - Document content/text
    //     score: number   - Similarity/relevance score (0.0 to 1.0)
    //
    // The SDK automatically calculates:
    //   - context_length: Total character count of all documents
    //   - top_score: Highest similarity score among retrieved docs
    ragSpan.setRetrievedContext([
        {
            doc_id: 'sec-001',
            content: 'Always validate and sanitize user input to prevent injection attacks. Use parameterized queries for database operations and escape special characters in user-provided data.',
            score: 0.94,
        },
        {
            doc_id: 'sec-002',
            content: 'Use HTTPS for all communications to ensure data encryption in transit. Configure TLS 1.3 for optimal security and disable older protocols like TLS 1.0 and 1.1.',
            score: 0.91,
        },
        {
            doc_id: 'sec-003',
            content: 'Implement rate limiting to prevent brute force attacks. Use exponential backoff for failed authentication attempts and consider CAPTCHA for repeated failures.',
            score: 0.89,
        },
        {
            doc_id: 'sec-004',
            content: 'Enable CORS only for trusted origins. Implement proper authentication headers and validate all cross-origin requests. Never use wildcard (*) for sensitive endpoints.',
            score: 0.87,
        },
        {
            doc_id: 'sec-005',
            content: 'Store passwords using strong hashing algorithms like bcrypt or Argon2. Never store plaintext passwords and use unique salts for each password hash.',
            score: 0.85,
        },
    ]);
    // ---------------------------------------------------------------------------
    // Additional attributes via setAttribute()
    // ---------------------------------------------------------------------------
    // Common RAG attributes not covered by dedicated methods:
    // db.system - OTEL standard attribute for database system
    // Backend accepts both 'db.system' and 'vector_db'
    ragSpan.setAttribute('db.system', 'pinecone');
    // Framework info
    ragSpan.setAttribute('framework', 'langchain');
    ragSpan.setAttribute('framework.version', '0.1.0');
    // Performance metrics
    ragSpan.setAttribute('retrieval.latency_ms', 145);
    ragSpan.setAttribute('embedding.latency_ms', 32);
    // Vector DB specific attributes
    ragSpan.setAttribute('namespace', 'production');
    ragSpan.setAttribute('collection', 'security-docs');
    // Reranking info (if using reranking)
    ragSpan.setAttribute('reranker.model', 'cohere-rerank-v3');
    ragSpan.setAttribute('reranker.top_n', 5);
    // Chunk/document metadata
    ragSpan.setAttribute('chunk.strategy', 'semantic');
    ragSpan.setAttribute('chunk.size', 512);
    ragSpan.setAttribute('chunk.overlap', 50);
    // Filter criteria used (if any)
    ragSpan.setAttribute('filter.metadata', JSON.stringify({
        category: 'security',
        language: 'en',
        version: '>=2.0',
    }));
    // Service info
    ragSpan.setAttribute('service.name', 'knowledge-retrieval-service');
    ragSpan.setAttribute('service.version', '1.2.0');
    // ---------------------------------------------------------------------------
    // Simulate retrieval time (for realistic timestamps)
    // In real usage, this would be your actual vector DB query
    // ---------------------------------------------------------------------------
    await delay(180); // Simulates ~180ms retrieval time
    // ---------------------------------------------------------------------------
    // End the span and trace
    // ---------------------------------------------------------------------------
    // Always end spans when the operation completes
    ragSpan.end();
    // End the trace when all spans are complete
    trace.end();
    // ---------------------------------------------------------------------------
    // Flush and shutdown
    // ---------------------------------------------------------------------------
    // flush() sends all queued traces to the server
    await amp.flush();
    console.log(`\nSession ID: ${sessionId}`);
    console.log('Check this session in the AMP UI to see the RAG span');
    // shutdown() cleanly closes the SDK (flushes remaining data)
    await amp.shutdown();
}
// =============================================================================
// AVAILABLE RAG SPAN METHODS REFERENCE
// =============================================================================
/*
  startRAGSpan(name, vectorDb)      - Create a RAG span with vector DB set

  setRAG(vectorDb, method, documentsRetrieved)
                                    - Set core RAG info
                                      vectorDb: pinecone, weaviate, chroma, qdrant, milvus, etc.
                                      method: 'vector_search' | 'hybrid_search' |
                                              'keyword_search' | 'reranking'
                                      documentsRetrieved: number of docs returned

  setUserQuery(query)               - Set the retrieval query (Input)
                                      This is what drives the search

  setRAGParams({...})               - Set retrieval parameters
                                      topK: max documents to retrieve
                                      similarityThreshold: minimum score (0.0-1.0)
                                      embeddingModel: model for embeddings
                                      indexName: vector index name
                                      dataSourceId: knowledge base ID

  setRetrievedContext([...])        - Set retrieved documents (Output)
                                      Array of { doc_id, content, score }
                                      Auto-calculates: context_length, top_score

  setAttribute(key, value)          - Set any custom attribute

  end()                             - Mark span as complete

  -------------------------------------------------------------------------
  SUPPORTED ATTRIBUTES:
  -------------------------------------------------------------------------
  user_query                - The retrieval query (Input)
  retrieval_method          - Retrieval strategy used
  retrieved_context         - Retrieved documents JSON (Output)
  context_count             - Number of documents retrieved
  context_length            - Total character count (auto-calculated)
  similarity_threshold      - Minimum similarity score
  retrieval_top_k           - Top-K parameter
  vector_db                 - Vector database name
  db.system                 - OTEL standard: database system
  gen_ai.data_source.id     - Data source identifier
  embedding_model           - Model used for embeddings
  index_name                - Vector index name
  top_score                 - Highest similarity score (auto-calculated)
  documents_retrieved       - Count of documents returned
  framework                 - Framework (langchain, llamaindex, etc.)
  framework.version         - Framework version
  retrieval.latency_ms      - Retrieval time in milliseconds
  embedding.latency_ms      - Embedding generation time
  namespace                 - Pinecone namespace or equivalent
  collection                - Collection name
  reranker.model            - Reranking model used
  reranker.top_n            - Reranking top N
  chunk.strategy            - Chunking strategy
  chunk.size                - Chunk size in tokens/chars
  chunk.overlap             - Chunk overlap
  filter.metadata           - Filter criteria JSON
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

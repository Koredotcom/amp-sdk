/**
 * AMP SDK - Agent Management Platform
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { AMP } from '@amp/sdk';
 *
 * const amp = new AMP({ apiKey: process.env.AMP_API_KEY });
 *
 * // Simple trace
 * const trace = amp.trace('user-query');
 * const span = trace.startLLMSpan('llm.completion', 'openai', 'gpt-4');
 * span.setTokens(150, 75);
 * span.end();
 * trace.end();
 *
 * // Graceful shutdown
 * await amp.shutdown();
 * ```
 */

// Main client
export { AMP, Session, default } from './client';

// Spans
export { Trace, Span } from './spans';

// Batcher
export { BatchProcessor, FetchHTTPClient } from './batcher';
export type { HTTPClient } from './batcher';

// Types
export type {
  // Config
  AMPConfig,
  TraceOptions,
  SpanOptions,
  SessionOptions,
  
  // Span types
  SpanType,
  SpanStatus,
  SpanData,
  SpanAttributes,
  SpanEvent,
  
  // LLM attributes
  LLMAttributes,
  ToolAttributes,
  RAGAttributes,
  AgentAttributes,
  
  // Trace
  TraceData,
  
  // Transcript
  TranscriptData,
  Message,
  MessageRole,
  
  // API
  TelemetryPayload,
  TelemetryResponse,
} from './types';

// Utilities
export {
  generateTraceId,
  generateSpanId,
  generateSessionId,
  now,
  Logger,
} from './utils';


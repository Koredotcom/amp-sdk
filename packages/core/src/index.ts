/**
 * AMP SDK - Agent Management Platform
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { AMP } from '@koreaiinc/amp-sdk';
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
  AMPDefaults,
  TraceOptions,
  SpanOptions,
  SessionOptions,
  ObserveOptions,
  SendRawOptions,

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

// Context
export { runWithContext, getContext } from './context';
export type { AgentInfo, ServiceInfo, AMPContext } from './context';

// Decorators
export {
  Trace as TraceDecorator,
  LLMTrace,
  ToolTrace,
  RAGTrace,
  AgentTrace,
  getCurrentSpan,
  getCurrentTrace,
} from './decorators';
export type { TraceDecoratorOptions } from './decorators';

// Utilities
export {
  generateTraceId,
  generateSpanId,
  generateSessionId,
  now,
  Logger,
} from './utils';

// Constants
export {
  DEFAULT_BASE_URL,
  INGEST_ENDPOINT,
  TRANSCRIPT_ENDPOINT,
  DEFAULT_BATCH_SIZE,
  DEFAULT_BATCH_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT,
  SDK_NAME,
  SDK_VERSION,
} from './constants';


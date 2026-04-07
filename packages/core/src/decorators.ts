/**
 * AMP Decorators - Zero-effort instrumentation via TypeScript decorators
 *
 * Supports BOTH decorator formats:
 * - Legacy/experimental: `experimentalDecorators: true` in tsconfig.json
 * - TC39 Stage 3 (2023+): default in modern TypeScript/tsx/esbuild
 *
 * @example
 * ```typescript
 * import { AMP, LLMTrace, ToolTrace, RAGTrace } from '@koreaiinc/amp-sdk';
 *
 * // Initialize once (app startup)
 * AMP.init({ apiKey: process.env.AMP_API_KEY });
 *
 * class MyService {
 *   @LLMTrace('chat', 'openai', 'gpt-4')
 *   async chatCompletion(prompt: string) {
 *     const span = AMP.currentSpan();
 *     span?.setTokens(100, 50);
 *     return await openai.chat.completions.create({ ... });
 *   }
 *
 *   @ToolTrace('db-lookup', 'search_db')
 *   async searchDatabase(query: string) {
 *     return await db.search(query);
 *   }
 *
 *   @RAGTrace('retrieve', 'pinecone')
 *   async retrieveContext(query: string) {
 *     return await vectorDb.search(query);
 *   }
 * }
 * ```
 */

import { AsyncLocalStorage } from 'async_hooks';
import type { SpanType } from './types';
import type { Span } from './spans/span';
import type { Trace as TraceClass } from './spans/trace';

// ============================================
// GLOBAL AMP INSTANCE
// ============================================

// Use 'any' to avoid circular dependency with AMP class
let _globalAMP: any = null;

export function setGlobalAMP(amp: any): void {
  _globalAMP = amp;
}

export function getGlobalAMP(): any {
  return _globalAMP;
}

// ============================================
// SPAN CONTEXT (AsyncLocalStorage)
// ============================================

interface SpanContext {
  span: Span;
  trace: TraceClass;
}

const spanStorage = new AsyncLocalStorage<SpanContext>();

/** Get the current active span (inside a decorated method) */
export function getCurrentSpan(): Span | undefined {
  return spanStorage.getStore()?.span;
}

/** Get the current active trace (inside a decorated method) */
export function getCurrentTrace(): TraceClass | undefined {
  return spanStorage.getStore()?.trace;
}

// ============================================
// DECORATOR OPTIONS
// ============================================

export interface TraceDecoratorOptions {
  /** Span type (default: 'custom') */
  type?: SpanType;
  /** Session ID to associate with the trace */
  sessionId?: string;
  /** Extra attributes to set on the span */
  attributes?: Record<string, string | number | boolean>;
}

// ============================================
// INTERNAL: Shared execution wrapper
// ============================================

type SpanSetup = (amp: any, spanName: string) => { trace: any; span: Span };
type SpanCleanup = (span: Span) => void;

/**
 * Core wrapper that runs a method with AMP tracing.
 * Used by both legacy and TC39 decorator paths.
 */
function wrapExecution(
  original: Function,
  thisArg: any,
  args: any[],
  spanName: string,
  setup: SpanSetup,
  onSuccess?: SpanCleanup,
): any {
  const amp = getGlobalAMP();
  if (!amp) return original.apply(thisArg, args);

  let trace: any;
  let span: Span;

  try {
    ({ trace, span } = setup(amp, spanName));
  } catch {
    return original.apply(thisArg, args);
  }

  // Run inside AsyncLocalStorage so getCurrentSpan() works
  const result = spanStorage.run({ span, trace }, () => {
    try {
      return original.apply(thisArg, args);
    } catch (syncErr: any) {
      try { span.setError(syncErr?.message || String(syncErr)); span.end(); trace.end(); } catch {}
      throw syncErr;
    }
  });

  // Async method — attach then/catch
  if (result && typeof result.then === 'function') {
    return result.then(
      (val: any) => {
        try { onSuccess?.(span); span.end(); trace.end(); } catch {}
        return val;
      },
      (err: any) => {
        try { span.setError(err?.message || String(err)); span.end(); trace.end(); } catch {}
        throw err;
      },
    );
  }

  // Sync method succeeded
  try { onSuccess?.(span); span.end(); trace.end(); } catch {}
  return result;
}

/**
 * Creates a universal decorator that works with BOTH:
 * - Legacy/experimental: (target, propertyKey, descriptor) → returns descriptor
 * - TC39 Stage 3: (method, context) → returns replacement function
 */
function createMethodDecorator(
  name: string | undefined,
  setup: SpanSetup,
  onSuccess?: SpanCleanup,
) {
  return function (...decoratorArgs: any[]): any {
    // TC39 Stage 3 decorator: (method: Function, context: { kind: 'method', name: string })
    if (
      decoratorArgs.length === 2 &&
      typeof decoratorArgs[0] === 'function' &&
      decoratorArgs[1] != null &&
      typeof decoratorArgs[1] === 'object' &&
      decoratorArgs[1].kind === 'method'
    ) {
      const original = decoratorArgs[0] as Function;
      const context = decoratorArgs[1] as { kind: string; name: string | symbol };
      const spanName = name || String(context.name);

      return function (this: any, ...args: any[]) {
        return wrapExecution(original, this, args, spanName, setup, onSuccess);
      };
    }

    // Legacy decorator: (target, propertyKey, descriptor)
    const [_target, propertyKey, descriptor] = decoratorArgs;
    const original = descriptor.value;
    const spanName = name || propertyKey;

    descriptor.value = function (this: any, ...args: any[]) {
      return wrapExecution(original, this, args, spanName, setup, onSuccess);
    };

    Object.defineProperty(descriptor.value, 'name', { value: propertyKey });
    return descriptor;
  };
}

// ============================================
// DECORATORS
// ============================================

/**
 * @Trace — Generic method decorator
 *
 * Auto-creates trace + span. Captures timing and errors silently.
 * If AMP is not initialized, runs the method without instrumentation.
 *
 * @example
 * ```typescript
 * @Trace('process-data', { type: 'custom' })
 * async processData(input: string) { ... }
 *
 * // Name defaults to method name:
 * @Trace()
 * async handleRequest() { ... }
 * ```
 */
export function Trace(name?: string, options?: TraceDecoratorOptions) {
  return createMethodDecorator(
    name,
    (amp, spanName) => {
      const trace = amp.trace(spanName, { sessionId: options?.sessionId });
      const span = trace.startSpan(spanName, { type: options?.type || 'custom' });
      if (options?.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
          span.setAttribute(key, value);
        }
      }
      return { trace, span };
    },
  );
}

/**
 * @LLMTrace — Decorator for LLM/model calls
 *
 * @example
 * ```typescript
 * @LLMTrace('chat', 'openai', 'gpt-4')
 * async chatCompletion(prompt: string) {
 *   const span = AMP.currentSpan();
 *   span?.setTokens(inputTokens, outputTokens);
 *   return await openai.chat.completions.create({ ... });
 * }
 * ```
 */
export function LLMTrace(name: string, provider: string, model: string) {
  return createMethodDecorator(name, (amp, spanName) => {
    const trace = amp.trace(spanName);
    const span = trace.startLLMSpan(spanName, provider, model);
    return { trace, span };
  });
}

/**
 * @ToolTrace — Decorator for tool/function calls
 *
 * Auto-sets tool.status to SUCCESS on success, ERROR on failure.
 *
 * @example
 * ```typescript
 * @ToolTrace('db-lookup', 'search_database')
 * async searchDB(query: string) {
 *   return await db.query(query);
 * }
 * ```
 */
export function ToolTrace(name: string, toolName: string, toolType: string = 'function') {
  return createMethodDecorator(
    name,
    (amp, spanName) => {
      const trace = amp.trace(spanName);
      const span = trace.startToolSpan(spanName, toolName, toolType);
      return { trace, span };
    },
    (span) => {
      span.setToolStatus('success' as any);
    },
  );
}

/**
 * @RAGTrace — Decorator for retrieval/RAG operations
 *
 * @example
 * ```typescript
 * @RAGTrace('context-retrieval', 'pinecone', 'vector_search')
 * async retrieveContext(query: string) {
 *   const span = AMP.currentSpan();
 *   span?.setUserQuery(query);
 *   const results = await vectorDb.search(query);
 *   span?.setRetrievedContext(results);
 *   return results;
 * }
 * ```
 */
export function RAGTrace(name: string, vectorDb: string, method: string = 'vector_search') {
  return createMethodDecorator(name, (amp, spanName) => {
    const trace = amp.trace(spanName);
    const span = trace.startRAGSpan(spanName, vectorDb, method);
    return { trace, span };
  });
}

/**
 * @AgentTrace — Decorator for agent operations
 *
 * @example
 * ```typescript
 * @AgentTrace('plan-step', 'PlannerBot', 'task_orchestrator')
 * async executePlan(task: string) {
 *   const span = AMP.currentSpan();
 *   span?.setAgentDetails({ steps: 3, role: 'planner' });
 *   return await this.plan(task);
 * }
 * ```
 */
export function AgentTrace(name: string, agentName: string, agentType: string = 'custom', version?: string) {
  return createMethodDecorator(name, (amp, spanName) => {
    const trace = amp.trace(spanName);
    const span = trace.startAgentSpan(spanName, agentName, agentType, version);
    return { trace, span };
  });
}

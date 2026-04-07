/**
 * AMP Context - AsyncLocalStorage-based context propagation
 *
 * Provides per-request context (agent info, session, user) that
 * automatically applies to all traces/spans created within the context.
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface AgentInfo {
  name: string;
  type?: string;
  version?: string;
  role?: string;
  goal?: string;
}

export interface ServiceInfo {
  name: string;
  version?: string;
  environment?: string;
}

export interface AMPDefaults {
  agent?: AgentInfo;
  service?: ServiceInfo;
}

export interface AMPContext {
  agent?: AgentInfo;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean>;
}

const storage = new AsyncLocalStorage<AMPContext>();

export function getContext(): AMPContext | undefined {
  return storage.getStore();
}

export function runWithContext<T>(ctx: AMPContext, fn: () => T): T {
  const current = storage.getStore();
  const merged: AMPContext = current
    ? { ...current, ...ctx, metadata: { ...current.metadata, ...ctx.metadata } }
    : ctx;
  return storage.run(merged, fn);
}

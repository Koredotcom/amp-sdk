/**
 * AMP SDK Client Tests
 */

import { AMP, Trace, Span, BatchProcessor } from '../src';
import type { TelemetryResponse, HTTPClient } from '../src';

describe('AMP Client', () => {
  let amp: AMP;

  beforeEach(() => {
    amp = new AMP({
      apiKey: 'test-api-key',
      // Uses default: https://amp.kore.ai
      disableAutoFlush: true, // Disable for tests
    });
  });

  afterEach(async () => {
    await amp.shutdown().catch(() => {}); // Ignore flush errors in tests
  }, 15000);

  describe('initialization', () => {
    it('should create client with required config', () => {
      expect(amp).toBeInstanceOf(AMP);
    });

    it('should throw if apiKey is missing', () => {
      expect(() => new AMP({ apiKey: '' })).toThrow('apiKey is required');
    });
  });

  describe('trace', () => {
    it('should create a trace', () => {
      const trace = amp.trace('test-trace');
      expect(trace).toBeInstanceOf(Trace);
      expect(trace.traceId).toBeDefined();
      expect(trace.name).toBe('test-trace');
    });

    it('should create trace with custom session ID', () => {
      const trace = amp.trace('test-trace', { sessionId: 'custom-session' });
      expect(trace.sessionId).toBe('custom-session');
    });

    it('should auto-generate session ID if not provided', () => {
      const trace = amp.trace('test-trace');
      expect(trace.sessionId).toMatch(/^sess_/);
    });
  });

  describe('span', () => {
    it('should create spans within a trace', () => {
      const trace = amp.trace('test-trace');
      const span = trace.startSpan('test-span', { type: 'llm' });
      expect(span).toBeInstanceOf(Span);
      expect(span.traceId).toBe(trace.traceId);
    });

    it('should set LLM attributes', () => {
      const trace = amp.trace('test-trace');
      const span = trace.startSpan('llm-span', { type: 'llm' });
      
      span.setLLM('openai', 'gpt-4');
      span.setTokens(150, 75);
      span.end();

      const data = span.toData();
      expect(data.attributes['gen_ai.system']).toBe('openai');
      expect(data.attributes['gen_ai.request.model']).toBe('gpt-4');
      expect(data.attributes['gen_ai.usage.input_tokens']).toBe(150);
      expect(data.attributes['gen_ai.usage.output_tokens']).toBe(75);
    });

    it('should record events', () => {
      const trace = amp.trace('test-trace');
      const span = trace.startSpan('llm-span', { type: 'llm' });
      
      span.recordPrompt('Hello, world!');
      span.recordCompletion('Hi there!');
      span.end();

      const data = span.toData();
      expect(data.events).toHaveLength(2);
      expect(data.events![0].name).toBe('gen_ai.content.prompt');
      expect(data.events![1].name).toBe('gen_ai.content.completion');
    });

    it('should handle errors', () => {
      const trace = amp.trace('test-trace');
      const span = trace.startSpan('error-span');
      
      span.recordException(new Error('Test error'));
      span.end();

      const data = span.toData();
      expect(data.status).toBe('error');
      expect(data.events).toBeDefined();
      expect(data.events![0].name).toBe('exception');
    });
  });

  describe('session', () => {
    it('should create a session', () => {
      const session = amp.session();
      expect(session.sessionId).toBeDefined();
    });

    it('should create traces within session', () => {
      const session = amp.session({ sessionId: 'test-session' });
      const trace = session.trace('turn-1');
      expect(trace.sessionId).toBe('test-session');
    });
  });

  describe('serialization', () => {
    it('should serialize trace to data', () => {
      const trace = amp.trace('test-trace', { sessionId: 'session-123' });
      const span = trace.startLLMSpan('llm.completion', 'openai', 'gpt-4');
      span.setTokens(100, 50);
      span.end();
      trace.end();

      const data = trace.toData();
      expect(data.trace_id).toBe(trace.traceId);
      expect(data.session_id).toBe('session-123');
      expect(data.spans).toHaveLength(1);
      expect(data.spans[0].type).toBe('llm');
    });
  });
});

describe('Trace', () => {
  it('should auto-end open spans when trace ends', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const span1 = trace.startSpan('span-1');
    const span2 = trace.startSpan('span-2');

    // Don't manually end spans
    trace.end();

    expect(span1.isEnded).toBe(true);
    expect(span2.isEnded).toBe(true);
  });

  it('should not allow adding spans after trace ends', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');
    trace.end();

    expect(() => trace.startSpan('new-span')).toThrow();
  });

  it('should include trace_name in serialized data', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('my-trace-name');
    trace.end();

    const data = trace.toData();
    expect(data.trace_name).toBe('my-trace-name');
  });
});

describe('Span', () => {
  it('should calculate duration', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');
    const span = trace.startSpan('span');
    
    // Wait a bit
    const start = Date.now();
    while (Date.now() - start < 10) {} // Busy wait 10ms
    
    span.end();
    
    const data = span.toData();
    expect(data.start_time).toBeDefined();
    expect(data.end_time).toBeDefined();
    expect(new Date(data.end_time!).getTime()).toBeGreaterThan(
      new Date(data.start_time).getTime()
    );
  });

  it('should support method chaining', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const span = trace.startSpan('llm')
      .setLLM('openai', 'gpt-4')
      .setTokens(100, 50)
      .setLLMParams({ temperature: 0.7 })
      .recordPrompt('Hello')
      .setOk();

    span.end();

    const data = span.toData();
    expect(data.attributes['gen_ai.system']).toBe('openai');
    expect(data.attributes['gen_ai.usage.input_tokens']).toBe(100);
    expect(data.attributes['gen_ai.request.temperature']).toBe(0.7);
  });

  it('should create child spans with parentSpanId', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const parentSpan = trace.startSpan('parent-span', { type: 'agent' });
    const childSpan = parentSpan.startChildSpan('child-span', { type: 'llm' });

    expect(childSpan.parentSpanId).toBe(parentSpan.spanId);
    expect(childSpan.traceId).toBe(trace.traceId);

    childSpan.end();
    parentSpan.end();
    trace.end();

    const traceData = trace.toData();
    expect(traceData.spans).toHaveLength(2);

    const childData = traceData.spans.find(s => s.span_id === childSpan.spanId);
    expect(childData?.parent_span_id).toBe(parentSpan.spanId);
  });

  it('should create typed child spans with convenience methods', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const agentSpan = trace.startAgentSpan('agent', 'my-agent', 'orchestrator');

    const llmChild = agentSpan.startChildLLMSpan('llm-call', 'openai', 'gpt-4');
    const toolChild = agentSpan.startChildToolSpan('tool-call', 'search');
    const ragChild = agentSpan.startChildRAGSpan('rag-call', 'pinecone');

    expect(llmChild.parentSpanId).toBe(agentSpan.spanId);
    expect(toolChild.parentSpanId).toBe(agentSpan.spanId);
    expect(ragChild.parentSpanId).toBe(agentSpan.spanId);

    const llmData = llmChild.toData();
    expect(llmData.type).toBe('llm');
    expect(llmData.attributes['gen_ai.system']).toBe('openai');

    const toolData = toolChild.toData();
    expect(toolData.type).toBe('tool');
    expect(toolData.attributes['tool.name']).toBe('search');

    const ragData = ragChild.toData();
    expect(ragData.type).toBe('rag');
    expect(ragData.attributes['vector_db']).toBe('pinecone');
  });

  it('should not allow child spans on ended parent', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const parentSpan = trace.startSpan('parent');
    parentSpan.end();

    expect(() => parentSpan.startChildSpan('child')).toThrow();
  });

  it('should set agent version via setAgent', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const span = trace.startSpan('agent-span', { type: 'agent' });
    span.setAgent('MyAgent', 'research', 'Find info', '2.1.0');
    span.end();

    const data = span.toData();
    expect(data.attributes['gen_ai.agent.version']).toBe('2.1.0');
    expect(data.attributes['agent.version']).toBe('2.1.0');
    expect(data.attributes['gen_ai.agent.name']).toBe('MyAgent');
    expect(data.attributes['agent.type']).toBe('research');
    expect(data.attributes['agent.goal']).toBe('Find info');
  });

  it('should set agent version via setAgentDetails', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const span = trace.startSpan('agent-span', { type: 'agent' });
    span.setAgent('MyAgent', 'writer');
    span.setAgentDetails({ version: '1.5.3', role: 'content-writer', id: 'agent-001' });
    span.end();

    const data = span.toData();
    expect(data.attributes['gen_ai.agent.version']).toBe('1.5.3');
    expect(data.attributes['agent.version']).toBe('1.5.3');
    expect(data.attributes['agent.role']).toBe('content-writer');
    expect(data.attributes['gen_ai.agent.id']).toBe('agent-001');
  });

  it('should set agent version via startAgentSpan convenience method', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const span = trace.startAgentSpan('Agent Run', 'ResearchBot', 'research', '3.0.0');
    span.end();

    const data = span.toData();
    expect(data.type).toBe('agent');
    expect(data.attributes['gen_ai.agent.name']).toBe('ResearchBot');
    expect(data.attributes['gen_ai.agent.version']).toBe('3.0.0');
    expect(data.attributes['agent.version']).toBe('3.0.0');
  });

  it('should not set agent version when omitted', () => {
    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test');

    const span = trace.startAgentSpan('Agent Run', 'SimpleBot', 'task');
    span.end();

    const data = span.toData();
    expect(data.attributes['gen_ai.agent.version']).toBeUndefined();
    expect(data.attributes['agent.version']).toBeUndefined();
  });
});

describe('TelemetryResponse (v1.3.0)', () => {
  it('should match the v1.3.0 ingestion response shape', () => {
    const response: TelemetryResponse = {
      status: 'accepted',
      ingestion_id: '550e8400-e29b-41d4-a716-446655440000',
      format: 'otel',
      payload_size: 52428,
      duration_ms: 45,
      persisted: true,
      queued: true,
    };

    expect(response.status).toBe('accepted');
    expect(response.ingestion_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(response.format).toBe('otel');
    expect(response.payload_size).toBe(52428);
    expect(response.duration_ms).toBe(45);
    expect(response.persisted).toBe(true);
    expect(response.queued).toBe(true);
    expect(response.warnings).toBeUndefined();
  });

  it('should support all valid status values', () => {
    const statuses: TelemetryResponse['status'][] = ['accepted', 'partial', 'rejected'];
    statuses.forEach(status => {
      const response: TelemetryResponse = {
        status,
        ingestion_id: 'test-id',
        format: 'otel',
        payload_size: 100,
        duration_ms: 10,
        persisted: true,
        queued: true,
      };
      expect(response.status).toBe(status);
    });
  });

  it('should support warnings array', () => {
    const response: TelemetryResponse = {
      status: 'partial',
      ingestion_id: 'test-id',
      format: 'transcript',
      payload_size: 1024,
      duration_ms: 20,
      persisted: true,
      queued: false,
      warnings: ['Some spans missing end_time', 'Large payload detected'],
    };

    expect(response.warnings).toHaveLength(2);
    expect(response.warnings![0]).toBe('Some spans missing end_time');
  });

  it('should support all telemetry formats', () => {
    const formats = ['otel', 'transcript', 'agentic', 'ai_for_work', 'searchai'];
    formats.forEach(format => {
      const response: TelemetryResponse = {
        status: 'accepted',
        ingestion_id: 'test-id',
        format,
        payload_size: 100,
        duration_ms: 5,
        persisted: true,
        queued: true,
      };
      expect(response.format).toBe(format);
    });
  });
});

describe('BatchProcessor with mock HTTP', () => {
  const mockResponse: TelemetryResponse = {
    status: 'accepted',
    ingestion_id: '550e8400-e29b-41d4-a716-446655440000',
    format: 'otel',
    payload_size: 1024,
    duration_ms: 15,
    persisted: true,
    queued: true,
  };

  const createMockHTTPClient = (response: TelemetryResponse = mockResponse): HTTPClient => ({
    post: jest.fn().mockResolvedValue(response),
  });

  it('should flush traces and return v1.3.0 response with ingestion_id', async () => {
    const mockClient = createMockHTTPClient();
    const batcher = new BatchProcessor(
      { apiKey: 'test-api-key', disableAutoFlush: true },
      mockClient,
    );

    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('test-trace');
    trace.startSpan('llm-span', { type: 'llm' }).end();
    trace.end();

    batcher.enqueue(trace);
    const result = await batcher.flush();

    expect(result).not.toBeNull();
    expect(result!.status).toBe('accepted');
    expect(result!.ingestion_id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result!.format).toBe('otel');
    expect(result!.persisted).toBe(true);
    expect(result!.queued).toBe(true);
    expect(mockClient.post).toHaveBeenCalledTimes(1);
  });

  it('should send correct payload to ingestion endpoint', async () => {
    const mockClient = createMockHTTPClient();
    const batcher = new BatchProcessor(
      { apiKey: 'test-api-key', disableAutoFlush: true },
      mockClient,
    );

    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('payload-test');
    trace.startLLMSpan('llm.completion', 'openai', 'gpt-4').setTokens(100, 50).end();
    trace.end();

    batcher.enqueue(trace);
    await batcher.flush();

    const [url, body, headers] = (mockClient.post as jest.Mock).mock.calls[0];
    expect(url).toContain('/ingestion/api/v1/telemetry');
    expect(headers['X-API-Key']).toBe('test-api-key');
    expect(body.traces).toHaveLength(1);
    expect(body.traces[0].trace_id).toBe(trace.traceId);
  });

  it('should handle rejected response', async () => {
    const rejectedResponse: TelemetryResponse = {
      status: 'rejected',
      ingestion_id: 'reject-id-123',
      format: 'otel',
      payload_size: 0,
      duration_ms: 2,
      persisted: false,
      queued: false,
      warnings: ['Invalid payload structure'],
    };

    const mockClient = createMockHTTPClient(rejectedResponse);
    const batcher = new BatchProcessor(
      { apiKey: 'test-api-key', disableAutoFlush: true },
      mockClient,
    );

    const amp = new AMP({ apiKey: 'test-api-key', disableAutoFlush: true });
    const trace = amp.trace('rejected-test');
    trace.end();

    batcher.enqueue(trace);
    const result = await batcher.flush();

    expect(result!.status).toBe('rejected');
    expect(result!.ingestion_id).toBe('reject-id-123');
    expect(result!.persisted).toBe(false);
    expect(result!.warnings).toContain('Invalid payload structure');
  });

  it('should return null when flushing empty queue', async () => {
    const mockClient = createMockHTTPClient();
    const batcher = new BatchProcessor(
      { apiKey: 'test-api-key', disableAutoFlush: true },
      mockClient,
    );

    const result = await batcher.flush();
    expect(result).toBeNull();
    expect(mockClient.post).not.toHaveBeenCalled();
  });
});


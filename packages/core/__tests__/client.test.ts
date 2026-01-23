/**
 * AMP SDK Client Tests
 */

import { AMP, Trace, Span } from '../src';

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
    const amp = new AMP({ apiKey: 'test', disableAutoFlush: true });
    const trace = amp.trace('test');

    const span1 = trace.startSpan('span-1');
    const span2 = trace.startSpan('span-2');

    // Don't manually end spans
    trace.end();

    expect(span1.isEnded).toBe(true);
    expect(span2.isEnded).toBe(true);
  });

  it('should not allow adding spans after trace ends', () => {
    const amp = new AMP({ apiKey: 'test', disableAutoFlush: true });
    const trace = amp.trace('test');
    trace.end();

    expect(() => trace.startSpan('new-span')).toThrow();
  });

  it('should include trace_name in serialized data', () => {
    const amp = new AMP({ apiKey: 'test', disableAutoFlush: true });
    const trace = amp.trace('my-trace-name');
    trace.end();

    const data = trace.toData();
    expect(data.trace_name).toBe('my-trace-name');
  });
});

describe('Span', () => {
  it('should calculate duration', () => {
    const amp = new AMP({ apiKey: 'test', disableAutoFlush: true });
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
    const amp = new AMP({ apiKey: 'test', disableAutoFlush: true });
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
    const amp = new AMP({ apiKey: 'test', disableAutoFlush: true });
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
    const amp = new AMP({ apiKey: 'test', disableAutoFlush: true });
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
    const amp = new AMP({ apiKey: 'test', disableAutoFlush: true });
    const trace = amp.trace('test');

    const parentSpan = trace.startSpan('parent');
    parentSpan.end();

    expect(() => parentSpan.startChildSpan('child')).toThrow();
  });
});


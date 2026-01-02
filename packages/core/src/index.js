"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDK_VERSION = exports.SDK_NAME = exports.DEFAULT_TIMEOUT = exports.DEFAULT_MAX_RETRIES = exports.DEFAULT_BATCH_TIMEOUT = exports.DEFAULT_BATCH_SIZE = exports.TRANSCRIPT_ENDPOINT = exports.INGEST_ENDPOINT = exports.DEFAULT_BASE_URL = exports.Logger = exports.now = exports.generateSessionId = exports.generateSpanId = exports.generateTraceId = exports.FetchHTTPClient = exports.BatchProcessor = exports.Span = exports.Trace = exports.default = exports.Session = exports.AMP = void 0;
// Main client
var client_1 = require("./client");
Object.defineProperty(exports, "AMP", { enumerable: true, get: function () { return client_1.AMP; } });
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return client_1.Session; } });
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(client_1).default; } });
// Spans
var spans_1 = require("./spans");
Object.defineProperty(exports, "Trace", { enumerable: true, get: function () { return spans_1.Trace; } });
Object.defineProperty(exports, "Span", { enumerable: true, get: function () { return spans_1.Span; } });
// Batcher
var batcher_1 = require("./batcher");
Object.defineProperty(exports, "BatchProcessor", { enumerable: true, get: function () { return batcher_1.BatchProcessor; } });
Object.defineProperty(exports, "FetchHTTPClient", { enumerable: true, get: function () { return batcher_1.FetchHTTPClient; } });
// Utilities
var utils_1 = require("./utils");
Object.defineProperty(exports, "generateTraceId", { enumerable: true, get: function () { return utils_1.generateTraceId; } });
Object.defineProperty(exports, "generateSpanId", { enumerable: true, get: function () { return utils_1.generateSpanId; } });
Object.defineProperty(exports, "generateSessionId", { enumerable: true, get: function () { return utils_1.generateSessionId; } });
Object.defineProperty(exports, "now", { enumerable: true, get: function () { return utils_1.now; } });
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return utils_1.Logger; } });
// Constants
var constants_1 = require("./constants");
Object.defineProperty(exports, "DEFAULT_BASE_URL", { enumerable: true, get: function () { return constants_1.DEFAULT_BASE_URL; } });
Object.defineProperty(exports, "INGEST_ENDPOINT", { enumerable: true, get: function () { return constants_1.INGEST_ENDPOINT; } });
Object.defineProperty(exports, "TRANSCRIPT_ENDPOINT", { enumerable: true, get: function () { return constants_1.TRANSCRIPT_ENDPOINT; } });
Object.defineProperty(exports, "DEFAULT_BATCH_SIZE", { enumerable: true, get: function () { return constants_1.DEFAULT_BATCH_SIZE; } });
Object.defineProperty(exports, "DEFAULT_BATCH_TIMEOUT", { enumerable: true, get: function () { return constants_1.DEFAULT_BATCH_TIMEOUT; } });
Object.defineProperty(exports, "DEFAULT_MAX_RETRIES", { enumerable: true, get: function () { return constants_1.DEFAULT_MAX_RETRIES; } });
Object.defineProperty(exports, "DEFAULT_TIMEOUT", { enumerable: true, get: function () { return constants_1.DEFAULT_TIMEOUT; } });
Object.defineProperty(exports, "SDK_NAME", { enumerable: true, get: function () { return constants_1.SDK_NAME; } });
Object.defineProperty(exports, "SDK_VERSION", { enumerable: true, get: function () { return constants_1.SDK_VERSION; } });

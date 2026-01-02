"use strict";
/**
 * AMP SDK Constants
 * Centralized configuration defaults and endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDK_VERSION = exports.SDK_NAME = exports.DEFAULT_TIMEOUT = exports.DEFAULT_MAX_RETRIES = exports.DEFAULT_BATCH_TIMEOUT = exports.DEFAULT_BATCH_SIZE = exports.TRANSCRIPT_ENDPOINT = exports.INGEST_ENDPOINT = exports.DEFAULT_BASE_URL = void 0;
// ============================================
// API ENDPOINTS
// ============================================
/** Default base URL for AMP API */
exports.DEFAULT_BASE_URL = 'https://amp.kore.ai';
/** Telemetry ingestion endpoint */
exports.INGEST_ENDPOINT = '/ingestion/api/v1/telemetry';
/** Transcript ingestion endpoint */
exports.TRANSCRIPT_ENDPOINT = '/ingestion/api/v1/telemetry?format=transcript';
// ============================================
// BATCH PROCESSING DEFAULTS
// ============================================
/** Default batch size before auto-flush */
exports.DEFAULT_BATCH_SIZE = 100;
/** Default batch timeout in milliseconds */
exports.DEFAULT_BATCH_TIMEOUT = 5000;
/** Default max retries for failed requests */
exports.DEFAULT_MAX_RETRIES = 3;
/** Default request timeout in milliseconds */
exports.DEFAULT_TIMEOUT = 30000;
// ============================================
// SDK METADATA
// ============================================
/** SDK name for telemetry */
exports.SDK_NAME = 'amp-sdk-typescript';
/** SDK version */
exports.SDK_VERSION = '1.0.0';

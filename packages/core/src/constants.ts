/**
 * AMP SDK Constants
 * Centralized configuration defaults and endpoints
 */

// ============================================
// API ENDPOINTS
// ============================================

/** Default base URL for AMP API */
export const DEFAULT_BASE_URL = 'https://amp.kore.ai';

/** Telemetry ingestion endpoint */
export const INGEST_ENDPOINT = '/ingestion/api/v1/telemetry';

/** Transcript ingestion endpoint */
export const TRANSCRIPT_ENDPOINT = '/ingestion/api/v1/telemetry?format=transcript';

// ============================================
// BATCH PROCESSING DEFAULTS
// ============================================

/** Default batch size before auto-flush */
export const DEFAULT_BATCH_SIZE = 100;

/** Default batch timeout in milliseconds */
export const DEFAULT_BATCH_TIMEOUT = 5000;

/** Default max retries for failed requests */
export const DEFAULT_MAX_RETRIES = 3;

/** Default request timeout in milliseconds */
export const DEFAULT_TIMEOUT = 30000;

// ============================================
// SDK METADATA
// ============================================

/** SDK name for telemetry */
export const SDK_NAME = 'amp-sdk-typescript';

/** SDK version */
export const SDK_VERSION = '1.0.0';

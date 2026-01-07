"use strict";
/**
 * Utility functions for AMP SDK
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
exports.generateId = generateId;
exports.generateTraceId = generateTraceId;
exports.generateSpanId = generateSpanId;
exports.generateSessionId = generateSessionId;
exports.now = now;
exports.duration = duration;
exports.sleep = sleep;
exports.retry = retry;
/**
 * Generate cryptographically secure random bytes as hex string
 * Uses crypto.getRandomValues when available, falls back to Math.random
 */
function getRandomBytes(byteLength) {
    const bytes = new Uint8Array(byteLength);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    }
    else {
        // Fallback for environments without crypto
        for (let i = 0; i < byteLength; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    return bytes;
}
/**
 * Convert bytes to lowercase hex string
 */
function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Check if bytes are all zero (invalid for OTEL)
 */
function isZero(bytes) {
    return bytes.every(b => b === 0);
}
/**
 * Generate a random hex string ID
 */
function generateId(length = 16) {
    const bytes = getRandomBytes(Math.ceil(length / 2));
    return bytesToHex(bytes).slice(0, length);
}
/**
 * Generate OTEL-compliant Trace ID
 * Format: 32 lowercase hex chars (16 bytes / 128 bits)
 * Must be non-zero as per W3C Trace Context spec
 */
function generateTraceId() {
    let bytes;
    do {
        bytes = getRandomBytes(16); // 16 bytes = 128 bits = 32 hex chars
    } while (isZero(bytes));
    return bytesToHex(bytes);
}
/**
 * Generate OTEL-compliant Span ID
 * Format: 16 lowercase hex chars (8 bytes / 64 bits)
 * Must be non-zero as per W3C Trace Context spec
 */
function generateSpanId() {
    let bytes;
    do {
        bytes = getRandomBytes(8); // 8 bytes = 64 bits = 16 hex chars
    } while (isZero(bytes));
    return bytesToHex(bytes);
}
/**
 * Generate session ID with timestamp for uniqueness
 * Format: sess_<timestamp>_<random>
 */
function generateSessionId() {
    return `sess_${Date.now()}_${generateId(8)}`;
}
/**
 * Get current timestamp in ISO 8601 format
 */
function now() {
    return new Date().toISOString();
}
/**
 * Calculate duration between two ISO timestamps in milliseconds
 */
function duration(startTime, endTime) {
    return new Date(endTime).getTime() - new Date(startTime).getTime();
}
/**
 * Simple logger with debug support
 */
class Logger {
    constructor(debug = false) {
        this.debug = debug;
    }
    log(message, ...args) {
        if (this.debug) {
            console.log(`[AMP SDK] ${message}`, ...args);
        }
    }
    warn(message, ...args) {
        console.warn(`[AMP SDK] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[AMP SDK] ${message}`, ...args);
    }
}
exports.Logger = Logger;
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Retry a function with exponential backoff
 */
async function retry(fn, maxRetries = 3, baseDelay = 500) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                await sleep(delay);
            }
        }
    }
    throw lastError;
}

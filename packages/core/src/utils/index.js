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
 * Generate a random hex string ID
 */
function generateId(length = 16) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}
/**
 * Generate trace ID (32 hex chars)
 */
function generateTraceId() {
    return generateId(32);
}
/**
 * Generate span ID (16 hex chars)
 */
function generateSpanId() {
    return generateId(16);
}
/**
 * Generate session ID
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

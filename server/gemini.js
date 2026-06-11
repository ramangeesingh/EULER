/**
 * server/gemini.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Gemini API client compatibility layer.
 * Re-routes all existing calls to the new multi-provider AI Gateway.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { aiGenerate, aiStream, parseJSON as gatewayParseJSON, sanitizeError as gatewaySanitizeError } from './ai-gateway.js';

export const geminiGenerate = aiGenerate;
export const geminiStream = aiStream;
export const parseJSON = gatewayParseJSON;
export const sanitizeError = gatewaySanitizeError;

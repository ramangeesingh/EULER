/**
 * server/gemini.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Gemini API client shared across all backend routes.
 *
 * KEY FIX: The API key is read via getKey() at REQUEST TIME, not at module
 * load time. This ensures dotenv.config() in server.js has already populated
 * process.env before the key is first accessed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MODEL = 'gemini-2.5-flash';
const BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';

const isDev = process.env.NODE_ENV !== 'production';

/** Lazily read the key — throws a clear error if missing */
function getKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env file and restart the server.'
    );
  }
  return key;
}

/** Build the Gemini endpoint URL on demand */
function geminiUrl(streaming = false) {
  const key = getKey();
  return streaming
    ? `${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${key}`
    : `${BASE}/${MODEL}:generateContent?key=${key}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-streaming helper
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Calls Gemini synchronously and returns the generated text string.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number} [temperature=0.4]
 * @returns {Promise<string>}
 */
export async function geminiGenerate(systemPrompt, userPrompt, temperature = 0.4) {
  if (isDev) console.log('[Gemini] generate →', userPrompt.slice(0, 80), '…');

  const response = await fetch(geminiUrl(false), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Gemini] generate error ${response.status}:`, errText);
    throw new Error(`Gemini error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming helper
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Calls Gemini in streaming mode and pipes SSE events straight to an
 * Express response object.  Sets SSE headers before streaming begins.
 *
 * @param {string}   systemPrompt
 * @param {Array}    geminiContents  - already mapped to Gemini role format
 * @param {object}   res             - Express response
 */
export async function geminiStream(systemPrompt, geminiContents, res) {
  if (isDev) console.log('[Gemini] stream → starting…');

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let response;
  try {
    response = await fetch(geminiUrl(true), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
      }),
    });
  } catch (fetchErr) {
    console.error('[Gemini] stream fetch error:', fetchErr.message);
    res.write(`data: ${JSON.stringify({ error: fetchErr.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Gemini] stream error ${response.status}:`, errText);
    res.write(`data: ${JSON.stringify({ error: `Gemini error ${response.status}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete last line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        } catch { /* skip malformed chunk */ }
      }
    }
  } catch (streamErr) {
    console.error('[Gemini] stream read error:', streamErr.message);
    res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON utility
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Strips Markdown fences from a Gemini response and parses it as JSON.
 * Returns `fallback` if parsing fails.
 *
 * @param {string} raw
 * @param {*}      [fallback={}]
 * @returns {*}
 */
export function parseJSON(raw, fallback = {}) {
  try {
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    console.warn('[Gemini] parseJSON failed — returning fallback');
    return fallback;
  }
}

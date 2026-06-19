/**
 * server/ai-gateway.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized AI Gateway service for Euler.
 * Handles automatic provider fallbacks (Gemini -> Groq -> DeepSeek)
 * and robust retry logic for Gemini.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv';
dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

// Provider configurations
const PROVIDERS = {
  GEMINI: {
    name: 'Gemini',
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    getKey: () => process.env.GEMINI_API_KEY,
  },
  GROQ: {
    name: 'Groq',
    model: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    getKey: () => process.env.GROQ_API_KEY,
  },
  DEEPSEEK: {
    name: 'DeepSeek',
    model: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/chat/completions',
    getKey: () => process.env.DEEPSEEK_API_KEY,
  }
};

/** Helper to sleep/delay */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Logger for gateway events in the exact format required */
function logGatewayEvent(provider, status, reason = null) {
  console.log(`\n[AI_GATEWAY]`);
  console.log(`Provider: ${provider}`);
  console.log(`Status: ${status}`);
  if (reason) {
    console.log(`Reason: ${reason}`);
  }
  console.log('');
}

/** Sanitizes errors, ensuring internal/raw details are never leaked */
export function sanitizeError(err, context = 'AI') {
  const raw = err?.message || String(err || '');
  console.error(`[${context}] Raw error:`, raw);
  return 'Something went wrong. Please try again.';
}

/** Parses JSON code fences from model outputs */
export function parseJSON(raw, fallback = {}) {
  try {
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    console.warn('[AI Gateway] parseJSON failed — returning fallback');
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-Streaming AI Call (aiGenerate)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Calls the AI Gateway and returns the generated text response.
 * Fallback order: Gemini -> Groq -> DeepSeek
 * Gemini has 3 retries (delays: 2s, 5s, 10s)
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number} [temperature=0.4]
 * @returns {Promise<string>}
 */
export async function aiGenerate(systemPrompt, userPrompt, temperature = 0.4) {
  // 1. Try Gemini with retries
  const geminiKey = PROVIDERS.GEMINI.getKey();
  const geminiUrl = `${PROVIDERS.GEMINI.baseUrl}/${PROVIDERS.GEMINI.model}:generateContent?key=${geminiKey}`;

  let geminiSuccess = false;
  let geminiOutput = '';
  let lastGeminiError = '';

  const retryDelays = [2000, 5000, 10000];

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      if (isDev) {
        console.log(`[AI Gateway] Trying Gemini (Attempt ${attempt + 1}/4)`);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        geminiOutput = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        geminiSuccess = true;
        break;
      } else {
        const errText = await response.text();
        lastGeminiError = `${response.status} - ${errText.slice(0, 100)}`;
      }
    } catch (err) {
      lastGeminiError = err.message || String(err);
    }

    // Delay before retry if not the last attempt
    if (attempt < 3) {
      if (isDev) {
        console.log(`[AI Gateway] Gemini failed: ${lastGeminiError}. Retrying in ${retryDelays[attempt] / 1000}s...`);
      }
      await delay(retryDelays[attempt]);
    }
  }

  if (geminiSuccess) {
    logGatewayEvent(PROVIDERS.GEMINI.name, 'Success');
    return geminiOutput;
  } else {
    logGatewayEvent(PROVIDERS.GEMINI.name, 'Failed', lastGeminiError);
  }

  // 2. Try Groq
  const groqKey = PROVIDERS.GROQ.getKey();
  if (groqKey) {
    try {
      if (isDev) console.log('[AI Gateway] Gemini failed completely. Falling back to Groq...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(PROVIDERS.GROQ.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: PROVIDERS.GROQ.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const output = data.choices?.[0]?.message?.content ?? '';
        logGatewayEvent(PROVIDERS.GROQ.name, 'Success');
        return output;
      } else {
        const errText = await response.text();
        logGatewayEvent(PROVIDERS.GROQ.name, 'Failed', `${response.status} - ${errText.slice(0, 100)}`);
      }
    } catch (err) {
      logGatewayEvent(PROVIDERS.GROQ.name, 'Failed', err.message || String(err));
    }
  }

  // 3. Try DeepSeek
  const deepseekKey = PROVIDERS.DEEPSEEK.getKey();
  if (deepseekKey) {
    try {
      if (isDev) console.log('[AI Gateway] Groq failed completely. Falling back to DeepSeek...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(PROVIDERS.DEEPSEEK.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: PROVIDERS.DEEPSEEK.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const output = data.choices?.[0]?.message?.content ?? '';
        logGatewayEvent(PROVIDERS.DEEPSEEK.name, 'Success');
        return output;
      } else {
        const errText = await response.text();
        logGatewayEvent(PROVIDERS.DEEPSEEK.name, 'Failed', `${response.status} - ${errText.slice(0, 100)}`);
      }
    } catch (err) {
      logGatewayEvent(PROVIDERS.DEEPSEEK.name, 'Failed', err.message || String(err));
    }
  }

  // If everything failed, throw the generic error
  throw new Error('Something went wrong. Please try again.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming AI Call (aiStream)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Streams AI responses from the Gateway via SSE.
 *
 * @param {string} systemPrompt
 * @param {Array} messages - in format: [{ role: 'user'|'assistant', content: string }]
 * @param {object} res - Express response
 */
export async function aiStream(systemPrompt, messages, res, options = {}) {
  console.log('[CHAT] Generation started');

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let isConnectionClosed = false;
  let isStreamFinished = false;
  const gatewayAbortController = new AbortController();

  res.on('close', () => {
    if (!isStreamFinished && !isConnectionClosed) {
      isConnectionClosed = true;
      console.log('[CHAT] Stop requested');
      console.log('[CHAT] Stream aborted');
      console.log('[CHAT] Generation cancelled successfully');
      gatewayAbortController.abort();
    }
  });

  const geminiKey = PROVIDERS.GEMINI.getKey();
  const geminiUrl = `${PROVIDERS.GEMINI.baseUrl}/${PROVIDERS.GEMINI.model}:streamGenerateContent?alt=sse&key=${geminiKey}`;
  const geminiContents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  let currentResponse = null;
  let activeProvider = null;
  let lastGeminiError = '';

  const retryDelays = [2000, 5000, 10000];

  // 1. Try Gemini with retries
  for (let attempt = 0; attempt <= 3; attempt++) {
    if (gatewayAbortController.signal.aborted) {
      break;
    }
    try {
      if (isDev) {
        console.log(`[AI Gateway Stream] Trying Gemini (Attempt ${attempt + 1}/4)`);
      }

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
        }),
        signal: gatewayAbortController.signal,
      });

      if (response.ok) {
        currentResponse = response;
        activeProvider = PROVIDERS.GEMINI;
        break;
      } else {
        const errText = await response.text();
        lastGeminiError = `${response.status} - ${errText.slice(0, 100)}`;
      }
    } catch (err) {
      if (err.name === 'AbortError' || gatewayAbortController.signal.aborted) {
        lastGeminiError = 'Aborted';
        break;
      }
      lastGeminiError = err.message || String(err);
    }

    if (attempt < 3) {
      if (gatewayAbortController.signal.aborted) {
        break;
      }
      if (isDev) {
        console.log(`[AI Gateway Stream] Gemini failed: ${lastGeminiError}. Retrying in ${retryDelays[attempt] / 1000}s...`);
      }
      await delay(retryDelays[attempt]);
    }
  }

  if (activeProvider) {
    logGatewayEvent(PROVIDERS.GEMINI.name, 'Success');
  } else {
    logGatewayEvent(PROVIDERS.GEMINI.name, 'Failed', lastGeminiError);
  }

  // 2. Fallback to Groq if Gemini failed
  if (!activeProvider && !gatewayAbortController.signal.aborted) {
    const groqKey = PROVIDERS.GROQ.getKey();
    if (groqKey) {
      try {
        if (isDev) console.log('[AI Gateway Stream] Falling back to Groq stream...');
        const response = await fetch(PROVIDERS.GROQ.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: PROVIDERS.GROQ.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
              }))
            ],
            stream: true,
          }),
          signal: gatewayAbortController.signal,
        });

        if (response.ok) {
          currentResponse = response;
          activeProvider = PROVIDERS.GROQ;
          logGatewayEvent(PROVIDERS.GROQ.name, 'Success');
        } else {
          const errText = await response.text();
          logGatewayEvent(PROVIDERS.GROQ.name, 'Failed', `${response.status} - ${errText.slice(0, 100)}`);
        }
      } catch (err) {
        logGatewayEvent(PROVIDERS.GROQ.name, 'Failed', err.message || String(err));
      }
    }
  }

  // 3. Fallback to DeepSeek if Gemini and Groq failed
  if (!activeProvider && !gatewayAbortController.signal.aborted) {
    const deepseekKey = PROVIDERS.DEEPSEEK.getKey();
    if (deepseekKey) {
      try {
        if (isDev) console.log('[AI Gateway Stream] Falling back to DeepSeek stream...');
        const response = await fetch(PROVIDERS.DEEPSEEK.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: PROVIDERS.DEEPSEEK.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
              }))
            ],
            stream: true,
          }),
          signal: gatewayAbortController.signal,
        });

        if (response.ok) {
          currentResponse = response;
          activeProvider = PROVIDERS.DEEPSEEK;
          logGatewayEvent(PROVIDERS.DEEPSEEK.name, 'Success');
        } else {
          const errText = await response.text();
          logGatewayEvent(PROVIDERS.DEEPSEEK.name, 'Failed', `${response.status} - ${errText.slice(0, 100)}`);
        }
      } catch (err) {
        logGatewayEvent(PROVIDERS.DEEPSEEK.name, 'Failed', err.message || String(err));
      }
    }
  }

  // If no provider could start a stream, send the generic error and terminate
  if ((!activeProvider || !currentResponse) && !gatewayAbortController.signal.aborted) {
    res.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  if (gatewayAbortController.signal.aborted) {
    return;
  }

  // Stream reader loop
  const reader = currentResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      if (gatewayAbortController.signal.aborted) {
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line

      for (const line of lines) {
        if (gatewayAbortController.signal.aborted) {
          break;
        }
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          let textChunk = '';

          if (activeProvider.name === 'Gemini') {
            textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else {
            // Groq and DeepSeek standard OpenAI choices format
            textChunk = parsed.choices?.[0]?.delta?.content || '';
          }

          if (textChunk) {
            fullText += textChunk;
            if (!gatewayAbortController.signal.aborted && !isConnectionClosed) {
              res.write(`data: ${JSON.stringify({ content: textChunk })}\n\n`);
            }
          }
        } catch {
          // Ignore parse errors from partial chunks
        }
      }
    }
  } catch (streamErr) {
    if (streamErr.name === 'AbortError' || gatewayAbortController.signal.aborted) {
      if (isDev) console.log('[AI Gateway Stream] Stream aborted mid-read');
    } else {
      console.error(`[AI Gateway Stream] Error mid-stream reading from ${activeProvider.name}:`, streamErr);
      if (!gatewayAbortController.signal.aborted && !isConnectionClosed) {
        res.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
      }
    }
  }

  if (options && typeof options.onComplete === 'function') {
    try {
      await options.onComplete(fullText);
    } catch (err) {
      console.error('[AI Gateway] Error in onComplete callback:', err);
    }
  }

  isStreamFinished = true;
  if (!gatewayAbortController.signal.aborted && !isConnectionClosed) {
    res.write('data: [DONE]\n\n');
    res.end();
  }
  return fullText;
}

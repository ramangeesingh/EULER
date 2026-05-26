import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

/**
 * System prompt that defines Euler's personality and capabilities.
 */
const SYSTEM_PROMPT = `You are Euler, an advanced AI coding assistant. You help developers with:
- Writing, debugging, and reviewing code
- Architecture design and best practices
- Explaining complex programming concepts
- Generating project structures and boilerplate
- Optimizing code performance

You are concise, precise, and helpful. When showing code, use markdown code blocks with the appropriate language.
Keep responses focused and actionable. You have a calm, professional tone with a touch of warmth.`;

/**
 * POST /api/chat
 * Body: { messages: [{ role: 'user'|'assistant', content: string }] }
 * Response: Server-Sent Events stream formatted to match what the frontend expects
 */
app.post('/api/chat', async (req, res) => {
  const { messages = [] } = req.body;

  if (!messages.length) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  // Build the messages array for Gemini
  const geminiContents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: geminiContents,
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API error:', response.status, errBody);
      res.write(`data: ${JSON.stringify({ error: `Gemini API error: ${response.status}` })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the incomplete line in the buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        
        // Gemini doesn't always send [DONE], but we'll handle it just in case
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          // Gemini response format: { candidates: [{ content: { parts: [{ text: "..." }] } }] }
          const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (textChunk) {
            // Send in the format our frontend expects (same as OpenAI format we set up earlier)
            res.write(`data: ${JSON.stringify({ content: textChunk })}\n\n`);
          }
        } catch {
          // Skip malformed chunks
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'gemini-2.5-flash' });
});

const PORT = 3001;
createServer(app).listen(PORT, () => {
  console.log(`\n  🚀 Euler backend running at http://localhost:${PORT}`);
  console.log(`  📡 API endpoint: http://localhost:${PORT}/api/chat (Using Gemini)\n`);
});

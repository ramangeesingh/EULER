/**
 * routes/devassistant.js
 * ─────────────────────────────────────────────────────────────
 * AI Dev Assistant backend routes
 * Powers the interactive developer chat workspace in Euler
 * ─────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { geminiStream, geminiGenerate, parseJSON } from '../server/gemini.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Shared developer-focused system prompt
// ─────────────────────────────────────────────────────────────
const DEV_SYSTEM_BASE = `You are Euler Dev Assistant — an elite AI pair programmer with deep expertise across all programming languages, frameworks, and software engineering disciplines.

Your core capabilities:
- **Code Explanation**: Break down complex code into clear, digestible explanations with specific references to functions, patterns, and logic
- **Debugging**: Identify root causes of bugs, interpret error messages and stack traces, and provide precise fixes
- **Code Generation**: Write clean, idiomatic, production-ready code with proper error handling
- **Code Review**: Spot anti-patterns, security issues, performance bottlenecks, and suggest improvements
- **Architecture**: Guide architectural decisions, design patterns, and best practices

Your response style:
- Always use markdown with fenced code blocks (e.g. \`\`\`javascript) for ALL code samples
- Be precise and actionable — no filler text
- Reference specific line numbers and function names when discussing provided code
- When fixing bugs, show both the broken version and the fixed version
- Keep explanations concise but thorough — developers value their time
- Use numbered steps for multi-part solutions
- Bold (**) key terms and important warnings`;

// Mode-specific system prompt extensions
const MODE_EXTENSIONS = {
  explain: `\n\nCURRENT MODE: Code Explanation
When explaining code: structure your response as (1) High-level overview, (2) Key functions/components, (3) Data flow, (4) Notable patterns or concerns.`,

  debug: `\n\nCURRENT MODE: Debugging
When debugging: structure your response as (1) Root cause identified, (2) Why it happens, (3) The exact fix with corrected code, (4) How to prevent this in future.`,

  fix: `\n\nCURRENT MODE: Generate Fix
Provide the complete corrected code. Show a before/after diff if the change is small, or the full corrected file if large. Include a brief explanation of every change made.`,

  improve: `\n\nCURRENT MODE: Code Improvement
Review the provided code for: performance bottlenecks, security vulnerabilities, readability issues, missing error handling, and architectural improvements. Prioritize by impact.`,

  general: '',
};

// ─────────────────────────────────────────────────────────────
// POST /api/devassistant/chat
// Main streaming chat — context-aware developer conversation
// ─────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const {
    messages = [],
    mode = 'general',
    codeContext = '',
    fileContext = '',
  } = req.body;

  if (!messages.length) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const modeExt = MODE_EXTENSIONS[mode] || '';
  let systemPrompt = DEV_SYSTEM_BASE + modeExt;

  if (codeContext || fileContext) {
    systemPrompt += '\n\n─── PROVIDED CONTEXT ───';
    if (fileContext) {
      systemPrompt += `\n\nFile reference: ${fileContext}`;
    }
    if (codeContext) {
      systemPrompt += `\n\nCode snippet provided by user:\n\`\`\`\n${codeContext.slice(0, 12000)}\n\`\`\``;
    }
    systemPrompt += '\n\nUse this code context to inform your response. Reference specific parts of it directly.';
  }

  const geminiContents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    await geminiStream(systemPrompt, geminiContents, res);
  } catch (err) {
    console.error('Dev assistant chat error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/devassistant/explain
// Quick code explanation — non-streaming JSON
// ─────────────────────────────────────────────────────────────
router.post('/explain', async (req, res) => {
  const { code = '', language = '', filename = '' } = req.body;
  if (!code.trim()) return res.status(400).json({ error: 'No code provided' });

  const systemPrompt = DEV_SYSTEM_BASE + MODE_EXTENSIONS.explain;
  const userPrompt = `Explain this ${language || 'code'}${filename ? ` from ${filename}` : ''}:\n\n\`\`\`${language}\n${code.slice(0, 10000)}\n\`\`\``;

  try {
    const result = await geminiGenerate(systemPrompt, userPrompt, 0.3);
    res.json({ explanation: result });
  } catch (err) {
    console.error('Explain error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/devassistant/debug
// Analyze error/stack trace — returns structured diagnostics
// ─────────────────────────────────────────────────────────────
router.post('/debug', async (req, res) => {
  const { error: errorText = '', code = '', language = '' } = req.body;
  if (!errorText.trim()) return res.status(400).json({ error: 'No error provided' });

  const systemPrompt = `You are an expert debugger. Analyze errors and stack traces with surgical precision. Always respond with ONLY valid JSON (no markdown fences).`;

  const userPrompt = `Diagnose this error${code ? ' in the provided code' : ''}:

ERROR / STACK TRACE:
${errorText.slice(0, 3000)}

${code ? `CODE:\n\`\`\`${language}\n${code.slice(0, 8000)}\n\`\`\`` : ''}

Respond with ONLY this JSON structure:
{
  "rootCause": "one sentence description of the root cause",
  "explanation": "detailed explanation of why this happens",
  "fix": "the exact code fix",
  "fixLanguage": "javascript",
  "prevention": "how to prevent this in future",
  "severity": "critical|high|medium|low"
}`;

  try {
    const raw = await geminiGenerate(systemPrompt, userPrompt, 0.2);
    const result = parseJSON(raw, { rootCause: raw, explanation: '', fix: '', prevention: '', severity: 'high' });
    res.json(result);
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/devassistant/suggest
// Generate a list of suggested prompts based on context
// ─────────────────────────────────────────────────────────────
router.post('/suggest', async (req, res) => {
  const { lastMessage = '', codeContext = '' } = req.body;

  const systemPrompt = `You generate contextual developer questions. Always respond with ONLY valid JSON.`;
  const userPrompt = `Based on this context, suggest 5 follow-up developer questions that would be most useful:

Last message: "${lastMessage.slice(0, 500)}"
${codeContext ? `Code context: ${codeContext.slice(0, 2000)}` : ''}

Respond with ONLY: { "suggestions": ["question 1", "question 2", "question 3", "question 4", "question 5"] }`;

  try {
    const raw = await geminiGenerate(systemPrompt, userPrompt, 0.7);
    const result = parseJSON(raw, { suggestions: [] });
    res.json(result);
  } catch (err) {
    res.json({ suggestions: [] }); // fail silently — suggestions are non-critical
  }
});

export default router;

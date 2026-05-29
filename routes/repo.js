/**
 * routes/repo.js
 * ─────────────────────────────────────────────────────────────
 * Repo Intelligence backend routes
 * All analysis is powered by the Gemini API (gemini-2.5-flash)
 * ─────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';

const router = Router();

// ── Multer — in-memory storage (no disk writes) ───────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB cap
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

// ── Text file extensions we'll parse ─────────────────────────
const TEXT_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift',
  'c', 'cpp', 'h', 'hpp', 'cs',
  'html', 'css', 'scss', 'sass', 'less',
  'json', 'yaml', 'yml', 'toml', 'xml',
  'md', 'mdx', 'txt', 'env', 'sh', 'bash',
  'sql', 'graphql', 'gql', 'prisma',
  'vue', 'svelte', 'astro',
  'dockerfile', 'makefile', 'gitignore',
]);

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'target', 'vendor', '.cache', 'coverage', '.nyc_output',
]);

/**
 * Helper — call Gemini non-streaming and return text
 */
async function geminiGenerate(systemPrompt, userPrompt) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/**
 * Helper — parse ZIP buffer into a file tree + content map
 */
function parseZip(buffer) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const files = {}; // path → content string
  const tree = {};  // nested folder structure

  // Find common prefix (GitHub ZIPs have a top-level folder)
  const allPaths = entries.map((e) => e.entryName);
  const commonPrefix = allPaths.length > 0
    ? allPaths[0].split('/')[0] + '/'
    : '';
  const hasPrefix = allPaths.every((p) => p.startsWith(commonPrefix));

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    let fullPath = entry.entryName;
    // Strip common prefix
    const displayPath = hasPrefix && fullPath.startsWith(commonPrefix)
      ? fullPath.slice(commonPrefix.length)
      : fullPath;

    if (!displayPath) continue;

    // Skip hidden/unwanted dirs
    const parts = displayPath.split('/');
    if (parts.some((p) => SKIP_DIRS.has(p.toLowerCase()))) continue;

    // Only parse text files
    const ext = parts[parts.length - 1].split('.').pop().toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext) && !['dockerfile', 'makefile', 'procfile'].includes(parts[parts.length - 1].toLowerCase())) {
      continue;
    }

    try {
      const content = entry.getData().toString('utf8');
      files[displayPath] = content;

      // Build nested tree structure
      let node = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]]) node[parts[i]] = { __type: 'dir', children: {} };
        node = node[parts[i]].children;
      }
      const fileName = parts[parts.length - 1];
      node[fileName] = { __type: 'file', path: displayPath, size: content.length };
    } catch {
      // Binary or unreadable file — skip
    }
  }

  return { files, tree };
}

/**
 * Helper — detect project language stats
 */
function getLanguageStats(files) {
  const extCounts = {};
  let totalLines = 0;

  for (const [path, content] of Object.entries(files)) {
    const ext = path.split('.').pop().toLowerCase();
    extCounts[ext] = (extCounts[ext] || 0) + 1;
    totalLines += content.split('\n').length;
  }

  const sorted = Object.entries(extCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ext, count]) => ({ ext, count }));

  return { languages: sorted, totalLines, totalFiles: Object.keys(files).length };
}

// ─────────────────────────────────────────────────────────────
// POST /api/repo/analyze
// Upload & parse a ZIP, get initial AI summary
// ─────────────────────────────────────────────────────────────
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { files, tree } = parseZip(req.file.buffer);
    const stats = getLanguageStats(files);

    if (Object.keys(files).length === 0) {
      return res.status(400).json({ error: 'No readable text files found in ZIP' });
    }

    // Build a compact repo snapshot for Gemini (cap at ~80k chars)
    const MAX_CONTEXT = 80000;
    let contextStr = '';
    const included = [];

    // Prioritize important files
    const priority = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod',
      'README.md', 'index.js', 'main.py', 'App.jsx', 'App.tsx', 'main.go'];

    const sortedFiles = Object.keys(files).sort((a, b) => {
      const aName = a.split('/').pop();
      const bName = b.split('/').pop();
      const aPrio = priority.indexOf(aName);
      const bPrio = priority.indexOf(bName);
      if (aPrio !== -1 && bPrio !== -1) return aPrio - bPrio;
      if (aPrio !== -1) return -1;
      if (bPrio !== -1) return 1;
      return a.localeCompare(b);
    });

    for (const path of sortedFiles) {
      const snippet = `\n\n=== FILE: ${path} ===\n${files[path].slice(0, 3000)}`;
      if (contextStr.length + snippet.length > MAX_CONTEXT) break;
      contextStr += snippet;
      included.push(path);
    }

    const systemPrompt = `You are an expert software architect and code analyst. Analyze codebases deeply and provide structured, actionable insights.`;

    const userPrompt = `Analyze this repository and respond with ONLY a valid JSON object (no markdown code blocks):

${contextStr}

Return this exact JSON structure:
{
  "projectName": "detected project name",
  "projectType": "Web App / CLI / Library / API / Mobile / etc",
  "summary": "2-3 sentence project summary",
  "mainLanguage": "primary language",
  "frameworks": ["list", "of", "frameworks"],
  "entryPoints": ["main files or entry points"],
  "architecture": "brief architecture description (1-2 sentences)",
  "keyComponents": [{"name": "component name", "description": "what it does", "path": "file path"}],
  "potentialIssues": ["issue 1", "issue 2"],
  "techStack": ["tech1", "tech2"]
}`;

    const raw = await geminiGenerate(systemPrompt, userPrompt);

    let analysis = {};
    try {
      // Strip markdown fences if present
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { summary: raw, projectName: req.file.originalname.replace('.zip', '') };
    }

    res.json({
      success: true,
      repoName: analysis.projectName || req.file.originalname.replace('.zip', ''),
      analysis,
      stats,
      tree,
      fileCount: Object.keys(files).length,
      includedFiles: included,
      // Send file contents to frontend for search + viewing
      files: Object.fromEntries(
        Object.entries(files).map(([k, v]) => [k, v.slice(0, 50000)]) // cap per file
      ),
    });
  } catch (err) {
    console.error('Repo analyze error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze repository' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/explain
// Explain a single file
// ─────────────────────────────────────────────────────────────
router.post('/explain', async (req, res) => {
  const { filePath, content, repoContext } = req.body;
  if (!filePath || !content) return res.status(400).json({ error: 'Missing filePath or content' });

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const systemPrompt = `You are an expert code analyst. Explain code files clearly for developers.${repoContext ? `\n\nRepository context: ${repoContext}` : ''}`;
    const userPrompt = `Explain this file in detail:\n\nFile: ${filePath}\n\n\`\`\`\n${content.slice(0, 15000)}\n\`\`\`\n\nCover: purpose, key functions/classes, dependencies it uses, how it fits in the project, and any notable patterns or issues.`;

    const response = await fetch(GEMINI_STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      }),
    });

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ error: 'Gemini error' })}\n\n`);
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
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        } catch { /* skip */ }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Explain error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/bugs
// Detect bugs and dead code
// ─────────────────────────────────────────────────────────────
router.post('/bugs', async (req, res) => {
  const { files } = req.body;
  if (!files || !Object.keys(files).length) return res.status(400).json({ error: 'No files provided' });

  try {
    // Cap context
    let contextStr = '';
    const MAX = 60000;
    for (const [path, content] of Object.entries(files)) {
      const snippet = `\n\n=== ${path} ===\n${content.slice(0, 4000)}`;
      if (contextStr.length + snippet.length > MAX) break;
      contextStr += snippet;
    }

    const prompt = `Analyze this codebase for bugs, security vulnerabilities, dead code, and code quality issues.

${contextStr}

Respond with ONLY valid JSON (no markdown fences):
{
  "bugs": [{"file": "path", "line": "~10-20", "severity": "high|medium|low", "type": "Bug|Security|Dead Code|Quality", "description": "what's wrong", "suggestion": "how to fix"}],
  "summary": "overall code health summary",
  "score": 85
}`;

    const raw = await geminiGenerate(
      'You are a senior code reviewer and security analyst. Find real issues in code.',
      prompt
    );

    let result = {};
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { bugs: [], summary: raw, score: 70 };
    }

    res.json(result);
  } catch (err) {
    console.error('Bugs error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/deps
// Dependency analysis
// ─────────────────────────────────────────────────────────────
router.post('/deps', async (req, res) => {
  const { files } = req.body;

  try {
    // Find dependency files
    const depFiles = {};
    const depFileNames = ['package.json', 'requirements.txt', 'Cargo.toml', 'go.mod',
      'Gemfile', 'pom.xml', 'build.gradle', 'pyproject.toml'];

    for (const [path, content] of Object.entries(files || {})) {
      const name = path.split('/').pop();
      if (depFileNames.includes(name)) {
        depFiles[path] = content;
      }
    }

    let contextStr = Object.entries(depFiles)
      .map(([path, content]) => `=== ${path} ===\n${content}`)
      .join('\n\n');

    if (!contextStr) contextStr = 'No standard dependency files found';

    const raw = await geminiGenerate(
      'You are a dependency and security expert.',
      `Analyze these dependency files and respond with ONLY valid JSON:

${contextStr}

{
  "dependencies": [{"name": "pkg", "version": "1.0", "type": "prod|dev", "description": "what it does", "risk": "low|medium|high", "riskReason": "why"}],
  "outdated": ["packages likely outdated"],
  "security": ["known security concerns"],
  "summary": "brief dep summary",
  "totalDeps": 0,
  "devDeps": 0
}`
    );

    let result = {};
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { dependencies: [], summary: raw };
    }

    res.json(result);
  } catch (err) {
    console.error('Deps error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/docs
// Generate documentation
// ─────────────────────────────────────────────────────────────
router.post('/docs', async (req, res) => {
  const { analysis, files } = req.body;

  try {
    let contextStr = '';
    const MAX = 40000;
    for (const [path, content] of Object.entries(files || {})) {
      const snippet = `\n\n### ${path}\n\`\`\`\n${content.slice(0, 2000)}\n\`\`\``;
      if (contextStr.length + snippet.length > MAX) break;
      contextStr += snippet;
    }

    const raw = await geminiGenerate(
      'You are a technical writer. Generate clear, developer-friendly documentation in Markdown.',
      `Generate comprehensive documentation for this project.

Project Analysis: ${JSON.stringify(analysis || {})}

Key Files:
${contextStr}

Write a full README.md with: overview, features, installation, usage, API reference (if applicable), architecture, contributing guide. Use professional markdown formatting.`
    );

    res.json({ docs: raw });
  } catch (err) {
    console.error('Docs error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/onboarding
// Generate developer onboarding guide
// ─────────────────────────────────────────────────────────────
router.post('/onboarding', async (req, res) => {
  const { analysis, fileTree, stats } = req.body;

  try {
    const raw = await geminiGenerate(
      'You are a senior engineer creating onboarding materials for new developers.',
      `Create a developer onboarding guide for this project.

Project: ${JSON.stringify(analysis || {})}
Stats: ${JSON.stringify(stats || {})}
File Tree Summary: ${JSON.stringify(fileTree || {}, null, 2).slice(0, 5000)}

Include: welcome message, project overview, tech stack explanation, how to run locally, key areas of the codebase, important files to read first, common workflows, gotchas, and next steps. Be friendly and detailed. Use Markdown.`
    );

    res.json({ guide: raw });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/chat
// Repo-aware streaming chat
// ─────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages = [], repoContext, analysis } = req.body;

  if (!messages.length) return res.status(400).json({ error: 'No messages' });

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const systemPrompt = `You are Euler, an expert AI code analyst with full knowledge of the uploaded repository.

Repository Overview: ${JSON.stringify(analysis || {})}

Repository Files Context:
${(repoContext || '').slice(0, 60000)}

Answer questions about this codebase precisely. Reference specific files and line numbers when relevant. You can explain code, suggest improvements, answer architecture questions, and help with debugging.`;

    const geminiContents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(GEMINI_STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: geminiContents,
      }),
    });

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ error: 'Gemini error' })}\n\n`);
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
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        } catch { /* skip */ }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Repo chat error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/search
// Full-text search across repo files
// ─────────────────────────────────────────────────────────────
router.post('/search', (req, res) => {
  const { query, files } = req.body;
  if (!query || !files) return res.status(400).json({ error: 'Missing query or files' });

  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const [filePath, content] of Object.entries(files)) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        results.push({
          file: filePath,
          line: i + 1,
          content: lines[i].trim(),
          context: lines.slice(Math.max(0, i - 1), i + 2).join('\n'),
        });
        if (results.length >= 100) break; // cap results
      }
    }
    if (results.length >= 100) break;
  }

  res.json({ results, total: results.length });
});

export default router;

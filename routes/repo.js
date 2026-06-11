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
import { aiGenerate, aiStream, sanitizeError, parseJSON } from '../server/ai-gateway.js';

const router = Router();

// ── Multer — in-memory storage (no disk writes) ───────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB cap
});

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

// ─────────────────────────────────────────────────────────────
// Helper — parse ZIP buffer into a file tree + content map
// ─────────────────────────────────────────────────────────────
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

    const fullPath = entry.entryName;
    const displayPath = hasPrefix && fullPath.startsWith(commonPrefix)
      ? fullPath.slice(commonPrefix.length)
      : fullPath;

    if (!displayPath) continue;

    const parts = displayPath.split('/');
    if (parts.some((p) => SKIP_DIRS.has(p.toLowerCase()))) continue;

    const ext = parts[parts.length - 1].split('.').pop().toLowerCase();
    if (
      !TEXT_EXTENSIONS.has(ext) &&
      !['dockerfile', 'makefile', 'procfile'].includes(parts[parts.length - 1].toLowerCase())
    ) continue;

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
      // Binary or unreadable — skip
    }
  }

  return { files, tree };
}

// ─────────────────────────────────────────────────────────────
// Helper — detect project language stats
// ─────────────────────────────────────────────────────────────
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
  console.log("[REPO_ANALYSIS] Repo analysis request received");
  if (req.file) {
    console.log(`[REPO_ANALYSIS] Repository filename: ${req.file.originalname}`);
    console.log(`[REPO_ANALYSIS] Repository size: ${req.file.size} bytes`);
  } else {
    console.log("[REPO_ANALYSIS] No file provided in request");
  }

  try {
    // Stage 1: Repository cloning
    console.log("[REPO_ANALYSIS] [Stage 1/7] Repository cloning: Not applicable (received ZIP upload direct to memory)");

    // Stage 2: Repository reading
    console.log("[REPO_ANALYSIS] [Stage 2/7] Repository reading started");
    if (!req.file) {
      console.log("[REPO_ANALYSIS] Repository reading failed: No file uploaded");
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log("[REPO_ANALYSIS] Repository reading completed successfully");

    // Stage 3: File extraction
    console.log("[REPO_ANALYSIS] [Stage 3/7] File extraction from ZIP started");
    const { files, tree } = parseZip(req.file.buffer);
    console.log(`[REPO_ANALYSIS] File extraction completed. Extracted text file count: ${Object.keys(files).length}`);

    const stats = getLanguageStats(files);
    console.log(`[REPO_ANALYSIS] Repository language stats: ${JSON.stringify(stats)}`);

    if (Object.keys(files).length === 0) {
      console.log("[REPO_ANALYSIS] File extraction failed: No readable text files found in ZIP");
      return res.status(400).json({ error: 'No readable text files found in ZIP' });
    }

    // Stage 4: Chunking/indexing
    console.log("[REPO_ANALYSIS] [Stage 4/7] Chunking/indexing repository files for AI context started");
    // Build a compact repo snapshot for Gemini (cap at ~80k chars)
    const MAX_CONTEXT = 80000;
    let contextStr = '';
    const included = [];

    const priority = [
      'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod',
      'README.md', 'index.js', 'main.py', 'App.jsx', 'App.tsx', 'main.go',
    ];

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
    console.log(`[REPO_ANALYSIS] Chunking/indexing completed. Included files count: ${included.length}`);
    console.log(`[REPO_ANALYSIS] Total context payload size: ${contextStr.length} characters`);

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

    // Stage 5: Gemini request
    console.log("[REPO_ANALYSIS] [Stage 5/7] Gemini request starting");
    console.log(`[REPO_ANALYSIS] System prompt length: ${systemPrompt.length}`);
    console.log(`[REPO_ANALYSIS] User prompt length: ${userPrompt.length}`);

    const raw = await aiGenerate(systemPrompt, userPrompt, 0.3);

    // Stage 6: Gemini response
    console.log("[REPO_ANALYSIS] [Stage 6/7] Gemini response received");
    console.log(`[REPO_ANALYSIS] Raw Gemini output length: ${raw?.length || 0}`);

    // Stage 7: Analysis generation
    console.log("[REPO_ANALYSIS] [Stage 7/7] Analysis generation and structuring started");
    let analysis = {};
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleaned);
      console.log("[REPO_ANALYSIS] Analysis structure successfully parsed as JSON");
    } catch (parseErr) {
      console.warn(`[REPO_ANALYSIS] Analysis structuring failed, falling back to raw output: ${parseErr?.message}`);
      analysis = { summary: raw, projectName: req.file.originalname.replace('.zip', '') };
    }
    console.log("[REPO_ANALYSIS] Analysis generation completed successfully");

    res.json({
      success: true,
      repoName: analysis.projectName || req.file.originalname.replace('.zip', ''),
      analysis,
      stats,
      tree,
      fileCount: Object.keys(files).length,
      includedFiles: included,
      files: Object.fromEntries(
        Object.entries(files).map(([k, v]) => [k, v.slice(0, 50000)])
      ),
    });
  } catch (err) {
    console.error("[REPO_ANALYSIS] REPO ANALYSIS ERROR:", err);
    console.error("[REPO_ANALYSIS] ERROR MESSAGE:", err?.message);
    console.error("[REPO_ANALYSIS] ERROR STACK:", err?.stack);

    const errMessage = err?.message || err?.toString() || '';
    if (
      errMessage.includes('429') ||
      errMessage.includes('500') ||
      errMessage.includes('503') ||
      /timeout|timed.?out/i.test(errMessage)
    ) {
      console.error("[REPO_ANALYSIS] ORIGINAL GEMINI ERROR RESPONSE DETAILS:", errMessage);
    }

    return res.status(500).json({
      error: "AI service is busy. Please try again in a moment."
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/explain
// Explain a single file (streaming)
// ─────────────────────────────────────────────────────────────
router.post('/explain', async (req, res) => {
  const { filePath, content, repoContext } = req.body;
  if (!filePath || !content) return res.status(400).json({ error: 'Missing filePath or content' });

  try {
    const systemPrompt = `You are an expert code analyst. Explain code files clearly for developers.${
      repoContext ? `\n\nRepository context: ${repoContext}` : ''
    }`;
    const userPrompt = `Explain this file in detail:\n\nFile: ${filePath}\n\n\`\`\`\n${content.slice(0, 15000)}\n\`\`\`\n\nCover: purpose, key functions/classes, dependencies it uses, how it fits in the project, and any notable patterns or issues.`;

    await aiStream(systemPrompt, [{ role: 'user', content: userPrompt }], res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: sanitizeError(err, 'repo/explain') });
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
    let contextStr = '';
    const MAX = 60000;
    for (const [path, content] of Object.entries(files)) {
      const snippet = `\n\n=== ${path} ===\n${content.slice(0, 4000)}`;
      if (contextStr.length + snippet.length > MAX) break;
      contextStr += snippet;
    }

    const raw = await aiGenerate(
      'You are a senior code reviewer and security analyst. Find real issues in code.',
      `Analyze this codebase for bugs, security vulnerabilities, dead code, and code quality issues.

${contextStr}

Respond with ONLY valid JSON (no markdown fences):
{
  "bugs": [{"file": "path", "line": "~10-20", "severity": "high|medium|low", "type": "Bug|Security|Dead Code|Quality", "description": "what's wrong", "suggestion": "how to fix"}],
  "summary": "overall code health summary",
  "score": 85
}`,
      0.3
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
    res.status(500).json({ error: sanitizeError(err, 'repo/bugs') });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/deps
// Dependency analysis
// ─────────────────────────────────────────────────────────────
router.post('/deps', async (req, res) => {
  const { files } = req.body;

  try {
    const depFileNames = [
      'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod',
      'Gemfile', 'pom.xml', 'build.gradle', 'pyproject.toml',
    ];

    const depFiles = {};
    for (const [path, content] of Object.entries(files || {})) {
      const name = path.split('/').pop();
      if (depFileNames.includes(name)) depFiles[path] = content;
    }

    let contextStr = Object.entries(depFiles)
      .map(([path, content]) => `=== ${path} ===\n${content}`)
      .join('\n\n');

    if (!contextStr) contextStr = 'No standard dependency files found';

    const raw = await aiGenerate(
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
}`,
      0.3
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
    res.status(500).json({ error: sanitizeError(err, 'repo/deps') });
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

    const raw = await aiGenerate(
      'You are a technical writer. Generate clear, developer-friendly documentation in Markdown.',
      `Generate comprehensive documentation for this project.

Project Analysis: ${JSON.stringify(analysis || {})}

Key Files:
${contextStr}

Write a full README.md with: overview, features, installation, usage, API reference (if applicable), architecture, contributing guide. Use professional markdown formatting.`
    );

    res.json({ docs: raw });
  } catch (err) {
    res.status(500).json({ error: sanitizeError(err, 'repo/docs') });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/repo/onboarding
// Generate developer onboarding guide
// ─────────────────────────────────────────────────────────────
router.post('/onboarding', async (req, res) => {
  const { analysis, fileTree, stats } = req.body;

  try {
    const raw = await aiGenerate(
      'You are a senior engineer creating onboarding materials for new developers.',
      `Create a developer onboarding guide for this project.

Project: ${JSON.stringify(analysis || {})}
Stats: ${JSON.stringify(stats || {})}
File Tree Summary: ${JSON.stringify(fileTree || {}, null, 2).slice(0, 5000)}

Include: welcome message, project overview, tech stack explanation, how to run locally, key areas of the codebase, important files to read first, common workflows, gotchas, and next steps. Be friendly and detailed. Use Markdown.`
    );

    res.json({ guide: raw });
  } catch (err) {
    res.status(500).json({ error: sanitizeError(err, 'repo/onboarding') });
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
    const systemPrompt = `You are Euler, an expert AI code analyst with full knowledge of the uploaded repository.

Repository Overview: ${JSON.stringify(analysis || {})}

Repository Files Context:
${(repoContext || '').slice(0, 60000)}

Answer questions about this codebase precisely. Reference specific files and line numbers when relevant. You can explain code, suggest improvements, answer architecture questions, and help with debugging.`;

    await aiStream(systemPrompt, messages, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: sanitizeError(err, 'repo/chat') });
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
        if (results.length >= 100) break;
      }
    }
    if (results.length >= 100) break;
  }

  res.json({ results, total: results.length });
});

export default router;

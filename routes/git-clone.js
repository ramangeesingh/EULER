/**
 * routes/git-clone.js
 * ─────────────────────────────────────────────────────────────
 * Git Repository Cloning and Analysis Routes
 * Secure GitHub repository cloning with validation and analysis
 * ─────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { geminiGenerate } from '../server/gemini.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ──────────────────────────────────────────
// IMPORTANT: Clone dir must be OUTSIDE the Vite project root.
// Placing repos inside the project causes Vite to watch them and trigger
// full page reloads whenever cloned repos contain tsconfig.json, index.html, etc.
const TEMP_DIR = path.join(os.homedir(), 'EulerRepos');
const MAX_REPO_SIZE = 100 * 1024 * 1024; // 100MB
const CLONE_TIMEOUT = 60000; // 60 seconds
const CLEANUP_DELAY = 5 * 60 * 1000; // 5 minutes
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

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'target', 'vendor', '.cache', 'coverage', '.nyc_output',
  'venv', '.venv', 'env', '.env', 'logs',
]);

// ── URL Validation ─────────────────────────────────────────
function validateGitHubUrl(url) {
  const patterns = [
    /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/,
    /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\.git$/,
    /^git@github\.com:[\w\-\.]+\/[\w\-\.]+\.git$/,
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

function normalizeGitHubUrl(url) {
  // Convert SSH to HTTPS
  if (url.startsWith('git@github.com:')) {
    url = url.replace('git@github.com:', 'https://github.com/');
  }
  
  // Remove .git suffix for cloning
  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }
  
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  
  return url;
}

function extractRepoInfo(url) {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) throw new Error('Invalid GitHub URL');
  
  return {
    owner: match[1],
    repo: match[2],
    fullName: `${match[1]}/${match[2]}`,
  };
}

// ── Repository Size Check ──────────────────────────────────
async function checkRepoSize(owner, repo) {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Repository not found or private');
      throw new Error('Failed to fetch repository information');
    }
    
    const data = await response.json();
    const sizeKB = data.size; // GitHub API returns size in KB
    const sizeMB = sizeKB / 1024;
    
    if (sizeMB > (MAX_REPO_SIZE / (1024 * 1024))) {
      throw new Error(`Repository too large (${sizeMB.toFixed(1)}MB). Maximum allowed: ${MAX_REPO_SIZE / (1024 * 1024)}MB`);
    }
    
    return {
      size: sizeMB,
      stars: data.stargazers_count,
      language: data.language,
      description: data.description,
      defaultBranch: data.default_branch || 'main',
    };
  } catch (error) {
    throw error;
  }
}

// ── File System Operations ─────────────────────────────────
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    throw new Error('Failed to create temporary directory');
  }
}

async function cleanupRepo(repoPath) {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

async function cloneRepository(url, targetDir) {
  try {
    const command = `git clone --depth 1 "${url}" "${targetDir}"`;
    execSync(command, { 
      timeout: CLONE_TIMEOUT,
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Git is not installed on the system');
    }
    if (error.signal === 'SIGTERM') {
      throw new Error('Clone operation timed out');
    }
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
}

// ── File Analysis ──────────────────────────────────────────
async function analyzeRepository(repoPath) {
  const files = {};
  const tree = {};
  
  async function scanDirectory(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        const entryRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name.toLowerCase())) continue;
          
          const subTree = {};
          await scanDirectory(entryPath, entryRelative);
          
          if (Object.keys(subTree).length > 0) {
            let node = tree;
            const parts = entryRelative.split('/');
            for (let i = 0; i < parts.length - 1; i++) {
              if (!node[parts[i]]) node[parts[i]] = { __type: 'dir', children: {} };
              node = node[parts[i]].children;
            }
            node[entry.name] = { __type: 'dir', children: subTree };
          }
        } else {
          const ext = entry.name.split('.').pop()?.toLowerCase();
          if (!TEXT_EXTENSIONS.has(ext) && 
              !['dockerfile', 'makefile', 'procfile'].includes(entry.name.toLowerCase())) {
            continue;
          }
          
          try {
            const stat = await fs.stat(entryPath);
            if (stat.size > 500000) continue; // Skip files > 500KB
            
            const content = await fs.readFile(entryPath, 'utf8');
            files[entryRelative] = content;
            
            // Build tree structure
            let node = tree;
            const parts = entryRelative.split('/');
            for (let i = 0; i < parts.length - 1; i++) {
              if (!node[parts[i]]) node[parts[i]] = { __type: 'dir', children: {} };
              node = node[parts[i]].children;
            }
            node[entry.name] = { 
              __type: 'file', 
              path: entryRelative, 
              size: content.length 
            };
          } catch (error) {
            // Skip unreadable files
            continue;
          }
        }
      }
    } catch (error) {
      // Skip unreadable directories
    }
  }
  
  await scanDirectory(repoPath);
  return { files, tree };
}

function getLanguageStats(files) {
  const extCounts = {};
  let totalLines = 0;
  
  for (const [path, content] of Object.entries(files)) {
    const ext = path.split('.').pop()?.toLowerCase();
    if (ext) {
      extCounts[ext] = (extCounts[ext] || 0) + 1;
    }
    totalLines += content.split('\n').length;
  }
  
  const sorted = Object.entries(extCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ext, count]) => ({ ext, count }));
  
  return { 
    languages: sorted, 
    totalLines, 
    totalFiles: Object.keys(files).length 
  };
}

async function generateAnalysis(files, repoInfo) {
  // Build context for AI analysis
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
  
  for (const filePath of sortedFiles) {
    const snippet = `\n\n=== FILE: ${filePath} ===\n${files[filePath].slice(0, 3000)}`;
    if (contextStr.length + snippet.length > MAX_CONTEXT) break;
    contextStr += snippet;
    included.push(filePath);
  }
  
  const systemPrompt = `You are an expert software architect and code analyst. Analyze codebases deeply and provide structured, actionable insights.`;
  
  const userPrompt = `Analyze this GitHub repository and respond with ONLY a valid JSON object (no markdown code blocks):

Repository: ${repoInfo.fullName}
Description: ${repoInfo.description || 'No description'}
Primary Language: ${repoInfo.language || 'Unknown'}
Stars: ${repoInfo.stars || 0}

${contextStr}

Return this exact JSON structure:
{
  "projectName": "${repoInfo.repo}",
  "projectType": "Web App / CLI / Library / API / Mobile / etc",
  "summary": "2-3 sentence project summary",
  "mainLanguage": "primary language",
  "frameworks": ["list", "of", "frameworks"],
  "entryPoints": ["main files or entry points"],
  "architecture": "brief architecture description (1-2 sentences)",
  "keyComponents": [{"name": "component name", "description": "what it does", "path": "file path"}],
  "potentialIssues": ["issue 1", "issue 2"],
  "techStack": ["tech1", "tech2"],
  "setupInstructions": ["step 1", "step 2"],
  "apiEndpoints": ["if applicable"],
  "databaseType": "if detected",
  "deploymentReady": true/false
}`;
  
  try {
    const raw = await geminiGenerate(systemPrompt, userPrompt, 0.3);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    return {
      summary: `Failed to generate analysis: ${error.message}`,
      projectName: repoInfo.repo,
      mainLanguage: repoInfo.language,
      error: true
    };
  }
}

// ── Routes ─────────────────────────────────────────────────

// POST /api/git-clone/validate
router.post('/validate', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }
    
    if (!validateGitHubUrl(url)) {
      return res.status(400).json({ 
        error: 'Invalid GitHub URL. Please provide a valid GitHub repository URL' 
      });
    }
    
    const normalizedUrl = normalizeGitHubUrl(url);
    const repoInfo = extractRepoInfo(normalizedUrl);
    const repoData = await checkRepoSize(repoInfo.owner, repoInfo.repo);
    
    res.json({
      success: true,
      url: normalizedUrl,
      repoInfo: { ...repoInfo, ...repoData }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/git-clone/clone
router.post('/clone', async (req, res) => {
  const { url } = req.body;
  let repoPath = null;
  
  try {
    if (!url || !validateGitHubUrl(url)) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }
    
    const normalizedUrl = normalizeGitHubUrl(url);
    const repoInfo = extractRepoInfo(normalizedUrl);
    
    // Validate repository
    const repoData = await checkRepoSize(repoInfo.owner, repoInfo.repo);
    
    // Setup temporary directory
    await ensureTempDir();
    const repoId = `${repoInfo.owner}-${repoInfo.repo}-${Date.now()}`;
    repoPath = path.join(TEMP_DIR, repoId);
    
    // Clone repository
    await cloneRepository(normalizedUrl, repoPath);
    
    // Analyze files
    const { files, tree } = await analyzeRepository(repoPath);
    
    if (Object.keys(files).length === 0) {
      throw new Error('No readable source files found in repository');
    }
    
    const stats = getLanguageStats(files);
    const analysis = await generateAnalysis(files, { ...repoInfo, ...repoData });
    
    // Cleanup
    await cleanupRepo(repoPath);
    
    res.json({
      success: true,
      repoName: repoInfo.repo,
      fullName: repoInfo.fullName,
      analysis,
      stats,
      tree,
      fileCount: Object.keys(files).length,
      repoData,
      files: Object.fromEntries(
        Object.entries(files).map(([k, v]) => [k, v.slice(0, 50000)])
      ),
    });
  } catch (error) {
    if (repoPath) {
      await cleanupRepo(repoPath);
    }
    
    console.error('Git clone error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
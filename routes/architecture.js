/**
 * routes/architecture.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture Engine — AI-powered software architecture generation
 * Powered by Gemini 2.5 Flash
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_STREAM_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

// ── In-memory architecture store (production: use DB) ─────────────────────────
const architectureStore = new Map();

/**
 * Helper — call Gemini (non-streaming) and return text
 */
async function geminiGenerate(systemPrompt, userPrompt, temperature = 0.4) {
  const response = await fetch(GEMINI_URL, {
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
    throw new Error(`Gemini error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

/**
 * Helper — strip JSON markdown fences and parse safely
 */
function parseJSON(raw, fallback = {}) {
  try {
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const ARCH_SYSTEM_PROMPT = `You are an elite software architect with 20+ years of experience at top tech companies (Google, Meta, Netflix, Stripe). You specialize in:
- Scalable distributed systems and microservices
- Cloud-native architectures (AWS, GCP, Azure)
- Database design and optimization
- API design (REST, GraphQL, gRPC)
- Security, authentication, and authorization patterns
- DevOps, CI/CD, and deployment strategies
- Performance optimization and scalability

When given an app idea, you produce precise, production-ready architectural recommendations that are detailed, opinionated, and immediately actionable. Your output is always structured JSON.`;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/architecture/generate
// Main architecture generation endpoint
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  const { prompt, preferences = {} } = req.body;

  if (!prompt?.trim()) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  const {
    scale = 'startup',       // startup | medium | enterprise
    style = 'monolith',      // monolith | microservices | serverless | hybrid
    cloud = 'aws',           // aws | gcp | azure | agnostic
    budget = 'medium',       // low | medium | high
  } = preferences;

  const userPrompt = `Generate a complete, production-ready software architecture for this application idea:

"${prompt}"

Preferences:
- Scale: ${scale} (${scale === 'startup' ? '0-10k users' : scale === 'medium' ? '10k-1M users' : '1M+ users'})
- Architecture style: ${style}
- Cloud provider: ${cloud}
- Budget: ${budget}

Return ONLY a valid JSON object (no markdown fences, no explanation outside JSON) with this EXACT structure:

{
  "overview": {
    "appName": "suggested app name",
    "tagline": "one-line description",
    "summary": "2-3 sentence technical overview",
    "complexity": "Low | Medium | High | Very High",
    "estimatedTimeline": "e.g. 3-6 months",
    "teamSize": "e.g. 3-5 engineers",
    "keyDecisions": ["key architectural decision 1", "key architectural decision 2", "key architectural decision 3"]
  },
  "stack": {
    "frontend": [
      { "name": "React", "reason": "why this tech", "version": "18.x", "category": "Framework" }
    ],
    "backend": [
      { "name": "Node.js", "reason": "why", "version": "20.x", "category": "Runtime" }
    ],
    "database": [
      { "name": "PostgreSQL", "reason": "why", "version": "15", "category": "Primary DB" }
    ],
    "infrastructure": [
      { "name": "AWS ECS", "reason": "why", "category": "Compute" }
    ],
    "devtools": [
      { "name": "GitHub Actions", "reason": "why", "category": "CI/CD" }
    ]
  },
  "folderStructure": {
    "frontend": {
      "src/": {
        "components/": "Reusable UI components",
        "pages/": "Route-level page components",
        "hooks/": "Custom React hooks",
        "store/": "State management (Zustand/Redux)",
        "lib/": "API clients and utilities",
        "types/": "TypeScript type definitions"
      },
      "public/": "Static assets",
      "package.json": "Dependencies"
    },
    "backend": {
      "src/": {
        "routes/": "API route handlers",
        "controllers/": "Business logic controllers",
        "services/": "Core business services",
        "middleware/": "Auth, rate limiting, logging",
        "models/": "Database models/schemas",
        "utils/": "Helper functions",
        "config/": "App configuration"
      },
      "prisma/": "Database schema & migrations",
      "tests/": "Unit and integration tests"
    }
  },
  "database": {
    "primary": {
      "type": "PostgreSQL",
      "reason": "why chosen",
      "hosting": "e.g. AWS RDS"
    },
    "cache": {
      "type": "Redis",
      "reason": "session, rate limiting, caching",
      "hosting": "ElastiCache"
    },
    "schemas": [
      {
        "name": "users",
        "description": "User accounts and profiles",
        "fields": [
          { "name": "id", "type": "UUID", "constraints": "PRIMARY KEY" },
          { "name": "email", "type": "VARCHAR(255)", "constraints": "UNIQUE NOT NULL" },
          { "name": "created_at", "type": "TIMESTAMP", "constraints": "DEFAULT NOW()" }
        ],
        "indexes": ["email", "created_at"]
      }
    ],
    "migrations": "Use Prisma Migrate for schema versioning",
    "scalingStrategy": "Read replicas for heavy read workloads, connection pooling via PgBouncer"
  },
  "api": {
    "style": "REST | GraphQL | gRPC",
    "baseUrl": "/api/v1",
    "versioning": "URL-based (v1, v2)",
    "documentation": "OpenAPI 3.0 / Swagger",
    "routes": [
      {
        "group": "Authentication",
        "endpoints": [
          { "method": "POST", "path": "/auth/register", "description": "Register new user", "auth": false, "body": "{ email, password, name }", "response": "{ user, token }" },
          { "method": "POST", "path": "/auth/login", "description": "Authenticate user", "auth": false, "body": "{ email, password }", "response": "{ token, refreshToken }" },
          { "method": "POST", "path": "/auth/refresh", "description": "Refresh access token", "auth": true, "body": "{ refreshToken }", "response": "{ token }" }
        ]
      }
    ],
    "rateLimit": "100 req/min per IP, 1000 req/min per user",
    "pagination": "Cursor-based for scalability"
  },
  "authentication": {
    "strategy": "JWT + Refresh Tokens",
    "provider": "e.g. Auth0 / Supabase Auth / Custom",
    "flow": [
      "User submits credentials",
      "Server validates and issues JWT (15min) + Refresh Token (30 days)",
      "Client stores tokens securely (httpOnly cookie for refresh)",
      "Silent refresh using refresh token before expiry",
      "Logout invalidates refresh token in Redis"
    ],
    "security": [
      "bcrypt for password hashing (cost factor 12)",
      "Rate limiting on auth endpoints (5 attempts/15min)",
      "CSRF protection for cookie-based auth",
      "MFA support via TOTP (optional)",
      "OAuth 2.0 (Google, GitHub)"
    ],
    "rbac": {
      "roles": ["admin", "user", "moderator"],
      "permissions": "Fine-grained resource-level permissions"
    }
  },
  "deployment": {
    "environments": ["development", "staging", "production"],
    "containerization": "Docker + Docker Compose for local dev",
    "orchestration": "Kubernetes (EKS) or Docker Swarm",
    "cicd": {
      "pipeline": "GitHub Actions",
      "stages": ["lint", "test", "build", "security-scan", "deploy"],
      "strategy": "Blue-green deployment"
    },
    "cdn": "CloudFront / Vercel Edge",
    "monitoring": ["Datadog / Grafana + Prometheus", "Sentry for error tracking", "PagerDuty for alerts"],
    "infrastructure": "Terraform for IaC",
    "estimated_monthly_cost": "e.g. $200-500/month"
  },
  "scalability": {
    "bottlenecks": ["Database connections", "File uploads", "Real-time features"],
    "solutions": [
      { "problem": "Database bottleneck", "solution": "Connection pooling + Read replicas", "when": "1000+ concurrent users" },
      { "problem": "Static assets", "solution": "CDN distribution", "when": "From day 1" },
      { "problem": "Background jobs", "solution": "Bull queue with Redis", "when": "Any async operations" }
    ],
    "caching": {
      "layers": ["Browser cache (static assets)", "CDN cache", "Application cache (Redis)", "Database query cache"],
      "strategy": "Cache-aside pattern for user data"
    },
    "horizontalScaling": "Stateless services behind load balancer",
    "futureConsiderations": ["Event-driven architecture for decoupling", "CQRS for read/write separation", "GraphQL federation for multi-team APIs"]
  },
  "microservices": {
    "applicable": true,
    "services": [
      { "name": "auth-service", "responsibility": "Authentication & authorization", "tech": "Node.js", "port": 3001 },
      { "name": "user-service", "responsibility": "User profiles & settings", "tech": "Node.js", "port": 3002 }
    ],
    "communication": "REST for sync, Redis Pub/Sub / Kafka for async",
    "serviceDiscovery": "Kubernetes DNS",
    "apiGateway": "Kong / AWS API Gateway"
  },
  "security": {
    "checklist": [
      "HTTPS everywhere (Let's Encrypt / ACM)",
      "SQL injection prevention (parameterized queries)",
      "XSS protection (CSP headers, input sanitization)",
      "CORS policy configuration",
      "Dependency vulnerability scanning (Snyk)",
      "Secrets management (AWS Secrets Manager / HashiCorp Vault)",
      "Data encryption at rest (AES-256) and in transit (TLS 1.3)",
      "Regular security audits and penetration testing"
    ]
  }
}`;

  try {
    const raw = await geminiGenerate(ARCH_SYSTEM_PROMPT, userPrompt, 0.5);
    const architecture = parseJSON(raw, { overview: { appName: 'App', summary: raw } });

    // Store in memory
    const id = `arch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const saved = {
      id,
      prompt,
      preferences,
      architecture,
      createdAt: new Date().toISOString(),
      title: architecture.overview?.appName || 'Untitled Architecture',
    };
    architectureStore.set(id, saved);

    res.json({ success: true, id, architecture, savedAt: saved.createdAt });
  } catch (err) {
    console.error('Architecture generate error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate architecture' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/architecture/chat
// Streaming AI refinement chat for an existing architecture
// ─────────────────────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { messages = [], architectureContext } = req.body;

  if (!messages.length) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const systemPrompt = `You are an expert software architect refining an architecture plan with the user.

Current Architecture Context:
${architectureContext ? JSON.stringify(architectureContext, null, 2).slice(0, 8000) : 'No architecture loaded yet.'}

Help the user refine, expand, question, or modify their architecture. Be specific, technical, and actionable. Reference the existing architecture when relevant. Suggest concrete improvements with rationale. Use markdown for formatting when helpful.`;

  const geminiContents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
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
    console.error('Architecture chat error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/architecture/saved
// List all saved architectures
// ─────────────────────────────────────────────────────────────────────────────
router.get('/saved', (req, res) => {
  const list = Array.from(architectureStore.values())
    .map(({ id, title, prompt, createdAt, preferences }) => ({
      id,
      title,
      prompt,
      createdAt,
      preferences,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ saved: list });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/architecture/:id
// Fetch a saved architecture by ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const arch = architectureStore.get(req.params.id);
  if (!arch) return res.status(404).json({ error: 'Architecture not found' });
  res.json(arch);
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/architecture/:id
// Delete a saved architecture
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const existed = architectureStore.delete(req.params.id);
  if (!existed) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/architecture/diagram
// Generate a Mermaid.js diagram for a section of the architecture
// ─────────────────────────────────────────────────────────────────────────────
router.post('/diagram', async (req, res) => {
  const { architecture, type = 'system' } = req.body;

  if (!architecture) {
    return res.status(400).json({ error: 'No architecture provided' });
  }

  const diagramPrompts = {
    system: 'Generate a Mermaid.js flowchart diagram showing the high-level system architecture including frontend, backend, databases, cache, and external services.',
    sequence: 'Generate a Mermaid.js sequence diagram showing the authentication flow from user login to accessing a protected resource.',
    database: 'Generate a Mermaid.js entity-relationship diagram (erDiagram) showing the main database tables and their relationships.',
    deployment: 'Generate a Mermaid.js flowchart showing the deployment pipeline from developer push to production.',
    microservices: 'Generate a Mermaid.js flowchart showing how microservices communicate with each other and with external clients.',
  };

  try {
    const raw = await geminiGenerate(
      'You are an expert at creating Mermaid.js diagrams. Return ONLY the raw Mermaid diagram code, no explanation, no markdown fences.',
      `${diagramPrompts[type] || diagramPrompts.system}

Architecture context:
${JSON.stringify(architecture, null, 2).slice(0, 5000)}

Return only the Mermaid diagram code starting with the diagram type (e.g., "flowchart TD" or "sequenceDiagram" or "erDiagram").`,
      0.3
    );

    // Clean up any accidental fences
    const diagram = raw.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
    res.json({ diagram, type });
  } catch (err) {
    console.error('Diagram error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

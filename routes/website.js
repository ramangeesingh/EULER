/**
 * routes/website.js
 * ─────────────────────────────────────────────────────────────
 * Build Website backend routes
 * All generation is powered by the Gemini API (gemini-2.5-flash)
 * ─────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { aiGenerate, aiStream, parseJSON, sanitizeError } from '../server/ai-gateway.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Map user-facing style names to detailed CSS instructions */
const STYLE_INSTRUCTIONS = {
  glassmorphism: `
Use a stunning glassmorphism design:
- Dark background: #050510 or deep navy/dark purple gradient
- Glass cards: rgba(255,255,255,0.05–0.12) with backdrop-filter: blur(20px)
- Borders: 1px solid rgba(255,255,255,0.1)
- Glowing accents: box-shadow with colored glows
- Gradient text headings using background-clip: text
- Purple/indigo/violet accent colors (#7c3aed, #8b5cf6, #a78bfa)`,

  'modern-dark': `
Use a sleek modern dark design:
- Background: #0a0a0f or #111827
- Cards: #1f2937 or #16213e with subtle borders
- Accent: cyan #06b6d4 or electric blue #3b82f6
- Clean typography, generous whitespace
- Subtle gradients and smooth hover effects`,

  'minimal-light': `
Use a clean minimal light design:
- Background: #ffffff or #f9fafb
- Cards: white with subtle shadows
- Accent: #6366f1 or #8b5cf6
- Lots of whitespace, crisp typography
- Subtle borders: #e5e7eb
- Professional and clean`,

  cyberpunk: `
Use a bold cyberpunk/neon design:
- Background: #0a0010 very dark purple/black
- Neon accents: #00ffff cyan, #ff00ff magenta, #00ff88 green
- Glitch effects on headings (CSS animation)
- Grid/scanline overlays via CSS
- Neon glow box-shadows: 0 0 20px #00ffff
- Bold tech aesthetic`,

  pastel: `
Use a soft pastel/kawaii design:
- Background: #fdf4ff or #f0f9ff light lavender/sky
- Soft cards: white with pastel borders
- Accent palette: #c084fc, #f472b6, #67e8f9
- Rounded corners everywhere (border-radius: 20px+)
- Playful, friendly typography
- Gradient blobs and soft shadows`,

  corporate: `
Use a professional corporate design:
- Background: #ffffff or #f8fafc
- Navy/dark blue: #1e3a5f or #0f172a for headers
- Accent: #2563eb or #0ea5e9
- Clean grid layouts, data tables
- Sans-serif typography, structured hierarchy
- Trust-inspiring, professional aesthetic`,
};

/** Map site type to generation hints */
const TYPE_HINTS = {
  landing: 'a marketing landing page with hero section, features, testimonials, pricing, and CTA',
  dashboard: 'an admin dashboard with sidebar navigation, stats cards, charts (CSS-only), data tables, and activity feed',
  portfolio: 'a developer/designer portfolio with hero intro, skills, project showcase grid, and contact form',
  ecommerce: 'an e-commerce product page with hero banner, product grid cards, cart sidebar, and checkout CTA',
  blog: 'a modern blog layout with featured hero post, article grid, categories sidebar, and newsletter signup',
  component: 'a reusable UI component library showcase with interactive demo cards and code snippets',
};

// ─────────────────────────────────────────────────────────────
// POST /api/website/generate
// Full website/layout generation — returns structured JSON
// ─────────────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  const {
    prompt = '',
    style = 'glassmorphism',
    type = 'landing',
    accentColor = '#7c3aed',
    features = {},
  } = req.body;

  if (!prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const styleInstructions = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.glassmorphism;
  const typeHint = TYPE_HINTS[type] || TYPE_HINTS.landing;

  const featureList = [
    features.responsive !== false && 'fully responsive (mobile-first)',
    features.animations !== false && 'smooth CSS animations and transitions',
    features.darkMode && 'dark mode toggle (JS)',
    features.navigation !== false && 'sticky navigation bar with smooth scroll links',
  ].filter(Boolean).join(', ');

  const systemPrompt = `You are an elite frontend developer and UI/UX designer. You create stunning, production-quality websites with beautiful designs.

Your code must be:
- Complete and functional with no placeholders
- Visually impressive and modern
- Using semantic HTML5
- All CSS must be internal (in <style> tags) — no external stylesheets except Google Fonts CDN
- All JavaScript must be internal (in <script> tags) — no external JS except what is explicitly requested
- Use Google Fonts via @import in CSS for typography
- Absolutely NO external framework CDNs (no Tailwind, no Bootstrap) — write all CSS from scratch
- Create rich, detailed layouts with real content (use realistic placeholder text, not "Lorem ipsum" for headings)`;

  const userPrompt = `Create ${typeHint} for the following brief:

"${prompt}"

STYLE REQUIREMENTS:
${styleInstructions}

ACCENT COLOR: ${accentColor}

FEATURES TO INCLUDE: ${featureList || 'responsive, animations, navigation'}

CRITICAL OUTPUT FORMAT — respond ONLY with this exact JSON structure (no markdown fences, no explanations):
{
  "title": "Website title",
  "description": "One sentence description of what was built",
  "html": "COMPLETE HTML document — include <!DOCTYPE html>, <html>, <head> with Google Fonts, <style> with ALL CSS, <body> with ALL content, and <script> with ALL JavaScript. This single string must be a complete, working webpage.",
  "css": "All CSS extracted separately (same as what's in the <style> tag)",
  "js": "All JavaScript extracted separately (same as what's in the <script> tag)",
  "components": ["list", "of", "section/component", "names", "included"]
}

The "html" field must be a COMPLETE standalone HTML document that works when saved as index.html.
Make it visually stunning — use gradients, shadows, animations, real content. At least 6 distinct sections.`;

  try {
    const raw = await aiGenerate(systemPrompt, userPrompt, 0.7);
    const result = parseJSON(raw, null);

    if (!result || !result.html) {
      // Fallback: try to extract HTML even if JSON parse failed
      const htmlMatch = raw.match(/"html"\s*:\s*"([\s\S]*?)(?:",\s*"css"|",\s*"js"|"\s*})/);
      if (htmlMatch) {
        return res.json({
          title: 'Generated Website',
          description: prompt,
          html: htmlMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
          css: '',
          js: '',
          components: [],
        });
      }
      return res.status(500).json({ error: 'Generation failed — Gemini returned invalid JSON. Please try a different prompt.' });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: sanitizeError(err, 'website/generate') });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/website/refine
// Streaming AI chat for iterative refinement
// ─────────────────────────────────────────────────────────────
router.post('/refine', async (req, res) => {
  try {
    const { messages = [], currentCode = '', siteTitle = '' } = req.body;

    if (!messages.length) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const systemPrompt = `You are an expert frontend developer helping to refine and improve a generated website.

Current website: "${siteTitle}"

Current HTML code context (first 8000 chars):
\`\`\`html
${currentCode.slice(0, 8000)}
\`\`\`

When the user asks for changes:
1. Explain what you'll change briefly
2. If providing code changes, wrap the full updated section in a markdown code block with the appropriate language tag
3. Be specific and actionable
4. If asked to add a section, provide the complete HTML/CSS for it
5. Keep the same design style and aesthetic as the existing code`;

    await aiStream(systemPrompt, messages, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: sanitizeError(err, 'website/refine') });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/website/component
// Generate a single UI component
// ─────────────────────────────────────────────────────────────
router.post('/component', async (req, res) => {
  const { prompt = '', style = 'glassmorphism', accentColor = '#7c3aed' } = req.body;

  if (!prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const styleInstructions = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.glassmorphism;

  const systemPrompt = `You are an expert frontend developer. Create isolated, reusable UI components.`;

  const userPrompt = `Create a standalone UI component: "${prompt}"

STYLE:
${styleInstructions}
ACCENT COLOR: ${accentColor}

Return ONLY valid JSON:
{
  "title": "Component name",
  "html": "COMPLETE HTML document with the component, internal <style> and <script>",
  "css": "Component CSS only",
  "js": "Component JS only",
  "components": ["component name"]
}`;

  try {
    const raw = await aiGenerate(systemPrompt, userPrompt, 0.7);
    const result = parseJSON(raw, null);
    if (!result?.html) {
      return res.status(500).json({ error: 'Component generation failed' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: sanitizeError(err, 'website/component') });
  }
});

export default router;

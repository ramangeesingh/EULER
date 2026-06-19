import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../shared/UserAvatar';

// ─── Language colour map ────────────────────────────────────────────────────
const LANG_COLORS = {
  javascript: '#f7df1e', js: '#f7df1e',
  typescript: '#3178c6', ts: '#3178c6',
  python: '#3776ab', py: '#3776ab',
  rust: '#ce422b',
  go: '#00add8',
  java: '#ed8b00',
  cpp: '#659ad2', 'c++': '#659ad2', c: '#659ad2',
  html: '#e34f26',
  css: '#1572b6',
  scss: '#cc6699',
  json: '#89d96e',
  bash: '#4eaa25', sh: '#4eaa25', shell: '#4eaa25',
  sql: '#336791',
  graphql: '#e535ab',
  yaml: '#cb171e', yml: '#cb171e',
  markdown: '#083fa1', md: '#083fa1',
  jsx: '#61dafb', tsx: '#3178c6',
  prisma: '#2d3748',
};

// ─── Minimal token-based syntax highlighter ─────────────────────────────────
// Highlights keywords, strings, comments, and numbers with CSS color spans.
function syntaxHighlight(code, lang) {
  const l = (lang || '').toLowerCase();

  // Escape HTML first
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // JS / TS / JSX / TSX
  if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(l)) {
    return escaped
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
      .replace(/(`[^`]*`)/g, '<span style="color:#86efac">$1</span>')
      .replace(/("[^"]*"|'[^']*')/g, '<span style="color:#fca5a5">$1</span>')
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|typeof|instanceof|null|undefined|true|false|this|super|extends|of|in|do|switch|case|break|continue|void|delete|yield|static|get|set|public|private|protected|interface|type|enum|namespace|declare|abstract|readonly|override)\b/g,
        '<span style="color:#93C5FD">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#fb923c">$1</span>');
  }

  // Python
  if (['python', 'py'].includes(l)) {
    return escaped
      .replace(/(#[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
      .replace(/("[^"]*"|'[^']*'|"""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\')/g, '<span style="color:#fca5a5">$1</span>')
      .replace(/\b(def|class|return|if|elif|else|for|while|import|from|as|with|try|except|finally|raise|pass|break|continue|lambda|yield|async|await|None|True|False|and|or|not|in|is|global|nonlocal)\b/g,
        '<span style="color:#93C5FD">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#fb923c">$1</span>');
  }

  // CSS / SCSS
  if (['css', 'scss'].includes(l)) {
    return escaped
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
      .replace(/("[^"]*"|'[^']*')/g, '<span style="color:#fca5a5">$1</span>')
      .replace(/(#[0-9a-fA-F]{3,8})/g, '<span style="color:#fb923c">$1</span>')
      .replace(/\b(px|em|rem|vw|vh|%|auto|none|flex|grid|block|inline|absolute|relative|fixed|sticky)\b/g,
        '<span style="color:#67e8f9">$1</span>')
      .replace(/(@[a-zA-Z-]+)/g, '<span style="color:#93C5FD">$1</span>');
  }

  // HTML
  if (l === 'html') {
    return escaped
      .replace(/(&lt;\/?[a-zA-Z][^&]*?&gt;)/g, '<span style="color:#f97316">$1</span>')
      .replace(/("[^"]*")/g, '<span style="color:#fca5a5">$1</span>')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:#6b7280;font-style:italic">$1</span>');
  }

  // JSON
  if (l === 'json') {
    return escaped
      .replace(/("[^"]*")(\s*:)/g, '<span style="color:#93c5fd">$1</span>$2')
      .replace(/:\s*("[^"]*")/g, ': <span style="color:#fca5a5">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#93C5FD">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#fb923c">$1</span>');
  }

  // Bash / Shell
  if (['bash', 'sh', 'shell'].includes(l)) {
    return escaped
      .replace(/(#[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
      .replace(/("[^"]*"|'[^']*')/g, '<span style="color:#fca5a5">$1</span>')
      .replace(/\b(echo|export|source|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|curl|npm|npx|git|node|python|pip|chmod|sudo|apt|brew)\b/g,
        '<span style="color:#67e8f9">$1</span>')
      .replace(/(\$[A-Z_a-z][A-Z_a-z0-9]*)/g, '<span style="color:#86efac">$1</span>');
  }

  // SQL
  if (l === 'sql') {
    return escaped
      .replace(/(--[^\n]*)/g, '<span style="color:#6b7280;font-style:italic">$1</span>')
      .replace(/("[^"]*"|'[^']*')/g, '<span style="color:#fca5a5">$1</span>')
      .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|GROUP|BY|ORDER|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|NOT|NULL|AND|OR|IN|LIKE|BETWEEN|LIMIT|OFFSET|DISTINCT|COUNT|SUM|AVG|MAX|MIN)\b/gi,
        '<span style="color:#93C5FD">$1</span>');
  }

  return escaped;
}

// ─── Code block ─────────────────────────────────────────────────────────────
function CodeBlock({ code, lang }) {
  const [copied, setCopied]     = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const highlighted = syntaxHighlight(code, lang);
  const langColor   = LANG_COLORS[(lang || '').toLowerCase()] || '#9ca3af';
  const lineCount   = code.split('\n').length;

  return (
    <div
      className="my-3 rounded-xl overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)' }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {collapsed
              ? <ChevronRight className="w-3.5 h-3.5" />
              : <ChevronDown className="w-3.5 h-3.5" />
            }
          </button>
          {lang && (
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{ color: langColor, background: `${langColor}18` }}
            >
              {lang}
            </span>
          )}
          <span className="text-[11px] text-gray-600">{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
        </div>
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 rounded-lg transition-all"
          style={{
            background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
            color: copied ? '#4ade80' : 'rgba(156,163,175,0.7)',
            border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
          }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </motion.button>
      </div>

      {/* Code content */}
      {!collapsed && (
        <div className="overflow-x-auto sidebar-scroll">
          <pre
            className="px-4 py-3.5 text-[12.5px] leading-[1.65]"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Markdown renderer ───────────────────────────────────────────────────────
function MarkdownContent({ content }) {
  // Split by fenced code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-0.5">
      {parts.map((part, i) => {
        // Code block
        if (part.startsWith('```')) {
          const lines = part.split('\n');
          const lang  = lines[0].slice(3).trim();
          const code  = lines.slice(1, -1).join('\n');
          return <CodeBlock key={i} code={code} lang={lang} />;
        }

        // Regular text — parse inline markdown
        const lines = part.split('\n');
        return (
          <div key={i}>
            {lines.map((line, j) => {
              // h3, h2, h1
              if (line.startsWith('### ')) return <h3 key={j} className="text-[14px] font-bold text-white mt-4 mb-1.5">{renderInline(line.slice(4))}</h3>;
              if (line.startsWith('## '))  return <h2 key={j} className="text-[15px] font-bold text-white mt-5 mb-2">{renderInline(line.slice(3))}</h2>;
              if (line.startsWith('# '))   return <h1 key={j} className="text-[16px] font-bold text-white mt-5 mb-2">{renderInline(line.slice(2))}</h1>;
              // Numbered list
              if (/^\d+\.\s/.test(line)) {
                const num = line.match(/^(\d+)\./)[1];
                return (
                  <div key={j} className="flex gap-2 my-0.5">
                    <span className="text-[13px] text-blue-400 font-medium shrink-0 mt-[1px]">{num}.</span>
                    <span className="text-[13.5px] text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.replace(/^\d+\.\s/, '')) }} />
                  </div>
                );
              }
              // Bullet
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <div key={j} className="flex gap-2 my-0.5">
                    <span className="text-blue-500 mt-[6px] shrink-0" style={{ fontSize: '8px' }}>●</span>
                    <span className="text-[13.5px] text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2)) }} />
                  </div>
                );
              }
              // Horizontal rule
              if (line.trim() === '---' || line.trim() === '───') {
                return <div key={j} className="my-3 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />;
              }
              // Empty line
              if (line.trim() === '') return <div key={j} className="h-2" />;
              // Normal paragraph
              return (
                <p key={j} className="text-[13.5px] text-gray-300 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Inline markdown: bold, italic, inline code, links
function inlineMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#f3f4f6;font-weight:600">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em style="color:#d1d5db">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(37, 99, 235,0.15);color:#93C5FD;padding:1px 6px;border-radius:5px;font-family:monospace;font-size:12px;border:1px solid rgba(37, 99, 235,0.2)">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#93c5fd;text-decoration:underline" target="_blank" rel="noopener">$1</a>');
}

function renderInline(text) {
  return <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(text) }} />;
}

// ─── Mode badge ─────────────────────────────────────────────────────────────
const MODE_META = {
  explain: { label: 'Explain', color: '#67e8f9' },
  debug:   { label: 'Debug',   color: '#fca5a5' },
  fix:     { label: 'Fix',     color: '#86efac' },
  improve: { label: 'Improve', color: '#fcd34d' },
  general: null,
};

// ─── Message bubble ──────────────────────────────────────────────────────────
const DevMessageBubble = memo(function DevMessageBubble({ message }) {
  const isUser    = message.role === 'user';
  const modeMeta  = isUser ? MODE_META[message.mode] : null;
  const { user }  = useAuth();

  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      {isUser ? (
        <UserAvatar user={user} size={28} style={{ alignSelf: 'flex-start', marginTop: '2px' }} />
      ) : (
        <div
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 text-[11px] font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235,0.2), rgba(59, 130, 246,0.12))',
            border: '1px solid rgba(37, 99, 235,0.3)',
          }}
        >
          <Bot className="w-3.5 h-3.5 text-blue-400" />
        </div>
      )}

      {/* Bubble */}
      <div
        className="max-w-[84%] px-4 py-3 rounded-2xl"
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, rgba(37, 99, 235,0.2), rgba(59, 130, 246,0.15))',
                border: '1px solid rgba(37, 99, 235,0.28)',
                borderTopRightRadius: '6px',
              }
            : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderTopLeftRadius: '6px',
                width: '100%',
              }
        }
      >
        {/* Mode badge (user messages only) */}
        {modeMeta && (
          <div className="mb-2">
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${modeMeta.color}18`, color: modeMeta.color, border: `1px solid ${modeMeta.color}35` }}
            >
              {modeMeta.label} Mode
            </span>
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <p className="text-[13.5px] text-gray-100 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <MarkdownContent content={message.content} />
            {/* Streaming cursor */}
            {message.isStreaming && (
              <span
                className="inline-block w-0.5 h-4 ml-0.5 rounded-full align-middle"
                style={{ background: '#60A5FA', animation: 'pulse 1s ease-in-out infinite' }}
              />
            )}
          </>
        )}

        {/* Error state */}
        {message.isError && (
          <div
            className="mt-2 px-3 py-2 rounded-lg text-[12px] text-red-300"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            Something went wrong. Please try again.
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default DevMessageBubble;

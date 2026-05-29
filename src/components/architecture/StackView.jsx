import { motion } from 'framer-motion';
import { Server, Database, Globe, Wrench, Package } from 'lucide-react';

const CATEGORY_ICONS = {
  Framework: Globe,
  Runtime: Server,
  'Primary DB': Database,
  Cache: Database,
  Compute: Server,
  'CI/CD': Wrench,
  default: Package,
};

const CATEGORY_COLORS = {
  Framework:   { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)',  text: '#c4b5fd' },
  Runtime:     { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)',  text: '#93c5fd' },
  'Primary DB':{ bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',  text: '#6ee7b7' },
  Cache:       { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',  text: '#fcd34d' },
  Compute:     { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   text: '#fca5a5' },
  'CI/CD':     { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)',  text: '#a5b4fc' },
  default:     { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#d1d5db' },
};

function TechBadge({ item, index }) {
  const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default;
  const Icon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="relative group rounded-xl p-3 transition-all duration-200 cursor-default"
      style={{ background: color.bg, border: `1px solid ${color.border}` }}
      title={item.reason}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: color.text }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-semibold text-white">{item.name}</span>
            {item.version && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.4)' }}>
                v{item.version}
              </span>
            )}
          </div>
          <div className="text-[10.5px] mt-0.5" style={{ color: color.text, opacity: 0.7 }}>{item.category}</div>
        </div>
      </div>
      {/* Tooltip on hover */}
      <div
        className="absolute bottom-full left-0 mb-2 px-3 py-2 rounded-lg text-[11px] text-gray-200 leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 w-64"
        style={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        {item.reason}
      </div>
    </motion.div>
  );
}

function StackSection({ title, items = [], icon: Icon, color }) {
  if (!items.length) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color }}>{title}</h3>
        <div className="flex-1 h-px ml-2" style={{ background: `${color}22` }} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, i) => <TechBadge key={i} item={item} index={i} />)}
      </div>
    </div>
  );
}

export default function StackView({ stack = {} }) {
  return (
    <div className="h-full overflow-y-auto sidebar-scroll p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-white mb-1">Recommended Tech Stack</h2>
        <p className="text-gray-500 text-sm mb-6">Curated technologies optimized for your requirements. Hover for rationale.</p>

        <StackSection title="Frontend"       items={stack.frontend}       icon={Globe}    color="#c4b5fd" />
        <StackSection title="Backend"        items={stack.backend}        icon={Server}   color="#93c5fd" />
        <StackSection title="Database"       items={stack.database}       icon={Database} color="#6ee7b7" />
        <StackSection title="Infrastructure" items={stack.infrastructure} icon={Server}   color="#fca5a5" />
        <StackSection title="Dev Tools"      items={stack.devtools}       icon={Wrench}   color="#fcd34d" />
      </div>
    </div>
  );
}

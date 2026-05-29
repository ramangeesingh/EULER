import { motion } from 'framer-motion';
import { Clock, Users, Zap, Star, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

function MetricCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      className="p-4 rounded-2xl flex items-center gap-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}33` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-0.5">{label}</div>
        <div className="text-[14px] font-semibold text-white">{value}</div>
      </div>
    </motion.div>
  );
}

const COMPLEXITY_MAP = {
  Low:        { color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  Medium:     { color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  High:       { color: '#fca5a5', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
  'Very High':{ color: '#f87171', bg: 'rgba(239,68,68,0.18)',  border: 'rgba(239,68,68,0.4)'  },
};

export default function OverviewPanel({ architecture = {} }) {
  const { overview = {}, microservices = {} } = architecture;
  const {
    appName, tagline, summary, complexity, estimatedTimeline,
    teamSize, keyDecisions = [],
  } = overview;

  const cx = COMPLEXITY_MAP[complexity] || COMPLEXITY_MAP.Medium;

  return (
    <div className="h-full overflow-y-auto sidebar-scroll p-6">
      <div className="max-w-3xl mx-auto">
        {/* App hero */}
        <motion.div
          className="mb-6 p-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.08) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Glow orb */}
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)' }}
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{appName || 'Architecture'}</h2>
                {tagline && <p className="text-purple-300/70 text-[14px]">{tagline}</p>}
              </div>
              {complexity && (
                <span
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-xl shrink-0"
                  style={{ background: cx.bg, color: cx.color, border: `1px solid ${cx.border}` }}
                >
                  {complexity} complexity
                </span>
              )}
            </div>
            {summary && (
              <p className="text-gray-300 text-[13px] leading-relaxed">{summary}</p>
            )}
          </div>
        </motion.div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {estimatedTimeline && (
            <MetricCard icon={Clock}  label="Timeline" value={estimatedTimeline} color="#c4b5fd" delay={0.1} />
          )}
          {teamSize && (
            <MetricCard icon={Users}  label="Team Size" value={teamSize}         color="#93c5fd" delay={0.15} />
          )}
          <MetricCard icon={Layers} label="Style"     value={architecture.microservices?.applicable ? 'Microservices' : 'Monolith'} color="#6ee7b7" delay={0.2} />
        </div>

        {/* Key architectural decisions */}
        {keyDecisions.length > 0 && (
          <motion.div
            className="mb-5 p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-400/70" />
              <h3 className="text-[13px] font-semibold text-white">Key Architectural Decisions</h3>
            </div>
            <div className="space-y-2.5">
              {keyDecisions.map((d, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-2.5"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                >
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0text-green-400" style={{ color: '#4ade80' }} />
                  <span className="text-[13px] text-gray-300 leading-relaxed">{d}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Microservices overview */}
        {microservices?.applicable && microservices?.services?.length > 0 && (
          <motion.div
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-blue-400" />
              <h3 className="text-[13px] font-semibold text-white">Microservices Overview</h3>
              {microservices.communication && (
                <span className="text-[11px] text-gray-600 ml-auto">{microservices.communication}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {microservices.services.map((svc, i) => (
                <motion.div
                  key={i}
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-blue-300 font-mono">{svc.name}</span>
                    {svc.port && (
                      <span className="text-[10px] text-gray-600">:{svc.port}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">{svc.responsibility}</p>
                  {svc.tech && (
                    <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>{svc.tech}</span>
                  )}
                </motion.div>
              ))}
            </div>
            {microservices.apiGateway && (
              <div className="mt-3 flex items-center gap-2 text-[12px] text-gray-500">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400/50" />
                API Gateway: {microservices.apiGateway}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { Rocket, GitBranch, Monitor, AlertTriangle, TrendingUp, Zap, DollarSign } from 'lucide-react';

function CheckItem({ text, index }) {
  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
      />
      <span className="text-[13px] text-gray-300 leading-relaxed">{text}</span>
    </motion.div>
  );
}

function SolutionCard({ item, index }) {
  return (
    <motion.div
      className="p-4 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70" />
            <span className="text-[12px] font-semibold text-amber-300/80">{item.problem}</span>
          </div>
          <p className="text-[13px] text-gray-300">{item.solution}</p>
        </div>
        {item.when && (
          <span
            className="text-[10px] px-2 py-1 rounded-lg shrink-0 whitespace-nowrap"
            style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            {item.when}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function EnvBadge({ env, index }) {
  const styles = {
    development: { bg: 'rgba(59,130,246,0.12)', text: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
    staging:     { bg: 'rgba(245,158,11,0.12)', text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
    production:  { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  };
  const c = styles[env] || styles.development;
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="w-2 h-2 rounded-full" style={{ background: c.text }} />
      <span className="text-[12px] font-medium capitalize" style={{ color: c.text }}>{env}</span>
    </motion.div>
  );
}

function PipelineStage({ stage, index }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium font-mono"
        style={{
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.2)',
          color: '#c4b5fd',
        }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        {stage}
      </motion.div>
      {true && <span className="text-gray-700 text-xs">→</span>}
    </div>
  );
}

export default function DeploymentView({ deployment = {}, scalability = {} }) {
  const { environments = [], containerization, orchestration, cicd = {}, cdn, monitoring = [], infrastructure, estimated_monthly_cost } = deployment;
  const { solutions = [], caching = {}, bottlenecks = [], horizontalScaling, futureConsiderations = [] } = scalability;

  return (
    <div className="h-full overflow-y-auto sidebar-scroll p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white">Deployment & Scalability</h2>
          <p className="text-gray-500 text-sm mt-0.5">Infrastructure, CI/CD pipeline, and scaling strategy.</p>
        </div>

        {/* Environments */}
        {environments.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-blue-400" />
              <h3 className="text-[13px] font-semibold text-white">Environments</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {environments.map((env, i) => <EnvBadge key={env} env={env} index={i} />)}
            </div>
          </div>
        )}

        {/* CI/CD Pipeline */}
        {cicd.pipeline && (
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <h3 className="text-[13px] font-semibold text-white">CI/CD Pipeline</h3>
              <span className="text-[11px] text-gray-500 ml-auto">{cicd.pipeline}</span>
            </div>
            {cicd.stages?.length > 0 && (
              <div className="flex items-center flex-wrap gap-1 mb-3">
                {cicd.stages.map((s, i) => <PipelineStage key={s} stage={s} index={i} />)}
              </div>
            )}
            {cicd.strategy && (
              <p className="text-[12px] text-indigo-300/60 mt-1">{cicd.strategy}</p>
            )}
          </div>
        )}

        {/* Infrastructure */}
        <div className="grid grid-cols-2 gap-3">
          {containerization && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">Containers</div>
              <div className="text-[13px] text-gray-300">{containerization}</div>
            </div>
          )}
          {orchestration && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">Orchestration</div>
              <div className="text-[13px] text-gray-300">{orchestration}</div>
            </div>
          )}
          {cdn && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">CDN</div>
              <div className="text-[13px] text-gray-300">{cdn}</div>
            </div>
          )}
          {infrastructure && (
            <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">IaC</div>
              <div className="text-[13px] text-gray-300">{infrastructure}</div>
            </div>
          )}
        </div>

        {/* Monitoring */}
        {monitoring.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-4 h-4 text-green-400" />
              <h3 className="text-[13px] font-semibold text-white">Monitoring & Observability</h3>
            </div>
            <div className="space-y-2">
              {monitoring.map((m, i) => <CheckItem key={i} text={m} index={i} />)}
            </div>
          </div>
        )}

        {/* Cost estimate */}
        {estimated_monthly_cost && (
          <div className="p-5 rounded-2xl flex items-center gap-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <DollarSign className="w-8 h-8 text-emerald-400/60 shrink-0" />
            <div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Estimated Monthly Cost</div>
              <div className="text-[18px] font-bold text-emerald-300">{estimated_monthly_cost}</div>
            </div>
          </div>
        )}

        {/* Scalability bottlenecks & solutions */}
        {solutions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-[13px] font-semibold text-white">Scaling Solutions</h3>
            </div>
            <div className="space-y-2">
              {solutions.map((s, i) => <SolutionCard key={i} item={s} index={i} />)}
            </div>
          </div>
        )}

        {/* Caching */}
        {caching.layers?.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-purple-400" />
              <h3 className="text-[13px] font-semibold text-white">Caching Strategy</h3>
            </div>
            <div className="space-y-2 mb-3">
              {caching.layers.map((l, i) => <CheckItem key={i} text={l} index={i} />)}
            </div>
            {caching.strategy && (
              <p className="text-[12px] text-gray-500 border-t pt-2 mt-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>{caching.strategy}</p>
            )}
          </div>
        )}

        {/* Future considerations */}
        {futureConsiderations.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-4 h-4 text-blue-400" />
              <h3 className="text-[13px] font-semibold text-white">Future Considerations</h3>
            </div>
            <div className="space-y-2">
              {futureConsiderations.map((f, i) => <CheckItem key={i} text={f} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

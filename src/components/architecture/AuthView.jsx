import { motion } from 'framer-motion';
import { Shield, Lock, Users, CheckCircle, ArrowRight } from 'lucide-react';

function FlowStep({ step, index, total }) {
  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
    >
      {/* Step number + connector */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(79,70,229,0.4))',
            border: '1px solid rgba(124,58,237,0.5)',
            color: '#c4b5fd',
          }}
        >
          {index + 1}
        </div>
        {index < total - 1 && (
          <div className="w-px flex-1 my-1" style={{ background: 'rgba(124,58,237,0.2)', minHeight: '20px' }} />
        )}
      </div>
      <div className="pb-4 min-w-0">
        <p className="text-[13px] text-gray-300 leading-relaxed">{step}</p>
      </div>
    </motion.div>
  );
}

function SecurityItem({ item, index }) {
  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#6ee7b7' }} />
      <span className="text-[13px] text-gray-300 leading-relaxed">{item}</span>
    </motion.div>
  );
}

function RoleChip({ role }) {
  const colors = {
    admin:      { bg: 'rgba(239,68,68,0.1)',   text: '#fca5a5', border: 'rgba(239,68,68,0.25)' },
    user:       { bg: 'rgba(59,130,246,0.1)',  text: '#93c5fd', border: 'rgba(59,130,246,0.25)' },
    moderator:  { bg: 'rgba(245,158,11,0.1)',  text: '#fcd34d', border: 'rgba(245,158,11,0.25)' },
  };
  const c = colors[role?.toLowerCase()] || { bg: 'rgba(255,255,255,0.06)', text: '#d1d5db', border: 'rgba(255,255,255,0.1)' };
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {role}
    </span>
  );
}

export default function AuthView({ authentication = {}, security = {} }) {
  const {
    strategy, provider, flow = [], security: authSecurity = [], rbac = {},
  } = authentication;
  const { checklist = [] } = security;

  return (
    <div className="h-full overflow-y-auto sidebar-scroll p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-white">Authentication & Security</h2>
          <p className="text-gray-500 text-sm mt-0.5">Complete auth flow and security hardening strategy.</p>
        </div>

        {/* Strategy card */}
        <motion.div
          className="p-5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.06))',
            border: '1px solid rgba(124,58,237,0.25)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.25)' }}>
              <Lock className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-white">{strategy || 'JWT + Refresh Tokens'}</div>
              <div className="text-[12px] text-purple-300/60">via {provider || 'Custom'}</div>
            </div>
          </div>
        </motion.div>

        {/* Auth Flow */}
        {flow.length > 0 && (
          <div
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <h3 className="text-[13px] font-semibold text-white">Authentication Flow</h3>
            </div>
            <div>
              {flow.map((step, i) => (
                <FlowStep key={i} step={step} index={i} total={flow.length} />
              ))}
            </div>
          </div>
        )}

        {/* Auth security measures */}
        {authSecurity.length > 0 && (
          <div
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[13px] font-semibold text-white">Auth Security Measures</h3>
            </div>
            <div className="space-y-2.5">
              {authSecurity.map((item, i) => (
                <SecurityItem key={i} item={item} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* RBAC */}
        {(rbac.roles?.length > 0 || rbac.permissions) && (
          <div
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-yellow-400" />
              <h3 className="text-[13px] font-semibold text-white">Role-Based Access Control</h3>
            </div>
            {rbac.roles && (
              <div className="flex flex-wrap gap-2 mb-3">
                {rbac.roles.map((role) => <RoleChip key={role} role={role} />)}
              </div>
            )}
            {rbac.permissions && (
              <p className="text-[12px] text-gray-400">{rbac.permissions}</p>
            )}
          </div>
        )}

        {/* Security checklist */}
        {checklist.length > 0 && (
          <div
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="text-[13px] font-semibold text-white">Security Hardening Checklist</h3>
            </div>
            <div className="space-y-2.5">
              {checklist.map((item, i) => (
                <SecurityItem key={i} item={item} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, AlertTriangle, AlertCircle, CheckCircle,
  Package, TrendingUp, FileCode, Layers, Loader2,
} from 'lucide-react';

const SEVERITY_CONFIG = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   icon: ShieldAlert },
  medium: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', icon: AlertTriangle },
  low:    { color: '#eab308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.2)',  icon: AlertCircle },
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

function LoadingSection({ label }) {
  return (
    <div className="flex items-center gap-3 p-6 text-gray-500 text-sm">
      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
      <span>Loading {label}...</span>
    </div>
  );
}

export default function InsightsDashboard({ analysis, stats, files, repoName }) {
  const [bugs, setBugs] = useState(null);
  const [deps, setDeps] = useState(null);
  const [bugsLoading, setBugsLoading] = useState(false);
  const [depsLoading, setDepsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Load bugs on first show
  useEffect(() => {
    if (activeSection === 'bugs' && !bugs && !bugsLoading) {
      setBugsLoading(true);
      fetch('/api/repo/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      })
        .then((r) => r.json())
        .then((data) => { setBugs(data); setBugsLoading(false); })
        .catch(() => { setBugs({ bugs: [], summary: 'Failed to analyze', score: 0 }); setBugsLoading(false); });
    }
  }, [activeSection, bugs, bugsLoading, files]);

  // Load deps on first show
  useEffect(() => {
    if (activeSection === 'deps' && !deps && !depsLoading) {
      setDepsLoading(true);
      fetch('/api/repo/deps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      })
        .then((r) => r.json())
        .then((data) => { setDeps(data); setDepsLoading(false); })
        .catch(() => { setDeps({ dependencies: [], summary: 'Failed to analyze' }); setDepsLoading(false); });
    }
  }, [activeSection, deps, depsLoading, files]);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'bugs', label: 'Bugs & Quality' },
    { id: 'deps', label: 'Dependencies' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation */}
      <div
        className="flex gap-1 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              background: activeSection === s.id ? 'rgba(124,58,237,0.15)' : 'transparent',
              color: activeSection === s.id ? '#a78bfa' : 'rgba(156,163,175,0.8)',
              border: activeSection === s.id ? '1px solid rgba(124,58,237,0.25)' : '1px solid transparent',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll p-5">

        {/* ── OVERVIEW ── */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={FileCode} label="Total Files" value={stats?.totalFiles ?? '—'} color="#a855f7" />
              <StatCard icon={TrendingUp} label="Lines of Code" value={stats?.totalLines?.toLocaleString() ?? '—'} color="#3b82f6" />
              <StatCard icon={Layers} label="Frameworks" value={(analysis?.frameworks || []).length} color="#22c55e" />
              <StatCard icon={Package} label="Tech Stack" value={(analysis?.techStack || []).length} color="#f97316" />
            </div>

            {/* Project info */}
            {analysis && (
              <motion.div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Project Overview
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Summary</span>
                    <p className="text-sm text-gray-300 mt-1 leading-relaxed">{analysis.summary}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Type</span>
                      <p className="text-sm text-white mt-1">{analysis.projectType || '—'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Main Language</span>
                      <p className="text-sm text-white mt-1">{analysis.mainLanguage || '—'}</p>
                    </div>
                  </div>
                  {analysis.architecture && (
                    <div className="pt-1">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Architecture</span>
                      <p className="text-sm text-gray-300 mt-1">{analysis.architecture}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Languages breakdown */}
            {stats?.languages?.length > 0 && (
              <motion.div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-sm font-semibold text-white mb-4">Language Distribution</h3>
                <div className="space-y-2.5">
                  {stats.languages.map((lang, i) => {
                    const pct = Math.round((lang.count / stats.totalFiles) * 100);
                    const COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f97316', '#eab308', '#ec4899', '#6366f1', '#14b8a6'];
                    const color = COLORS[i % COLORS.length];
                    return (
                      <div key={lang.ext} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-10 text-right font-mono">.{lang.ext}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: i * 0.05, duration: 0.5 }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-16 text-right">{lang.count} files ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Key components */}
            {analysis?.keyComponents?.length > 0 && (
              <motion.div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-sm font-semibold text-white mb-4">Key Components</h3>
                <div className="space-y-3">
                  {analysis.keyComponents.map((comp, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: '#a855f7' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{comp.name}</span>
                          {comp.path && (
                            <span className="text-[10px] font-mono text-gray-600">{comp.path}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{comp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tech stack pills */}
            {(analysis?.frameworks?.length > 0 || analysis?.techStack?.length > 0) && (
              <motion.div
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <h3 className="text-sm font-semibold text-white mb-4">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {[...(analysis?.frameworks || []), ...(analysis?.techStack || [])].map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        color: '#c4b5fd',
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── BUGS ── */}
        {activeSection === 'bugs' && (
          <div className="space-y-4">
            {bugsLoading && <LoadingSection label="bugs and quality issues" />}
            {bugs && !bugsLoading && (
              <>
                {/* Score */}
                <div
                  className="rounded-2xl p-5 flex items-center gap-5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: bugs.score >= 80 ? 'rgba(34,197,94,0.1)' : bugs.score >= 60 ? 'rgba(249,115,22,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${bugs.score >= 80 ? 'rgba(34,197,94,0.2)' : bugs.score >= 60 ? 'rgba(249,115,22,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: bugs.score >= 80 ? '#22c55e' : bugs.score >= 60 ? '#f97316' : '#ef4444' }}
                    >
                      {bugs.score}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Code Health Score</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{bugs.summary}</p>
                  </div>
                </div>

                {bugs.bugs?.length === 0 && (
                  <div className="flex items-center gap-2 p-4 rounded-xl text-green-400 text-sm"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <CheckCircle className="w-4 h-4" />
                    No significant issues found
                  </div>
                )}

                {bugs.bugs?.map((bug, i) => {
                  const cfg = SEVERITY_CONFIG[bug.severity] || SEVERITY_CONFIG.low;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={i}
                      className="rounded-xl p-4"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                              style={{ background: `${cfg.color}25`, color: cfg.color }}
                            >
                              {bug.severity}
                            </span>
                            <span className="text-[10px] text-gray-500">{bug.type}</span>
                            {bug.file && (
                              <span className="text-[10px] font-mono text-gray-600 truncate">{bug.file}{bug.line ? `:${bug.line}` : ''}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-200 mb-2">{bug.description}</p>
                          {bug.suggestion && (
                            <p className="text-xs text-gray-400 italic">💡 {bug.suggestion}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── DEPENDENCIES ── */}
        {activeSection === 'deps' && (
          <div className="space-y-4">
            {depsLoading && <LoadingSection label="dependencies" />}
            {deps && !depsLoading && (
              <>
                {/* Summary */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-sm text-gray-300 leading-relaxed">{deps.summary}</p>
                  <div className="flex gap-4 mt-4">
                    {deps.totalDeps != null && (
                      <div>
                        <p className="text-xs text-gray-500">Production</p>
                        <p className="text-lg font-bold text-white">{deps.totalDeps}</p>
                      </div>
                    )}
                    {deps.devDeps != null && (
                      <div>
                        <p className="text-xs text-gray-500">Dev</p>
                        <p className="text-lg font-bold text-white">{deps.devDeps}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security alerts */}
                {deps.security?.length > 0 && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <p className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Security Notes
                    </p>
                    <ul className="space-y-1">
                      {deps.security.map((s, i) => (
                        <li key={i} className="text-xs text-gray-400">• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Dependency list */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Package</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Version</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Type</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(deps.dependencies || []).map((dep, i) => {
                        const riskColors = { low: '#22c55e', medium: '#f97316', high: '#ef4444' };
                        const rc = riskColors[dep.risk] || '#9ca3af';
                        return (
                          <tr
                            key={i}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                          >
                            <td className="px-4 py-3 font-mono text-gray-200">{dep.name}</td>
                            <td className="px-4 py-3 text-gray-500">{dep.version || '—'}</td>
                            <td className="px-4 py-3 text-gray-500">{dep.type || '—'}</td>
                            <td className="px-4 py-3">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                                style={{ background: `${rc}15`, color: rc, border: `1px solid ${rc}30` }}
                              >
                                {dep.risk || 'low'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

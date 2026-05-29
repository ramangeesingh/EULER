import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Key, Hash, ArrowRight, ChevronDown, ChevronUp, Layers } from 'lucide-react';

const METHOD_COLORS = {
  GET:    { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7',  border: 'rgba(16,185,129,0.3)' },
  POST:   { bg: 'rgba(59,130,246,0.12)', text: '#93c5fd',  border: 'rgba(59,130,246,0.3)' },
  PUT:    { bg: 'rgba(245,158,11,0.12)', text: '#fcd34d',  border: 'rgba(245,158,11,0.3)' },
  PATCH:  { bg: 'rgba(124,58,237,0.12)', text: '#c4b5fd',  border: 'rgba(124,58,237,0.3)' },
  DELETE: { bg: 'rgba(239,68,68,0.12)',  text: '#fca5a5',  border: 'rgba(239,68,68,0.3)'  },
};

function MethodBadge({ method }) {
  const c = METHOD_COLORS[method] || METHOD_COLORS.GET;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-md font-mono shrink-0"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {method}
    </span>
  );
}

function EndpointRow({ ep, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-lg overflow-hidden transition-all"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <MethodBadge method={ep.method} />
        <span className="text-[13px] font-mono text-gray-300 flex-1 text-left">{ep.path}</span>
        {!ep.auth && (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)' }}>
            public
          </span>
        )}
        <span className="text-[12px] text-gray-500 hidden md:block truncate max-w-xs text-right">{ep.description}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="grid grid-cols-2 gap-3 text-[12px]">
            {ep.body && (
              <div>
                <span className="text-gray-600 block mb-1">Request Body</span>
                <code className="text-[11px] block px-2 py-1.5 rounded text-green-300/80 font-mono" style={{ background: 'rgba(0,0,0,0.3)' }}>{ep.body}</code>
              </div>
            )}
            {ep.response && (
              <div>
                <span className="text-gray-600 block mb-1">Response</span>
                <code className="text-[11px] block px-2 py-1.5 rounded text-blue-300/80 font-mono" style={{ background: 'rgba(0,0,0,0.3)' }}>{ep.response}</code>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SchemaTable({ schema, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl overflow-hidden mb-4"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <Database className="w-4 h-4 text-emerald-400/70" />
        <span className="text-[13px] font-semibold text-white font-mono">{schema.name}</span>
        <span className="text-[11px] text-gray-500 flex-1 text-left ml-1">{schema.description}</span>
        {schema.indexes?.length > 0 && (
          <span className="text-[10px] flex items-center gap-1 text-gray-600">
            <Hash className="w-3 h-3" />{schema.indexes.length} indexes
          </span>
        )}
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-600" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600" />}
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Field</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Type</th>
                <th className="text-left px-4 py-2 text-gray-600 font-medium">Constraints</th>
              </tr>
            </thead>
            <tbody>
              {(schema.fields || []).map((f, fi) => (
                <tr
                  key={fi}
                  className="border-b"
                  style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                >
                  <td className="px-4 py-2">
                    <span className="font-mono text-blue-300/80 flex items-center gap-1.5">
                      {f.constraints?.includes('PRIMARY') && <Key className="w-3 h-3 text-yellow-400/60" />}
                      {f.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-emerald-300/70 font-mono">{f.type}</td>
                  <td className="px-4 py-2 text-gray-500">{f.constraints}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {schema.indexes?.length > 0 && (
            <div className="px-4 py-2 flex gap-2 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[10px] text-gray-600">Indexes:</span>
              {schema.indexes.map((idx, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.15)' }}>
                  {idx}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function DatabaseView({ database = {}, api = {} }) {
  const [activeTab, setActiveTab] = useState('schema');

  return (
    <div className="h-full overflow-y-auto sidebar-scroll p-6">
      <div className="max-w-4xl mx-auto">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {[{ id: 'schema', label: 'DB Schema', icon: Database }, { id: 'api', label: 'API Routes', icon: ArrowRight }, { id: 'strategy', label: 'Strategy', icon: Layers }].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: activeTab === id ? 'rgba(124,58,237,0.2)' : 'transparent',
                color: activeTab === id ? '#c4b5fd' : 'rgba(156,163,175,0.7)',
                border: activeTab === id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              }}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Database Schema */}
        {activeTab === 'schema' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Database Design</h2>
                <p className="text-gray-500 text-sm">
                  {database.primary?.type} · Hosted on {database.primary?.hosting}
                  {database.cache?.type && ` · ${database.cache?.type} cache`}
                </p>
              </div>
            </div>
            {(database.schemas || []).map((s, i) => (
              <SchemaTable key={i} schema={s} index={i} />
            ))}
            {(!database.schemas || database.schemas.length === 0) && (
              <p className="text-gray-600 text-sm">No schema defined.</p>
            )}
          </div>
        )}

        {/* API Routes */}
        {activeTab === 'api' && (
          <div>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">API Structure</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{api.style}</span>
                {api.baseUrl && <><span>·</span><code className="font-mono text-purple-400/70">{api.baseUrl}</code></>}
                {api.versioning && <><span>·</span><span>{api.versioning}</span></>}
              </div>
              {api.rateLimit && (
                <div className="mt-2 text-[12px] px-3 py-1.5 rounded-lg w-fit" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fcd34d' }}>
                  Rate limit: {api.rateLimit}
                </div>
              )}
            </div>
            {(api.routes || []).map((group, gi) => (
              <div key={gi} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-purple-400/60">{group.group}</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(124,58,237,0.1)' }} />
                </div>
                <div className="space-y-1.5">
                  {(group.endpoints || []).map((ep, ei) => (
                    <EndpointRow key={ei} ep={ep} index={ei} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Strategy */}
        {activeTab === 'strategy' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Database Strategy</h2>
            {database.primary && (
              <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <h3 className="text-sm font-semibold text-emerald-300 mb-1">Primary Database</h3>
                <p className="text-gray-300 text-[13px]"><strong>{database.primary.type}</strong> — {database.primary.reason}</p>
                <p className="text-gray-500 text-[12px] mt-1">Hosted on: {database.primary.hosting}</p>
              </div>
            )}
            {database.cache && (
              <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <h3 className="text-sm font-semibold text-yellow-300 mb-1">Cache Layer</h3>
                <p className="text-gray-300 text-[13px]"><strong>{database.cache.type}</strong> — {database.cache.reason}</p>
                <p className="text-gray-500 text-[12px] mt-1">Hosted on: {database.cache.hosting}</p>
              </div>
            )}
            {database.migrations && (
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 className="text-sm font-semibold text-gray-300 mb-1">Migrations</h3>
                <p className="text-gray-400 text-[13px]">{database.migrations}</p>
              </div>
            )}
            {database.scalingStrategy && (
              <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <h3 className="text-sm font-semibold text-blue-300 mb-1">Scaling Strategy</h3>
                <p className="text-gray-300 text-[13px]">{database.scalingStrategy}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

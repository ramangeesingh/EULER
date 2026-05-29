import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BarChart2, FileCode, MessageSquare, Search,
  BookOpen, GraduationCap, Loader2, RefreshCw,
} from 'lucide-react';

import UploadZone from './UploadZone';
import FileTreePanel from './FileTreePanel';
import FileViewer from './FileViewer';
import InsightsDashboard from './InsightsDashboard';
import RepoChatPanel from './RepoChatPanel';
import SearchPanel from './SearchPanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'files',    label: 'Files',    icon: FileCode },
  { id: 'docs',     label: 'Docs',     icon: BookOpen },
  { id: 'onboard',  label: 'Onboard',  icon: GraduationCap },
  { id: 'search',   label: 'Search',   icon: Search },
  { id: 'chat',     label: 'Chat',     icon: MessageSquare },
];

function MarkdownRenderer({ content }) {
  // Very minimal markdown → HTML for display (no extra deps)
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className="prose-euler space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-white mt-5 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-white mt-6 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-white mt-6 mb-3">{line.slice(2)}</h1>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-[13px] text-gray-300 ml-4 list-disc">{line.slice(2)}</li>;
        if (line.startsWith('```')) return <div key={i} className="h-px bg-white/5 my-2" />;
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-[13px] text-gray-300 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

function LoadingTab({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      <p className="text-gray-400 text-sm">Generating {label}...</p>
    </div>
  );
}

export default function RepoIntelligencePage({ onClose }) {
  const [repoData, setRepoData] = useState(null); // { tree, files, analysis, stats, repoName }
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState(null);
  const [docs, setDocs] = useState(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [onboarding, setOnboarding] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // ── Upload & analyze ─────────────────────────────────────
  const handleUpload = useCallback(async (file) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/repo/analyze', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      setRepoData({
        tree: data.tree,
        files: data.files,
        analysis: data.analysis,
        stats: data.stats,
        repoName: data.repoName,
      });
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // ── Docs generation ──────────────────────────────────────
  const loadDocs = useCallback(async () => {
    if (docs || docsLoading || !repoData) return;
    setDocsLoading(true);
    try {
      const res = await fetch('/api/repo/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: repoData.analysis, files: repoData.files }),
      });
      const data = await res.json();
      setDocs(data.docs);
    } catch {
      setDocs('Failed to generate documentation.');
    } finally {
      setDocsLoading(false);
    }
  }, [docs, docsLoading, repoData]);

  // ── Onboarding ───────────────────────────────────────────
  const loadOnboarding = useCallback(async () => {
    if (onboarding || onboardingLoading || !repoData) return;
    setOnboardingLoading(true);
    try {
      const res = await fetch('/api/repo/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis: repoData.analysis,
          fileTree: repoData.tree,
          stats: repoData.stats,
        }),
      });
      const data = await res.json();
      setOnboarding(data.guide);
    } catch {
      setOnboarding('Failed to generate onboarding guide.');
    } finally {
      setOnboardingLoading(false);
    }
  }, [onboarding, onboardingLoading, repoData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'docs') loadDocs();
    if (tabId === 'onboard') loadOnboarding();
    if (tabId === 'files') setSelectedFile(null);
  };

  const handleSelectFile = (path) => {
    setSelectedFile(path);
    setActiveTab('files');
  };

  const repoSummary = repoData?.analysis?.summary;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(6,6,12,0.98)', backdropFilter: 'blur(30px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-5 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.4)' }}
      >
        <motion.button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.07] transition-colors text-gray-400 hover:text-white text-sm"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <div
          className="w-px h-5 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />

        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <FileCode className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Repo Intelligence</span>
          {repoData?.repoName && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-gray-400">{repoData.repoName}</span>
            </>
          )}
        </div>

        {repoData && (
          <>
            <div className="flex-1" />
            {/* Tab bar in header */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: activeTab === id ? 'rgba(124,58,237,0.25)' : 'transparent',
                    color: activeTab === id ? '#c4b5fd' : 'rgba(156,163,175,0.7)',
                    border: activeTab === id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setRepoData(null);
                setSelectedFile(null);
                setDocs(null);
                setOnboarding(null);
                setActiveTab('overview');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New
            </button>
          </>
        )}
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!repoData ? (
            <motion.div
              key="upload"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {analyzeError && (
                <div
                  className="mx-auto max-w-lg mt-8 px-5 py-3 rounded-xl text-sm text-red-300 flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  ⚠️ {analyzeError}
                </div>
              )}
              <UploadZone onUpload={handleUpload} isAnalyzing={isAnalyzing} />
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              className="h-full flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* File Tree (always visible) */}
              <div
                className="flex-shrink-0 overflow-hidden"
                style={{ width: '220px', background: 'rgba(0,0,0,0.25)' }}
              >
                <FileTreePanel
                  tree={repoData.tree}
                  repoName={repoData.repoName}
                  onSelectFile={handleSelectFile}
                  selectedFile={selectedFile}
                />
              </div>

              {/* Main panel */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      className="h-full overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <InsightsDashboard
                        analysis={repoData.analysis}
                        stats={repoData.stats}
                        files={repoData.files}
                        repoName={repoData.repoName}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'files' && (
                    <motion.div
                      key="files"
                      className="h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <FileViewer
                        filePath={selectedFile}
                        content={selectedFile ? repoData.files[selectedFile] : null}
                        repoSummary={repoSummary}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'docs' && (
                    <motion.div
                      key="docs"
                      className="h-full overflow-y-auto sidebar-scroll p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {docsLoading
                        ? <LoadingTab label="documentation" />
                        : docs
                          ? <MarkdownRenderer content={docs} />
                          : <p className="text-gray-500 text-sm">Documentation will appear here.</p>
                      }
                    </motion.div>
                  )}

                  {activeTab === 'onboard' && (
                    <motion.div
                      key="onboard"
                      className="h-full overflow-y-auto sidebar-scroll p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {onboardingLoading
                        ? <LoadingTab label="onboarding guide" />
                        : onboarding
                          ? <MarkdownRenderer content={onboarding} />
                          : <p className="text-gray-500 text-sm">Onboarding guide will appear here.</p>
                      }
                    </motion.div>
                  )}

                  {activeTab === 'search' && (
                    <motion.div
                      key="search"
                      className="h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <SearchPanel files={repoData.files} />
                    </motion.div>
                  )}

                  {activeTab === 'chat' && (
                    <motion.div
                      key="chat"
                      className="h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <RepoChatPanel files={repoData.files} analysis={repoData.analysis} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

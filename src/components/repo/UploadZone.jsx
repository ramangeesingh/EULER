import { motion, AnimatePresence } from 'framer-motion';
import { Upload, GitBranch, X, FolderOpen, Zap } from 'lucide-react';
import { useState, useRef } from 'react';

export default function UploadZone({ onUpload, isAnalyzing }) {
  const [isDragging, setIsDragging] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip')) onUpload(file);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-8">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #3b82f6 100%)',
            boxShadow: '0 0 60px rgba(124,58,237,0.4), 0 0 120px rgba(124,58,237,0.15)',
          }}
        >
          <FolderOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
          Repo{' '}
          <span style={{
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Intelligence
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Upload your codebase and let AI analyze, explain, and document it
        </p>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="repo-upload-zone relative cursor-pointer"
          style={{
            border: `2px dashed ${isDragging ? 'rgba(168,85,247,0.7)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '20px',
            padding: '60px 40px',
            background: isDragging
              ? 'rgba(124,58,237,0.08)'
              : 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.25s ease',
            textAlign: 'center',
          }}
        >
          {isDragging && (
            <motion.div
              className="absolute inset-0 rounded-[18px] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}

          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <motion.div
                    className="w-14 h-14 rounded-full border-2 border-purple-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ borderTopColor: '#a855f7' }}
                  />
                  <Zap
                    className="absolute inset-0 m-auto w-6 h-6 text-purple-400"
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">Analyzing repository...</p>
                  <p className="text-gray-400 text-sm mt-1">Parsing files and running AI analysis</p>
                </div>
                {/* Progress dots */}
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-purple-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                </motion.div>
                <p className="text-white text-xl font-semibold mb-2">
                  Drop your ZIP file here
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  or click to browse — supports GitHub repo ZIPs
                </p>
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Choose ZIP file
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleFile}
        />

        {/* GitHub URL */}
        <motion.div
          className="mt-6 flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex-1 relative">
            <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="GitHub URL — coming soon"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled
              className="w-full h-12 pl-10 pr-4 rounded-xl text-sm text-gray-500 cursor-not-allowed"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>
          <button
            disabled
            className="px-5 h-12 rounded-xl text-sm font-medium text-gray-600 cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Analyze
          </button>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            'AI File Explanation', 'Bug Detection', 'Dependency Analysis',
            'Auto Documentation', 'Onboarding Guide', 'Repo Chat', 'Full-Text Search'
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
                color: 'rgba(167,139,250,0.85)',
              }}
            >
              {f}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

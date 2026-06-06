import { motion, AnimatePresence } from 'framer-motion';
import { Upload, GitBranch, X, FolderOpen, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';

export default function UploadZone({ onUpload, isAnalyzing }) {
  const [isDragging, setIsDragging] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [cloneProgress, setCloneProgress] = useState('');
  const [urlError, setUrlError] = useState('');
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

  const validateUrl = async (url) => {
    if (!url.trim()) {
      setUrlError('');
      return false;
    }

    try {
      const response = await fetch('/api/git-clone/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setUrlError(data.error || 'Invalid repository URL');
        return false;
      }
      
      setUrlError('');
      return data;
    } catch (error) {
      setUrlError('Failed to validate repository');
      return false;
    }
  };

  const handleUrlChange = async (e) => {
    const url = e.target.value;
    setGithubUrl(url);
    
    if (url.trim()) {
      await validateUrl(url);
    } else {
      setUrlError('');
    }
  };

  const handleClone = async () => {
    if (!githubUrl.trim() || urlError || isCloning) return;
    
    console.log('🔵 [CLONE START] Initiating clone process');
    console.log('🔵 [CLONE START] URL:', githubUrl);
    
    setIsCloning(true);
    setCloneProgress('Validating Repository');
    setUrlError('');
    
    try {
      console.log('🟡 [VALIDATE] Starting validation');
      const validation = await validateUrl(githubUrl);
      console.log('🟡 [VALIDATE] Result:', validation);
      
      if (!validation) {
        console.log('🔴 [VALIDATE] Validation failed, stopping');
        setIsCloning(false);
        return;
      }
      
      setCloneProgress('Cloning Repository');
      console.log('🟢 [CLONE API] Calling /api/git-clone/clone');
      console.log('🟢 [CLONE API] Request body:', { url: githubUrl.trim() });
      
      const response = await fetch('/api/git-clone/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: githubUrl.trim() })
      });
      
      console.log('🟢 [CLONE API] Response received');
      console.log('🟢 [CLONE API] Status:', response.status);
      console.log('🟢 [CLONE API] OK:', response.ok);
      console.log('🟢 [CLONE API] Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log('🔴 [CLONE API] Response not OK');
        const error = await response.json();
        console.log('🔴 [CLONE API] Error body:', error);
        throw new Error(error.error || 'Failed to clone repository');
      }
      
      setCloneProgress('Analyzing Files');
      console.log('🟣 [PARSE] Parsing response JSON');
      
      const data = await response.json();
      console.log('🟣 [PARSE] Data received');
      console.log('🟣 [PARSE] Data keys:', Object.keys(data));
      console.log('🟣 [PARSE] repoName:', data.repoName);
      console.log('🟣 [PARSE] fullName:', data.fullName);
      console.log('🟣 [PARSE] fileCount:', data.fileCount);
      console.log('🟣 [PARSE] Has tree:', !!data.tree);
      console.log('🟣 [PARSE] Has files:', !!data.files);
      console.log('🟣 [PARSE] Has analysis:', !!data.analysis);
      console.log('🟣 [PARSE] Has stats:', !!data.stats);
      console.log('🟣 [PARSE] Has repoData:', !!data.repoData);
      
      setCloneProgress('Generating Insights');
      console.log('⏳ [DELAY] Waiting 1 second');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔵 [UPLOAD] About to call onUpload(null, data)');
      console.log('🔵 [UPLOAD] Current location:', window.location.href);
      console.log('🔵 [UPLOAD] Current pathname:', window.location.pathname);
      
      onUpload(null, data);
      
      console.log('✅ [UPLOAD] onUpload called successfully');
      console.log('✅ [UPLOAD] Location after onUpload:', window.location.href);
      console.log('✅ [UPLOAD] Pathname after onUpload:', window.location.pathname);
      
      setGithubUrl('');
      setCloneProgress('');
      
      console.log('✅ [COMPLETE] Clone process completed');
      console.log('✅ [COMPLETE] Final location:', window.location.href);
      
    } catch (error) {
      console.error('🔴 [ERROR] Clone process error:', error);
      console.error('🔴 [ERROR] Error message:', error.message);
      console.error('🔴 [ERROR] Error stack:', error.stack);
      console.error('🔴 [ERROR] Current location:', window.location.href);
      setUrlError(error.message);
      setCloneProgress('');
    } finally {
      console.log('🏁 [FINALLY] Cleanup block');
      console.log('🏁 [FINALLY] Setting isCloning to false');
      setIsCloning(false);
      console.log('🏁 [FINALLY] Location in finally:', window.location.href);
    }
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
            background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #3b82f6 100%)',
            boxShadow: '0 0 60px rgba(37, 99, 235,0.4), 0 0 120px rgba(37, 99, 235,0.15)',
          }}
        >
          <FolderOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
          Repo{' '}
          <span style={{
            background: 'linear-gradient(135deg, #60A5FA, #6366f1)',
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
              ? 'rgba(37, 99, 235,0.08)'
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
                background: 'radial-gradient(ellipse at center, rgba(37, 99, 235,0.12) 0%, transparent 70%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
          )}

          <AnimatePresence mode="wait">
            {isAnalyzing || isCloning ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <motion.div
                    className="w-14 h-14 rounded-full border-2 border-blue-500/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ borderTopColor: '#60A5FA' }}
                  />
                  <Zap
                    className="absolute inset-0 m-auto w-6 h-6 text-blue-400"
                  />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    {cloneProgress || 'Analyzing repository...'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {isCloning ? 'Cloning from GitHub and running AI analysis' : 'Parsing files and running AI analysis'}
                  </p>
                </div>
                {/* Progress dots */}
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-blue-400"
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
                    background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                    boxShadow: '0 4px 20px rgba(37, 99, 235,0.35)',
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
              placeholder="https://github.com/username/repository"
              value={githubUrl}
              onChange={handleUrlChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleClone();
                }
              }}
              disabled={isAnalyzing || isCloning}
              className={`w-full h-12 pl-10 pr-4 rounded-xl text-sm transition-colors ${
                urlError ? 'text-red-300 border-red-500/50' : 'text-gray-300'
              } ${
                isAnalyzing || isCloning ? 'cursor-not-allowed opacity-50' : ''
              }`}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${urlError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)'}`,
              }}
            />
            {/* URL Validation Status */}
            {githubUrl && !urlError && !isCloning && (
              <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
            )}
            {urlError && (
              <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
            )}
          </div>
          <button
            type="button"
            onClick={handleClone}
            disabled={!githubUrl.trim() || !!urlError || isAnalyzing || isCloning}
            className={`px-5 h-12 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              !githubUrl.trim() || urlError || isAnalyzing || isCloning
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-white hover:scale-105'
            }`}
            style={{
              background: !githubUrl.trim() || urlError || isAnalyzing || isCloning
                ? 'rgba(255,255,255,0.03)'
                : 'linear-gradient(135deg, #2563EB, #3B82F6)',
              border: `1px solid ${
                !githubUrl.trim() || urlError || isAnalyzing || isCloning
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(37, 99, 235, 0.3)'
              }`,
              boxShadow: !githubUrl.trim() || urlError || isAnalyzing || isCloning
                ? 'none'
                : '0 4px 20px rgba(37, 99, 235,0.35)'
            }}
          >
            {isCloning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4" />
            )}
            {isCloning ? 'Cloning...' : 'Clone & Analyze'}
          </button>
        </motion.div>
        
        {/* Error Message */}
        {urlError && (
          <motion.div
            className="mt-3 px-4 py-2 rounded-lg text-sm text-red-300 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {urlError}
          </motion.div>
        )}

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            'GitHub Clone', 'AI File Explanation', 'Bug Detection', 'Dependency Analysis',
            'Auto Documentation', 'Onboarding Guide', 'Repo Chat', 'Full-Text Search'
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(37, 99, 235,0.1)',
                border: '1px solid rgba(37, 99, 235,0.2)',
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

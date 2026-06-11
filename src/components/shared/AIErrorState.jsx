/**
 * src/components/shared/AIErrorState.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable AI error UI used across every AI-powered feature.
 *
 * Usage:
 *   <AIErrorState onRetry={retryFn} onDismiss={() => setError(null)} />
 *
 * The component never receives the raw error — callers pass only the clean
 * user-facing message that already came through sanitizeError() on the server.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, X, Loader2 } from 'lucide-react';

/**
 * Full-area centered error state (for page-level failures).
 *
 * @param {{ onRetry?: () => void, onDismiss?: () => void, isRetrying?: boolean }} props
 */
export function AIErrorState({ onRetry, onDismiss, isRetrying = false }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full gap-5 px-6"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon */}
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.22)',
          boxShadow: '0 0 30px rgba(239,68,68,0.1)',
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      >
        <AlertCircle className="w-7 h-7 text-red-400" />
      </motion.div>

      {/* Text */}
      <div className="text-center">
        <p className="text-[15px] font-semibold text-white mb-1.5">
          Something went wrong
        </p>
        <p className="text-[13px] text-gray-500 leading-relaxed">
          Please try again.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onRetry && (
          <motion.button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition-all"
            style={{
              background: isRetrying
                ? 'rgba(37,99,235,0.2)'
                : 'linear-gradient(135deg, #2563EB, #3B82F6)',
              boxShadow: isRetrying ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
              opacity: isRetrying ? 0.7 : 1,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
            }}
            whileHover={!isRetrying ? { scale: 1.03 } : {}}
            whileTap={!isRetrying ? { scale: 0.97 } : {}}
          >
            {isRetrying
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />}
            {isRetrying ? 'Retrying…' : 'Retry'}
          </motion.button>
        )}

        {onDismiss && (
          <motion.button
            onClick={onDismiss}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] text-gray-400 hover:text-white transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Inline banner error (for chat stream errors, small containers).
 *
 * @param {{ onRetry?: () => void, onDismiss?: () => void, isRetrying?: boolean }} props
 */
export function AIErrorBanner({ onRetry, onDismiss, isRetrying = false }) {
  return (
    <motion.div
      className="flex items-center gap-3 mx-4 px-4 py-3 rounded-xl"
      style={{
        background: 'rgba(239,68,68,0.07)',
        border: '1px solid rgba(239,68,68,0.18)',
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
    >
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium text-red-300">Something went wrong</p>
        <p className="text-[11.5px] text-gray-600">Please try again.</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all"
            style={{
              background: isRetrying ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.3)',
              opacity: isRetrying ? 0.6 : 1,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
            }}
          >
            {isRetrying
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <RefreshCw className="w-3 h-3" />}
            {isRetrying ? 'Retrying…' : 'Retry'}
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-gray-600 hover:text-gray-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Hook: wraps any async AI call with clean error/retry/loading state.
 *
 * @template T
 * @param {() => Promise<T>} fn  - the async function to wrap
 * @returns {{
 *   run: () => Promise<T|null>,
 *   retry: () => Promise<T|null>,
 *   isLoading: boolean,
 *   isRetrying: boolean,
 *   error: boolean,
 *   clearError: () => void,
 * }}
 *
 * Usage:
 *   const { run, retry, isLoading, isRetrying, error, clearError } = useAIRequest(myFn);
 *   <button onClick={run}>Generate</button>
 *   {error && <AIErrorState onRetry={retry} onDismiss={clearError} isRetrying={isRetrying} />}
 */
export function useAIRequest(fn) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(false);

  const execute = async (retrying = false) => {
    if (retrying) setIsRetrying(true);
    else setIsLoading(true);
    setError(false);

    try {
      const result = await fn();
      return result;
    } catch {
      // All server errors are already sanitized. Any client-side exception
      // (network offline, etc.) is also caught here — user sees the same
      // clean "Something went wrong" UI.
      setError(true);
      return null;
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  return {
    run: () => execute(false),
    retry: () => execute(true),
    isLoading,
    isRetrying,
    error,
    clearError: () => setError(false),
  };
}

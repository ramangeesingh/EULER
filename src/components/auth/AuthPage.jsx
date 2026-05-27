// src/components/auth/AuthPage.jsx
// Premium cosmic glassmorphism login / sign-up page

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, Code2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import VideoBackground from '../VideoBackground';

// ─── Google icon (inline SVG) ───────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Floating label input ────────────────────────────────────────────────────
function AuthInput({ icon: Icon, label, type = 'text', value, onChange, id, showToggle, onToggle, showPassword }) {
  return (
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-violet-400 transition-colors z-10">
        <Icon size={16} />
      </div>
      <input
        id={id}
        type={showToggle ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={onChange}
        placeholder=" "
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
        className="auth-input peer w-full pl-10 pr-10 pt-5 pb-2 text-sm text-white bg-transparent outline-none"
      />
      <label
        htmlFor={id}
        className="absolute left-10 top-1/2 -translate-y-1/2 text-[13px] text-gray-500 
          peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-[13px]
          peer-focus:top-3 peer-focus:text-[10px] peer-focus:text-violet-400
          peer-not-placeholder-shown:top-3 peer-not-placeholder-shown:text-[10px]
          transition-all duration-200 pointer-events-none select-none"
      >
        {label}
      </label>
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, error, clearError } = useAuth();

  const [tab, setTab]               = useState('signin'); // 'signin' | 'signup'
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = localError || error || '';

  const handleTabChange = (t) => {
    setTab(t);
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) { setLocalError('Please fill in all fields.'); return; }
    if (tab === 'signup' && !name) { setLocalError('Please enter your name.'); return; }
    if (password.length < 6) { setLocalError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const fn = tab === 'signup' ? signUp : signIn;
      const params = tab === 'signup' ? { email, password, name } : { email, password };
      const { error: authError } = await fn(params) ?? {};
      if (authError) setLocalError(authError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLocalError('');
    clearError();
    await signInWithGoogle();
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative flex items-center justify-center">
      {/* Cosmic video BG */}
      <VideoBackground />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      {/* Ambient glow orbs */}
      <div className="absolute z-[1] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', top: '10%', left: '20%' }} />
      <div className="absolute z-[1] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', bottom: '10%', right: '15%' }} />

      {/* Auth card */}
      <motion.div
        className="relative z-10 w-full max-w-[400px] mx-4"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 0 40px rgba(124,58,237,0.5)',
            }}
            animate={{ boxShadow: ['0 0 30px rgba(124,58,237,0.4)', '0 0 50px rgba(124,58,237,0.7)', '0 0 30px rgba(124,58,237,0.4)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Code2 className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Euler</h1>
          <p className="text-sm text-gray-500 mt-1">Your AI coding co-pilot</p>
        </div>

        {/* Card glass */}
        <div className="auth-card rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-white/[0.06]">
            {['signin', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={`flex-1 py-3.5 text-[13px] font-medium transition-all relative ${
                  tab === t ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
                {tab === t && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Form body */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.form
                key={tab}
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: tab === 'signin' ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'signin' ? 16 : -16 }}
                transition={{ duration: 0.22 }}
                className="space-y-3"
              >
                {/* Name (signup only) */}
                {tab === 'signup' && (
                  <AuthInput
                    id="auth-name"
                    icon={User}
                    label="Full name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                )}

                {/* Email */}
                <AuthInput
                  id="auth-email"
                  icon={Mail}
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {/* Password */}
                <AuthInput
                  id="auth-password"
                  icon={Lock}
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showToggle
                  showPassword={showPw}
                  onToggle={() => setShowPw((p) => !p)}
                />

                {/* Error */}
                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                    >
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{displayError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="auth-submit-btn w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-1"
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    tab === 'signin' ? 'Sign In' : 'Create Account'
                  )}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[11px] text-gray-600">or continue with</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Google OAuth */}
                <motion.button
                  type="button"
                  onClick={handleGoogle}
                  className="auth-google-btn w-full h-10 rounded-xl text-[13px] font-medium text-gray-300 flex items-center justify-center gap-2.5"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GoogleIcon />
                  Google
                </motion.button>
              </motion.form>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-gray-600 mt-5">
          By continuing, you agree to our{' '}
          <span className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">Terms</span>
          {' & '}
          <span className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">Privacy Policy</span>
        </p>
      </motion.div>
    </div>
  );
}

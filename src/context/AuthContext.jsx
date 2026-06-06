// src/context/AuthContext.jsx
// Global auth state — wraps the entire app

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [emailVerifiedNotification, setEmailVerifiedNotification] = useState(false);

  // ── Sync session on mount and on auth state changes ──────────────────────
  useEffect(() => {
    console.log('🔑 [AUTH CONTEXT] Initializing');

    const isVerifiedClick = 
      window.location.search.includes('verified=true') || 
      window.location.hash.includes('type=signup') ||
      window.location.search.includes('type=signup');

    if (isVerifiedClick) {
      console.log('📬 [AUTH CONTEXT] Detected email verification link click. Processing sign out.');
      setLoading(true);
      
      // Execute sign out to prevent auto-login
      supabase.auth.signOut().then(() => {
        setEmailVerifiedNotification(true);
        
        // Clean URL parameters to restore clean interface URL
        const url = new URL(window.location.href);
        url.searchParams.delete('verified');
        url.searchParams.delete('type');
        url.searchParams.delete('code');
        url.hash = '';
        window.history.replaceState(null, document.title, url.toString());

        setSession(null);
        setUser(null);
        setLoading(false);
      });
      return;
    }

    // Get current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔑 [AUTH CONTEXT] Session loaded:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for future changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔑 [AUTH CONTEXT] Auth state changed:', event);
        console.log('🔑 [AUTH CONTEXT] Has session:', !!session);
        console.log('🔑 [AUTH CONTEXT] Location:', window.location.href);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth methods ──────────────────────────────────────────────────────────
  const signUp = useCallback(async ({ email, password, name }) => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { name },
        emailRedirectTo: window.location.origin + '?verified=true',
      },
    });
    if (error) { setError(error.message); return { error }; }
    return { data };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return { error }; }
    return { data };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await supabase.auth.signOut();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const clearEmailVerifiedNotification = useCallback(() => {
    setEmailVerifiedNotification(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      error,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      clearError,
      emailVerifiedNotification,
      clearEmailVerifiedNotification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}


'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn, signUp, signInAsGuest, signInWithGoogle, SUPABASE_PROJECT_REF } from '../../lib/supabase/auth';

const PENDING_CONFIRMATION_KEY = 'govax_pending_email_confirmation';

export default function AuthForm() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Initialized from localStorage, not just component state — a page
  // refresh while waiting on email confirmation previously wiped this
  // message with no explanation, leaving someone who'd already signed
  // up looking at what appeared to be a blank, broken login form.
  const [setupNeeded, setSetupNeeded] = useState(null); // 'anonymous' | 'google'
  const [signupMessage, setSignupMessage] = useState(() => {
    if (typeof window === 'undefined') return null;
    const pendingEmail = window.localStorage.getItem(PENDING_CONFIRMATION_KEY);
    return pendingEmail ? `Check your email (${pendingEmail}) to confirm your account before signing in.` : null;
  });

  const handleProvider = async (fn) => {
    setError(null);
    setSignupMessage(null);
    setSetupNeeded(null);
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      // A one-time Supabase setting, not a failure the user caused —
      // show them exactly what to switch on and where, rather than a
      // raw API error which tells them nothing useful.
      if (err.setupRequired) setSetupNeeded(err.setupRequired);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSignupMessage(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        window.localStorage.removeItem(PENDING_CONFIRMATION_KEY);
        await signIn(email, password);
      } else {
        await signUp(email, password);
        window.localStorage.setItem(PENDING_CONFIRMATION_KEY, email);
        setSignupMessage('Check your email to confirm your account before signing in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fb-bg">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm p-8 bg-fb-card border border-fb-border rounded-xl shadow-fbCard"
      >
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-fb-blue">GOV.AX</span>
          <p className="text-xs text-fb-textSecondary mt-1">
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-fb-bg border border-fb-border rounded-lg text-sm focus:outline-none focus:border-fb-blue focus:bg-fb-card"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2.5 bg-fb-bg border border-fb-border rounded-lg text-sm focus:outline-none focus:border-fb-blue focus:bg-fb-card"
          />

          {error && <p className="text-xs text-fb-red">⚠ {error}</p>}
          {signupMessage && <p className="text-xs text-fb-green">{signupMessage}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-fb-blue hover:bg-fb-blueHover text-white rounded-lg font-bold text-sm disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>


        {setupNeeded && (
          <div className="mt-3 p-3 bg-fb-blueLight border border-fb-blue/30 rounded-lg text-left">
            <p className="text-[11px] font-bold text-fb-blue mb-1">
              One-time setup needed{setupNeeded === 'google' ? ' for Google sign-in' : ' for guest access'}
            </p>
            {setupNeeded === 'anonymous' ? (
              <ol className="text-[10px] text-fb-text space-y-1 list-decimal list-inside">
                <li>Open your Supabase project&apos;s Authentication settings</li>
                <li>Find <strong>Allow anonymous sign-ins</strong> and turn it on</li>
                <li>Come back and press the guest button again</li>
              </ol>
            ) : (
              <ol className="text-[10px] text-fb-text space-y-1 list-decimal list-inside">
                <li>In Google Cloud Console, create OAuth 2.0 credentials</li>
                <li>
                  Add this as an authorised redirect URI:
                  <code className="block mt-0.5 p-1 bg-fb-card border border-fb-border rounded text-[9px] break-all">
                    https://{SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback
                  </code>
                </li>
                <li>In Supabase → Authentication → Providers → Google: enable it and paste the Client ID and Secret</li>
              </ol>
            )}
            <a
              href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/auth/providers`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-[10px] font-medium text-fb-blue underline"
            >
              Open Supabase auth settings →
            </a>
            <p className="text-[9px] text-fb-textSecondary mt-1.5">
              Email sign-in above already works and needs no setup.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-fb-border" />
          <span className="text-[10px] text-fb-textSecondary uppercase">or</span>
          <div className="flex-1 h-px bg-fb-border" />
        </div>

        <button
          onClick={() => handleProvider(signInWithGoogle)}
          disabled={loading}
          className="w-full py-2.5 bg-fb-card hover:bg-fb-bg border border-fb-border rounded-lg font-medium text-sm text-fb-text disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.05 6.05 29.3 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.3-.14-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.05 6.05 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.8 35.9 44 30.5 44 24c0-1.3-.14-2.4-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        {/* TEMPORARY — remove with the whole block. See docs/GUEST-ACCESS.md */}
        <button
          onClick={() => handleProvider(signInAsGuest)}
          disabled={loading}
          className="w-full py-2 mt-2 bg-fb-bg hover:bg-fb-border border border-dashed border-fb-border rounded-lg font-medium text-xs text-fb-textSecondary disabled:opacity-50 cursor-pointer"
        >
          Continue as guest (explore without an account)
        </button>
        <p className="text-[9px] text-fb-textSecondary text-center mt-1.5">
          Guest sessions are real isolated accounts with their own workspace. Temporary feature for exploration.
        </p>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setSignupMessage(null);
          }}
          className="w-full text-center text-xs text-fb-textSecondary hover:text-fb-blue mt-4 cursor-pointer"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </motion.div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn, signUp, signInAsGuest, SUPABASE_PROJECT_REF } from '../../lib/supabase/auth';

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
            <p className="text-[11px] font-bold text-fb-blue mb-1">One-time setup needed for guest access</p>
            {setupNeeded === 'anonymous' ? (
              <ol className="text-[10px] text-fb-text space-y-1 list-decimal list-inside">
                <li>Open your Supabase project&apos;s Authentication settings</li>
                <li>Find <strong>Allow anonymous sign-ins</strong> and turn it on</li>
                <li>Come back and press the guest button again</li>
              </ol>
            ) : null}
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

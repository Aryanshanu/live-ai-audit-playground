'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn, signUp } from '../../lib/supabase/auth';

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
  const [signupMessage, setSignupMessage] = useState(() => {
    if (typeof window === 'undefined') return null;
    const pendingEmail = window.localStorage.getItem(PENDING_CONFIRMATION_KEY);
    return pendingEmail ? `Check your email (${pendingEmail}) to confirm your account before signing in.` : null;
  });

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
        className="w-full max-w-sm p-8 bg-white border border-fb-border rounded-xl shadow-fbCard"
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
            className="w-full px-4 py-2.5 bg-fb-bg border border-fb-border rounded-lg text-sm focus:outline-none focus:border-fb-blue focus:bg-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2.5 bg-fb-bg border border-fb-border rounded-lg text-sm focus:outline-none focus:border-fb-blue focus:bg-white"
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

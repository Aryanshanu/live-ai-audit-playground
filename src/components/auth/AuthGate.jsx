'use client';

import { useSession } from '../../lib/supabase/auth';
import { signOut } from '../../lib/supabase/auth';
import AuthForm from './AuthForm';

/**
 * Client-side auth gate. This is a UX convenience, not the security
 * boundary — RLS on the Supabase tables is what actually prevents
 * unauthorized data access (verified with zero advisor findings). This
 * component's only job is to avoid flashing protected UI at someone who
 * isn't signed in and to give a place to hang a session/sign-out control.
 */
export default function AuthGate({ children }) {
  const { session, user, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fb-bg">
        <div className="w-8 h-8 border-2 border-fb-border border-t-fb-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return (
    <div>
      <div className="bg-fb-blueLight border-b border-fb-blue/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-fb-blue">
        <span>Signed in as {user.email}</span>
        <button onClick={() => signOut()} className="hover:underline cursor-pointer font-medium">
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}

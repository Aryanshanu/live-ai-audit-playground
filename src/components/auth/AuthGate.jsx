'use client';

import { useSession, useOrgMembership, signOut, isGuestSession } from '../../lib/supabase/auth';
import AuthForm from './AuthForm';

const ROLE_STYLE = {
  owner: 'bg-red-50 text-fb-red border-red-200',
  admin: 'bg-red-50 text-fb-red border-red-200',
  auditor: 'bg-fb-blueLight text-fb-blue border-fb-blue/30',
  viewer: 'bg-gray-100 text-fb-textSecondary border-gray-300',
  external_auditor: 'bg-amber-50 text-amber-700 border-amber-200',
};

/**
 * Client-side auth gate. This is a UX convenience, not the security
 * boundary — RLS on the Supabase tables is what actually prevents
 * unauthorized data access (verified with zero advisor findings). This
 * component's only job is to avoid flashing protected UI at someone who
 * isn't signed in and to give a place to hang a session/sign-out control.
 */
export default function AuthGate({ children }) {
  const { session, user, loading } = useSession();
  const { activeOrg, roles, loading: orgLoading } = useOrgMembership(user?.id);
  const guest = isGuestSession(session);

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
      {/* TEMPORARY — remove with guest access. See docs/GUEST-ACCESS.md */}
      {guest && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-[11px] text-amber-800 text-center">
          Exploring as a guest. This is a real isolated workspace, but it is temporary — sign up to keep your audits.
        </div>
      )}
      <div className="bg-fb-blueLight border-b border-fb-blue/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-fb-blue">
        <span className="flex items-center gap-2">
          {guest ? 'Guest session' : `Signed in as ${user.email}`}
          {!orgLoading && activeOrg?.organizations?.name && (
            <span className="text-fb-textSecondary">· {activeOrg.organizations.name}</span>
          )}
          {!orgLoading &&
            roles.map((role) => (
              <span
                key={role}
                className={`px-1.5 py-0.5 rounded-full font-bold uppercase text-[9px] border ${ROLE_STYLE[role] || ROLE_STYLE.viewer}`}
              >
                {role}
              </span>
            ))}
        </span>
        <button onClick={() => signOut()} className="hover:underline cursor-pointer font-medium">
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}

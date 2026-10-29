import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { sb } from './supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recovery, setRecovery] = useState(false);

  const loadProfile = useCallback(async (user) => {
    if (!user) { setProfile(null); setIsAdmin(false); return; }
    const [{ data: prof }, { data: admin }] = await Promise.all([
      sb.from('profiles').select('id, full_name, created_at').eq('id', user.id).maybeSingle(),
      sb.rpc('is_admin'),
    ]);
    setProfile(prof || { id: user.id, full_name: '' });
    setIsAdmin(admin === true); // decided by the server's admin_emails list
  }, []);

  useEffect(() => {
    let active = true;
    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      await loadProfile(session?.user);
      setSession(session);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // defer so we don't call Supabase inside its own callback
        setTimeout(async () => { await loadProfile(s?.user); setSession(s); }, 0);
      }
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const value = {
    loading: session === undefined,
    session,
    user: session?.user || null,
    profile,
    isAdmin,
    recovery,
    clearRecovery: () => setRecovery(false),
    displayName: profile?.full_name || session?.user?.email || '',
    signOut: () => sb.auth.signOut(),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

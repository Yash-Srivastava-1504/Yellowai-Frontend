import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ProfileRow } from "@/lib/database.types";
import { fetchOrCreateProfile, toQueryError } from "@/lib/userData";

type AuthContextValue = {
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  profileError: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user: User) => {
    const client = getSupabase();
    if (!client) return;
    setProfileError(null);
    try {
      const row = await fetchOrCreateProfile(client, user.id, user.email);
      setProfile(row);
    } catch (e) {
      console.error(e);
      setProfile(null);
      const err = toQueryError(e);
      setProfileError(
        `${err.message} — Open Supabase → SQL Editor and run supabase/setup.sql then supabase/projects-prompts-migration.sql`,
      );
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const client = getSupabase();
    const u = session?.user;
    if (!client || !u) return;
    await loadProfile(u);
  }, [session?.user, loadProfile]);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    client.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s);
      if (s?.user) {
        loadProfile(s.user).finally(() => {
          if (!cancelled) setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) {
        setProfile((prevProfile) => {
          if (prevProfile?.id !== s.user.id) {
            setLoading(true);
            loadProfile(s.user).finally(() => setLoading(false));
          }
          return prevProfile;
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    const client = getSupabase();
    if (client) await client.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      configured,
      session,
      user: session?.user ?? null,
      profile,
      profileError,
      loading,
      refreshProfile,
      signOut,
    }),
    [configured, session, profile, profileError, loading, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

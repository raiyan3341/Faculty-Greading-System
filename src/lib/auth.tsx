import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type AuthValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: got }) => {
      setSession(got.session);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const user = session?.user;
    const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
    const payload = {
      id: userId,
      email: user?.email ?? null,
      full_name: meta['full_name'] ?? meta['name'] ?? user?.email?.split("@")[0] ?? null,
      avatar_url: meta['avatar_url'] ?? meta['picture'] ?? null,
    };
    let active = true;
    supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .then(() =>
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url")
          .eq("id", userId)
          .maybeSingle()
          .then(({ data }) => {
            if (active) setProfile((data as Profile) ?? payload);
          }),
      );
    return () => {
      active = false;
    };
  }, [userId, session?.user]);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      // নতুন কোড (সরাসরি Supabase Auth):
      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) return { error: error.message };
        return {};
      },

      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

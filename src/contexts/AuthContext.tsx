import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export type UserProfile = {
  user_id: string;
  display_name: string | null;
  gender: string;
  preferred_gender: string;
  age: number;
  balance_minutes: number;
};

type AuthContextType = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  sendOtp: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createProfile: (data: { display_name?: string; gender: string; preferred_gender: string; age: number }) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await (supabase as any)
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile(data || null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setSession(session);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const createProfile = async (data: { display_name?: string; gender: string; preferred_gender: string; age: number }) => {
    if (!session?.user) return { error: "Not authenticated" };
    const { error } = await (supabase as any).from("user_profiles").insert({
      user_id: session.user.id,
      ...data,
      balance_minutes: 5,
    });
    if (!error) await loadProfile(session.user.id);
    return { error };
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, sendOtp, verifyOtp, signOut, createProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

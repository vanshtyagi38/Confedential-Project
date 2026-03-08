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
  signUpWithEmail: (email: string) => Promise<{ error: any; session: Session | null }>;
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
    let initialized = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);
      setSession(session);
      if (session?.user) {
        // Use setTimeout to avoid Supabase client deadlock
        setTimeout(async () => {
          await loadProfile(session.user.id);
          if (!initialized) {
            initialized = true;
            setLoading(false);
          }
        }, 0);
      } else {
        setProfile(null);
        if (!initialized) {
          initialized = true;
          setLoading(false);
        }
      }
    });

    // Fallback: if auth state doesn't fire within 3s, stop loading
    const timeout = setTimeout(() => {
      if (!initialized) {
        console.log("Auth timeout - forcing loading=false");
        initialized = true;
        setLoading(false);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // New user: signUp with auto-generated password (auto-confirm creates session instantly)
  const signUpWithEmail = async (email: string) => {
    const randomPass = crypto.randomUUID() + "!Aa1";
    const { data, error } = await supabase.auth.signUp({
      email,
      password: randomPass,
    });
    if (!error && data.session) {
      setSession(data.session);
    }
    return { error, session: data?.session || null };
  };

  // Returning user: magic link OTP flow
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
    // Get fresh session if not in state yet
    let userId = session?.user?.id;
    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      userId = sessionData?.session?.user?.id;
      if (sessionData?.session) setSession(sessionData.session);
    }
    if (!userId) return { error: "Not authenticated" };
    
    const { error } = await (supabase as any).from("user_profiles").insert({
      user_id: userId,
      ...data,
      balance_minutes: 5,
    });
    if (!error) await loadProfile(userId);
    return { error };
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUpWithEmail, sendOtp, verifyOtp, signOut, createProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

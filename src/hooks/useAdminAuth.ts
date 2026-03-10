import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export const useAdminAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async (userId: string) => {
      // Try to assign admin role if email matches
      await supabase.rpc("try_assign_admin" as any);
      // Check if user has admin role
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => checkAdmin(session.user.id), 0);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    return { error: null, session: data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  };

  const logAction = async (action: string, targetType?: string, targetId?: string, details?: any) => {
    if (!session?.user) return;
    await (supabase as any).from("admin_activity_log").insert({
      admin_user_id: session.user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  };

  return { session, isAdmin, loading, signIn, signOut, logAction };
};

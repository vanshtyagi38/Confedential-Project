import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePresence() {
  const { session } = useAuth();

  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!session?.user) return;
    await (supabase as any).from("user_presence").upsert({
      user_id: session.user.id,
      is_online: isOnline,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user) return;

    // Go online
    updatePresence(true);

    // Heartbeat every 30s
    const heartbeat = setInterval(() => updatePresence(true), 30000);

    // Go offline on tab close/hide
    const handleVisibility = () => {
      if (document.hidden) updatePresence(false);
      else updatePresence(true);
    };
    const handleBeforeUnload = () => updatePresence(false);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updatePresence(false);
    };
  }, [session?.user?.id, updatePresence]);
}

export function useCompanionPresence() {
  // Returns a hook to check if a companion's owner is online
  const getPresenceMap = async (): Promise<Record<string, { is_online: boolean; last_seen: string }>> => {
    const { data } = await (supabase as any).from("user_presence").select("*");
    const map: Record<string, { is_online: boolean; last_seen: string }> = {};
    if (data) {
      data.forEach((p: any) => {
        map[p.user_id] = { is_online: p.is_online, last_seen: p.last_seen };
      });
    }
    return map;
  };

  return { getPresenceMap };
}

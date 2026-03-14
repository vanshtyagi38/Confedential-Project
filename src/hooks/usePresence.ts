import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HEARTBEAT_INTERVAL = 60_000; // 60s heartbeat for scale
const DEBOUNCE_MS = 2_000; // Debounce rapid visibility changes

export function usePresence() {
  const { session } = useAuth();
  const lastUpdateRef = useRef<number>(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!session?.user) return;

    // Debounce: skip if updated within DEBOUNCE_MS
    const now = Date.now();
    if (now - lastUpdateRef.current < DEBOUNCE_MS) {
      // Schedule a deferred update for offline transitions
      if (!isOnline && !pendingRef.current) {
        pendingRef.current = setTimeout(() => {
          pendingRef.current = null;
          updatePresence(false);
        }, DEBOUNCE_MS);
      }
      return;
    }

    // Cancel any pending offline update if going online
    if (isOnline && pendingRef.current) {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
    }

    lastUpdateRef.current = now;

    try {
      await (supabase as any).from("user_presence").upsert({
        user_id: session.user.id,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } catch (_) {
      // Silently fail - non-critical
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user) return;

    updatePresence(true);

    // Heartbeat every 60s (reduced from 30s for 10K users)
    const heartbeat = setInterval(() => updatePresence(true), HEARTBEAT_INTERVAL);

    const handleVisibility = () => {
      if (document.hidden) updatePresence(false);
      else updatePresence(true);
    };
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline marking on page close
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${session.user.id}`;
      const body = JSON.stringify({ is_online: false, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() });
      navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }));
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      if (pendingRef.current) clearTimeout(pendingRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updatePresence(false);
    };
  }, [session?.user?.id, updatePresence]);
}

export function useCompanionPresence() {
  const getPresenceMap = async (): Promise<Record<string, { is_online: boolean; last_seen: string }>> => {
    const { data } = await (supabase as any)
      .from("user_presence")
      .select("user_id, is_online, last_seen")
      .eq("is_online", true); // Only fetch online users — uses partial index
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

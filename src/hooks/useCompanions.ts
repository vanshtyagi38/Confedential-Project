import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dbRowToCompanion, type Companion } from "@/data/companions";

export function useCompanions() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanions = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("companions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (data) {
      setCompanions(data.map(dbRowToCompanion));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanions();
  }, [fetchCompanions]);

  const getCompanionBySlug = useCallback(
    (slug: string) => companions.find((c) => c.id === slug),
    [companions]
  );

  return { companions, loading, refetch: fetchCompanions, getCompanionBySlug };
}

// Hook to fetch a single companion by slug (includes banned/any status)
export function useCompanionStatus(slug: string | undefined) {
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [banExpired, setBanExpired] = useState(false);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }

    const fetch = async () => {
      // Use admin-level read or the active policy + owner policy
      const { data } = await (supabase as any)
        .from("companions")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (data) {
        setCompanion(dbRowToCompanion(data));
        if (data.status === "banned") {
          setIsBanned(true);
          if (data.banned_at) {
            const bannedTime = new Date(data.banned_at).getTime();
            const now = Date.now();
            setBanExpired(now - bannedTime > 24 * 60 * 60 * 1000);
          }
        } else if (data.status === "deleted") {
          setIsDeleted(true);
        }
      } else {
        // Companion not found in DB — might be deleted after 24h
        setIsDeleted(true);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  return { companion, loading, isBanned, isDeleted, banExpired };
}

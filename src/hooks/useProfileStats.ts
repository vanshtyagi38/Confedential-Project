import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { companions, type Companion } from "@/data/companions";

export type ProfileStats = {
  totalMessages: number;
  uniqueCompanions: number;
  currentStreak: number;
  longestStreak: number;
  referralCount: number;
  favoriteCompanions: Companion[];
  loading: boolean;
};

export function useProfileStats(): ProfileStats {
  const { session } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    totalMessages: 0,
    uniqueCompanions: 0,
    currentStreak: 0,
    longestStreak: 0,
    referralCount: 0,
    favoriteCompanions: [],
    loading: true,
  });

  useEffect(() => {
    if (!session?.user) return;

    const userId = session.user.id;

    const load = async () => {
      const [messagesRes, streakRes, referralsRes] = await Promise.all([
        (supabase as any)
          .from("chat_messages")
          .select("companion_slug")
          .eq("user_id", userId)
          .eq("role", "user"),
        (supabase as any)
          .from("user_streaks")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        (supabase as any)
          .from("referrals")
          .select("id")
          .eq("referrer_user_id", userId)
          .eq("status", "completed"),
      ]);

      const messages = messagesRes.data || [];
      const totalMessages = messages.length;

      const companionCounts: Record<string, number> = {};
      messages.forEach((m: { companion_slug: string }) => {
        companionCounts[m.companion_slug] =
          (companionCounts[m.companion_slug] || 0) + 1;
      });

      const uniqueCompanions = Object.keys(companionCounts).length;

      const topSlugs = Object.entries(companionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([slug]) => slug);

      const favoriteCompanions = topSlugs
        .map((slug) => companions.find((c) => c.id === slug))
        .filter(Boolean) as Companion[];

      const streak = streakRes.data;

      setStats({
        totalMessages,
        uniqueCompanions,
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
        referralCount: referralsRes.data?.length || 0,
        favoriteCompanions,
        loading: false,
      });
    };

    load();
  }, [session?.user?.id]);

  return stats;
}

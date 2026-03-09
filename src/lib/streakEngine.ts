import { supabase } from "@/integrations/supabase/client";

export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  bonusAwarded: number;
  milestoneReached: boolean;
}> {
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await (supabase as any)
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await (supabase as any).from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    });
    return { currentStreak: 1, bonusAwarded: 0, milestoneReached: false };
  }

  if (existing.last_activity_date === today) {
    return {
      currentStreak: existing.current_streak,
      bonusAwarded: 0,
      milestoneReached: false,
    };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak =
    existing.last_activity_date === yesterdayStr
      ? existing.current_streak + 1
      : 1;
  const longestStreak = Math.max(existing.longest_streak, newStreak);

  const milestones: Record<number, number> = { 3: 5, 7: 10, 14: 20, 30: 60 };
  const bonusAwarded = milestones[newStreak] || 0;

  await (supabase as any)
    .from("user_streaks")
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (bonusAwarded > 0) {
    const { data: profile } = await (supabase as any)
      .from("user_profiles")
      .select("balance_minutes")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      await Promise.all([
        (supabase as any)
          .from("user_profiles")
          .update({ balance_minutes: profile.balance_minutes + bonusAwarded })
          .eq("user_id", userId),
        (supabase as any).from("wallet_transactions").insert({
          user_id: userId,
          type: "credit",
          minutes: bonusAwarded,
          amount: 0,
          description: `🔥 ${newStreak}-day streak milestone bonus!`,
        }),
      ]);
    }
  }

  return {
    currentStreak: newStreak,
    bonusAwarded,
    milestoneReached: bonusAwarded > 0,
  };
}

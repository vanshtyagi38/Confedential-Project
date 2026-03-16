import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Listens for new referral reward wallet transactions in realtime
 * and shows a celebratory toast to the referrer.
 */
export const useReferralNotifications = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`referral-rewards-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const desc = (payload.new as any)?.description || "";
          if (desc.includes("Referral reward")) {
            const mins = (payload.new as any)?.minutes || 5;
            toast.success(`🎉 A friend joined using your link! +${mins} minutes & +1 spin added!`, {
              duration: 6000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};

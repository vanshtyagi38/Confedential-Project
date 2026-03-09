import { useState, useEffect } from "react";
import {
  Gift,
  Share2,
  Star,
  Users,
  Loader2,
  Copy,
  ChevronRight,
  Coins,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import SpinWheel, { SEGMENTS, segAngles } from "@/components/SpinWheel";
import InvitePopup from "@/components/InvitePopup";

/* weighted random pick — skip locked if not eligible */
function getRandomPrize(hasReferral10: boolean): number {
  const eligible = SEGMENTS.map((s, i) => ({
    ...s,
    idx: i,
    w: s.type === "locked" && !hasReferral10 ? 0 : s.weight,
  }));
  const total = eligible.reduce((sum, s) => sum + s.w, 0);
  let rand = Math.random() * total;
  for (const s of eligible) {
    rand -= s.w;
    if (rand <= 0) return s.idx;
  }
  return 0;
}

const EarnPage = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [referralCount, setReferralCount] = useState(0);

  const spinCredits = profile?.spin_credits || 0;
  const referralCode = profile?.referral_code || "";
  const referralLink = `${window.location.origin}/onboarding?ref=${referralCode}`;
  const hasReferral10 = referralCount >= 10;

  // fetch referral count
  useEffect(() => {
    if (!session?.user) return;
    (supabase as any)
      .from("referrals")
      .select("id")
      .eq("referrer_user_id", session.user.id)
      .eq("status", "completed")
      .then(({ data }: any) => setReferralCount(data?.length || 0));
  }, [session?.user?.id]);

  const handleSpinClick = async () => {
    if (spinning) return;

    // No spins → show invite popup
    if (spinCredits <= 0) {
      setInviteOpen(true);
      return;
    }

    const winnerIndex = getRandomPrize(hasReferral10);
    const centerAngle = segAngles[winnerIndex].center;
    const targetRotation = rotation + 1800 + (360 - centerAngle);

    setRotation(targetRotation);
    setSpinning(true);
    setWinner(null);

    // Deduct spin credit
    if (session?.user) {
      await (supabase as any)
        .from("user_profiles")
        .update({ spin_credits: spinCredits - 1 })
        .eq("user_id", session.user.id);
      await refreshProfile();
    }

    setTimeout(async () => {
      setSpinning(false);
      setWinner(winnerIndex);

      const prize = SEGMENTS[winnerIndex];

      if (session?.user && profile) {
        if (prize.type === "free_spin") {
          // Award a free spin credit back
          await (supabase as any)
            .from("user_profiles")
            .update({ spin_credits: (profile.spin_credits || 0) })
            .eq("user_id", session.user.id);
          await refreshProfile();
          toast.success("🎡 You won a Free Spin!", {
            duration: 4000,
            description: "Spin again for free!",
          });
        } else {
          await Promise.all([
            (supabase as any)
              .from("user_profiles")
              .update({
                balance_minutes: profile.balance_minutes + prize.minutes,
              })
              .eq("user_id", session.user.id),
            (supabase as any).from("wallet_transactions").insert({
              user_id: session.user.id,
              type: "credit",
              minutes: prize.minutes,
              amount: 0,
              description: `🎡 Spin wheel prize: +${prize.minutes} minutes!`,
            }),
          ]);
          await refreshProfile();
          toast.success(`🎉 You won ${prize.minutes} free minutes!`, {
            duration: 4000,
            description: "Minutes added to your balance!",
          });
        }
      }
    }, 4000);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-24">
      {/* Header */}
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold">Earn Free Minutes</h1>
        <div className="mt-1 flex items-center gap-2">
          <Coins className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-accent">
            {spinCredits} spin{spinCredits !== 1 ? "s" : ""} available
          </span>
        </div>
      </div>

      {/* Wheel */}
      <div className="flex flex-col items-center px-4 pb-4">
        <SpinWheel
          spinning={spinning}
          rotation={rotation}
          onSpinClick={handleSpinClick}
          disabled={spinning}
          hasReferral10={hasReferral10}
        />

        {/* Spin label */}
        <p className="mt-1 text-xs text-muted-foreground">
          {spinning
            ? "✨ Spinning..."
            : spinCredits > 0
            ? "Tap the wheel to spin!"
            : "Invite friends to earn spins 🎡"}
        </p>

        {winner !== null && !spinning && (
          <div className="mt-2 animate-fade-in rounded-xl bg-primary/10 px-4 py-2 text-center">
            <p className="text-sm font-bold text-primary">
              {SEGMENTS[winner].type === "free_spin"
                ? "🎡 Free Spin! Go again!"
                : `🎉 You won ${SEGMENTS[winner].minutes} minutes!`}
            </p>
          </div>
        )}
      </div>

      {/* How to get spins */}
      <div className="mx-4 mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold">How to Earn Spins</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-card/50 p-3">
            <Users className="h-4 w-4 text-accent" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Invite Friends</p>
              <p className="text-xs text-muted-foreground">+1 spin per signup</p>
            </div>
            <span className="text-xs font-bold text-primary">+1 🎡</span>
          </div>
          {!hasReferral10 && (
            <div className="flex items-center gap-3 rounded-xl bg-card/50 p-3 opacity-70">
              <span className="text-base">👑</span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Invite 10 friends</p>
                <p className="text-xs text-muted-foreground">
                  Unlock 20 min prize on wheel ({referralCount}/10)
                </p>
              </div>
              <span className="text-xs font-bold text-primary">🔓</span>
            </div>
          )}
        </div>
      </div>

      {/* Invite button */}
      <div className="mx-4 mb-4">
        <button
          onClick={() => setInviteOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elevated transition-transform active:scale-95"
        >
          <Share2 className="h-4 w-4" />
          Invite Friends & Earn Spins
        </button>
      </div>

      {/* Additional options */}
      <div className="mx-4 space-y-2">
        <button
          onClick={() => navigate("/profile")}
          className="flex w-full items-center gap-3 rounded-xl bg-card p-4 shadow-card transition-colors hover:bg-secondary"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <Star className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-sm font-semibold">Daily Streak</h3>
            <p className="text-xs text-muted-foreground">
              Chat daily for bonus minutes
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Invite Popup */}
      <InvitePopup
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        referralCode={referralCode}
        referralLink={referralLink}
      />

      <BottomNav />
    </div>
  );
};

export default EarnPage;

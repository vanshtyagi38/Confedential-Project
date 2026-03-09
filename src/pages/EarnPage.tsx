import { useState, useRef } from "react";
import {
  Gift,
  Share2,
  Star,
  Users,
  Loader2,
  Copy,
  Zap,
  ChevronRight,
  Coins,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const SEGMENTS = [
  {
    label: "5 min",
    minutes: 5,
    weight: 40,
    color: "hsl(348,75%,55%)",
    textColor: "#fff",
  },
  {
    label: "10 min",
    minutes: 10,
    weight: 25,
    color: "hsl(24,90%,58%)",
    textColor: "#fff",
  },
  {
    label: "15 min",
    minutes: 15,
    weight: 15,
    color: "hsl(348,75%,70%)",
    textColor: "#fff",
  },
  {
    label: "20 min",
    minutes: 20,
    weight: 10,
    color: "hsl(24,90%,70%)",
    textColor: "#fff",
  },
  {
    label: "30 min",
    minutes: 30,
    weight: 7,
    color: "hsl(260,75%,60%)",
    textColor: "#fff",
  },
  {
    label: "60 min",
    minutes: 60,
    weight: 3,
    color: "hsl(150,60%,45%)",
    textColor: "#fff",
  },
];

function getRandomPrize(): number {
  const totalWeight = SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < SEGMENTS.length; i++) {
    rand -= SEGMENTS[i].weight;
    if (rand <= 0) return i;
  }
  return 0;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function slicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function textPosition(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const mid = (startAngle + endAngle) / 2;
  return polarToCartesian(cx, cy, r * 0.68, mid);
}

// Calculate cumulative angles for each segment
const segmentAngles = SEGMENTS.map((_, i) => {
  const totalWeight = SEGMENTS.reduce((sum, s) => sum + s.weight, 0);
  const startWeight = SEGMENTS.slice(0, i).reduce((sum, s) => sum + s.weight, 0);
  const endWeight = startWeight + SEGMENTS[i].weight;
  return {
    start: (startWeight / totalWeight) * 360,
    end: (endWeight / totalWeight) * 360,
    center: ((startWeight + endWeight) / 2 / totalWeight) * 360,
  };
});

const EarnPage = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [copying, setCopying] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinCredits = profile?.spin_credits || 0;
  const referralCode = profile?.referral_code || "";
  const referralLink = `${window.location.origin}/onboarding?ref=${referralCode}`;

  const spin = async () => {
    if (spinning || spinCredits <= 0) {
      if (spinCredits <= 0) {
        toast.error("No spins left! Refer friends to earn more 🎡");
      }
      return;
    }

    const winnerIndex = getRandomPrize();
    const centerAngle = segmentAngles[winnerIndex].center;

    // Spin 5 full rotations + land on winner
    const targetRotation = rotation + 1800 + (360 - centerAngle);

    setRotation(targetRotation);
    setSpinning(true);
    setWinner(null);

    // Deduct spin credit immediately
    if (session?.user) {
      await (supabase as any)
        .from("user_profiles")
        .update({ spin_credits: spinCredits - 1 })
        .eq("user_id", session.user.id);
      await refreshProfile();
    }

    // Wait for animation to complete
    setTimeout(async () => {
      setSpinning(false);
      setWinner(winnerIndex);

      const prize = SEGMENTS[winnerIndex];

      if (session?.user && profile) {
        // Award the prize minutes
        await Promise.all([
          (supabase as any)
            .from("user_profiles")
            .update({ balance_minutes: profile.balance_minutes + prize.minutes })
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
      }

      toast.success(
        `🎉 You won ${prize.minutes} free minutes!`,
        {
          duration: 4000,
          description: "Minutes added to your balance!",
        }
      );
    }, 4000);
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopying(true);
      toast.success("Referral link copied! 🎉");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      toast.error("Couldn't copy link — try manually");
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join SingleTape with my referral!",
          text: "Get 5 free minutes when you sign up with my link! 🎉",
          url: referralLink,
        });
      } catch {}
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-24">
      {/* Header */}
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold">Earn Free Minutes</h1>
        <div className="mt-1 flex items-center gap-2">
          <Coins className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-accent">
            {spinCredits} spins available
          </span>
        </div>
      </div>

      {/* Spin Wheel */}
      <div className="flex flex-col items-center px-4 pb-6">
        <div className="relative mb-4">
          {/* Pointer */}
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2">
            <div className="h-6 w-6">
              <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-foreground drop-shadow-lg" />
            </div>
          </div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="relative h-80 w-80 rounded-full drop-shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                : "none",
            }}
          >
            <svg width="320" height="320" className="absolute inset-0">
              {SEGMENTS.map((segment, i) => (
                <g key={i}>
                  <path
                    d={slicePath(
                      160,
                      160,
                      150,
                      segmentAngles[i].start,
                      segmentAngles[i].end
                    )}
                    fill={segment.color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    {...textPosition(
                      160,
                      160,
                      150,
                      segmentAngles[i].start,
                      segmentAngles[i].end
                    )}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={segment.textColor}
                    fontSize="14"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {segment.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-background bg-card shadow-elevated">
              <Zap className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={spin}
          disabled={spinning || spinCredits <= 0}
          className={`flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold shadow-elevated transition-all ${
            spinning || spinCredits <= 0
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "gradient-primary text-primary-foreground active:scale-95"
          }`}
        >
          {spinning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Spinning...
            </>
          ) : spinCredits > 0 ? (
            <>
              <Star className="h-5 w-5" />
              Spin to Win!
            </>
          ) : (
            <>
              <Gift className="h-5 w-5" />
              No Spins Left
            </>
          )}
        </button>

        {winner !== null && !spinning && (
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold text-primary">
              🎉 You won {SEGMENTS[winner].minutes} minutes!
            </p>
          </div>
        )}
      </div>

      {/* How to Get More Spins */}
      <div className="mx-4 mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold">How to Earn Spins</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-card/50 p-3">
            <Users className="h-4 w-4 text-accent" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Invite Friends</p>
              <p className="text-xs text-muted-foreground">
                +1 spin per signup
              </p>
            </div>
            <span className="text-xs font-bold text-primary">+1 🎡</span>
          </div>
        </div>
      </div>

      {/* Referral Section */}
      {referralCode && (
        <div className="mx-4 mb-6 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">Invite Friends</h3>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Share your code. When friends sign up, you get 1 spin & they get 5
            free minutes!
          </p>
          
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
            <code className="flex-1 font-mono text-sm font-bold text-primary">
              {referralCode}
            </code>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyReferralLink}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary py-2.5 text-xs font-semibold transition-all active:scale-95"
            >
              <Copy className="h-3.5 w-3.5" />
              {copying ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={shareReferralLink}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-primary-foreground transition-all gradient-primary active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </div>
      )}

      {/* Additional Earn Options */}
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

      <BottomNav />
    </div>
  );
};

export default EarnPage;
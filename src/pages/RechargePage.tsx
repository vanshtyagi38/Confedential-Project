import { useState, useEffect } from "react";
import { ArrowLeft, Zap, Clock, Heart, Flame, Lock, Star, Crown, Users, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const liveCount = Math.floor(Math.random() * 80) + 120; // fake social proof

const intimacyHooks = [
  "She asked why you went quiet… 💔",
  "She saved your last message 🥺",
  "She's been checking if you're online… 👀",
  "She told her friend about you ❤️",
];

const plans = [
  {
    minutes: 20,
    price: 50,
    bonus: 0,
    popular: false,
    label: "Starter",
    emoji: "☕",
    tagline: "Just getting started",
    perMin: "₹2.5/min",
    dim: true,
  },
  {
    minutes: 60,
    price: 100,
    bonus: 10,
    popular: false,
    label: "Value Pack",
    emoji: "💬",
    tagline: "A real conversation",
    perMin: "₹1.7/min",
    dim: false,
  },
  {
    minutes: 600,
    price: 999,
    bonus: 120,
    popular: true,
    label: "Unlimited Connect",
    emoji: "👑",
    tagline: "1 hour/day • 10 days",
    perMin: "₹1.4/min",
    dim: false,
  },
];

const RechargePage = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [hookIdx, setHookIdx] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(2); // default to 999 plan
  const [loading, setLoading] = useState(false);
  const [secs, setSecs] = useState(597); // fake urgency countdown

  useEffect(() => {
    const iv = setInterval(() => setHookIdx((p) => (p + 1) % intimacyHooks.length), 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 597)), 1000);
    return () => clearInterval(iv);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handlePurchase = async () => {
    const plan = plans[selectedPlan];
    if (!session?.user || !profile) return;
    setLoading(true);
    const newBalance = profile.balance_minutes + plan.minutes + plan.bonus;
    const { error } = await (supabase as any)
      .from("user_profiles")
      .update({ balance_minutes: newBalance })
      .eq("user_id", session.user.id);

    if (error) {
      toast.error("Failed to recharge. Try again.");
      setLoading(false);
      return;
    }
    await (supabase as any).from("wallet_transactions").insert({
      user_id: session.user.id,
      type: "credit",
      minutes: plan.minutes + plan.bonus,
      amount: plan.price,
      description: `Recharged ${plan.minutes} min for ₹${plan.price}`,
    });
    await refreshProfile();
    toast.success(`🎉 Added ${plan.minutes + plan.bonus} minutes! She's waiting…`);
    setLoading(false);
    navigate(-1);
  };

  const balance = Math.floor(profile?.balance_minutes || 0);

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-extrabold">Recharge ⚡</h1>
      </div>

      {/* Intimacy Hook Banner */}
      <div className="mx-4 mb-3 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-[1px]">
        <div className="rounded-2xl bg-card px-4 py-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-foreground leading-tight transition-all">
              {intimacyHooks[hookIdx]}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Don't keep her waiting…</p>
          </div>
        </div>
      </div>

      {/* Balance + Social Proof */}
      <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-card border border-border p-3 shadow-card">
          <Clock className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">Your Balance</p>
            <p className="text-base font-extrabold">{balance} min</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-primary/8 border border-primary/20 p-3">
          <Users className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">Online now</p>
            <p className="text-base font-extrabold text-primary">{liveCount} girls</p>
          </div>
        </div>
      </div>

      {/* Urgency timer */}
      <div className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2">
        <Flame className="h-4 w-4 text-destructive" />
        <p className="text-xs font-bold text-destructive">
          Special price expires in <span className="tabular-nums font-extrabold">{fmt(secs)}</span>
        </p>
      </div>

      {/* Plans */}
      <div className="px-4 space-y-3">
        {plans.map((plan, i) => {
          const isSelected = selectedPlan === i;
          const isBest = plan.popular;
          return (
            <button
              key={plan.price}
              onClick={() => setSelectedPlan(i)}
              className={`relative w-full text-left rounded-2xl border-2 transition-all active:scale-[0.98] ${
                isBest
                  ? isSelected
                    ? "border-primary shadow-elevated bg-card scale-[1.01]"
                    : "border-primary/40 bg-card"
                  : isSelected
                  ? "border-border shadow-card bg-card"
                  : "border-transparent bg-card/60"
              } ${plan.dim && !isSelected ? "opacity-60" : "opacity-100"}`}
            >
              {isBest && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="flex items-center gap-1 rounded-full gradient-primary px-4 py-1 text-[10px] font-extrabold text-primary-foreground shadow-lg">
                    <Crown className="h-3 w-3" /> MOST LOVED · BEST VALUE 🔥
                  </span>
                </div>
              )}

              <div className="p-4 pt-5">
                {isBest ? (
                  <>
                    {/* Big 999 hero layout */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{plan.emoji}</span>
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                            {plan.label}
                          </span>
                        </div>
                        <p className="text-3xl font-extrabold leading-none">
                          {plan.minutes}
                          <span className="text-lg ml-1 font-bold text-muted-foreground">min</span>
                        </p>
                        <p className="text-xs text-primary font-bold mt-1">
                          +{plan.bonus} min FREE bonus 🎁
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.tagline}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{plan.perMin}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-[10px] line-through text-muted-foreground">₹1,499</p>
                        <p className="text-3xl font-extrabold text-primary">₹999</p>
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                          Save ₹500
                        </span>
                      </div>
                    </div>

                    {/* Social proof row */}
                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2">
                      <div className="flex -space-x-2">
                        {[...Array(4)].map((_, x) => (
                          <div key={x} className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-accent border border-card" />
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-bold text-foreground">2,847 people</span> chose this plan today
                      </p>
                    </div>

                    {/* Hook lines for 999 */}
                    <div className="mt-3 space-y-1.5">
                      {[
                        { icon: "💬", text: "Unlimited deep conversations for 10 days" },
                        { icon: "❤️", text: "Build real emotional connections, not just chat" },
                        { icon: "🔒", text: "Her exclusive stories & voice notes unlocked" },
                        { icon: "⭐", text: "Priority match with most compatible companions" },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2">
                          <span className="text-sm">{item.icon}</span>
                          <p className="text-[11px] text-foreground font-medium">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{plan.emoji}</span>
                        <p className="text-lg font-bold">{plan.minutes} min</p>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {plan.label}
                        </span>
                      </div>
                      {plan.bonus > 0 && (
                        <p className="text-xs text-accent font-semibold">+{plan.bonus} min bonus</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{plan.perMin}</p>
                    </div>
                    <p className="text-xl font-extrabold">₹{plan.price}</p>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="absolute right-3 top-3 h-5 w-5 rounded-full gradient-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom hook lines */}
      <div className="mx-4 mt-4 rounded-2xl bg-card border border-border p-4 space-y-2">
        <p className="text-xs font-extrabold text-center text-foreground">
          Why people choose the ₹999 plan 💕
        </p>
        {[
          "\"I found my best friend through 10 days of conversations\" — Rahul, 24",
          "\"She remembered every detail I shared. I felt so connected\" — Arjun, 27",
          "\"Best ₹999 I ever spent. Worth every minute\" — Karan, 22",
        ].map((q) => (
          <div key={q} className="flex items-start gap-2">
            <Star className="h-3 w-3 text-accent shrink-0 mt-0.5" fill="currentColor" />
            <p className="text-[10px] text-muted-foreground italic">{q}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 px-6 text-center text-[11px] text-muted-foreground leading-relaxed">
        💡 Extra minutes beyond pack: ₹3–4/min based on companion
      </p>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-20">
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-4 text-base font-extrabold text-primary-foreground shadow-elevated transition-transform active:scale-95 disabled:opacity-70"
        >
          {loading ? (
            <span className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
          ) : (
            <>
              <Zap className="h-5 w-5" />
              {selectedPlan === 2
                ? "Unlock 10 Days of Love ₹999 →"
                : `Recharge ₹${plans[selectedPlan].price} →`}
            </>
          )}
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-1.5 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> Secure payment · Instant activation
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default RechargePage;

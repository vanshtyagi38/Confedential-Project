import { useState } from "react";
import { ArrowLeft, Zap, Clock, CheckCircle2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const plans = [
  {
    id: 0,
    minutes: 20,
    price: 50,
    bonus: 0,
    label: "Starter",
    perMin: "₹2.5/min",
    tagline: "Just enough to say hello",
    features: [],
    highlight: false,
  },
  {
    id: 1,
    minutes: 60,
    price: 100,
    bonus: 10,
    label: "Value Pack",
    perMin: "₹1.7/min",
    tagline: "A real conversation, finally",
    features: ["+10 min free bonus"],
    highlight: false,
  },
  {
    id: 2,
    minutes: 600,
    price: 999,
    bonus: 120,
    label: "10-Day Unlimited",
    perMin: "₹1.4/min",
    tagline: "1 hour/day for 10 days",
    features: [
      "120 bonus minutes free",
      "Deep conversations, every day",
      "Build something real in 10 days",
      "Lowest rate, highest value",
    ],
    highlight: true,
  },
];

const RechargePage = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState(2);
  const [loading, setLoading] = useState(false);

  const balance = Math.floor(profile?.balance_minutes || 0);

  const handlePurchase = async () => {
    const plan = plans[selected];
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
    toast.success(`Added ${plan.minutes + plan.bonus} minutes to your balance`);
    setLoading(false);
    navigate(-1);
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-32">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border transition-colors active:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Recharge Minutes</h1>
      </div>

      {/* Balance Card */}
      <div className="mx-4 mt-1 mb-6 flex items-center gap-4 rounded-2xl bg-card border border-border px-5 py-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/10">
          <Clock className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-extrabold tracking-tight">{balance} <span className="text-base font-medium text-muted-foreground">min</span></p>
        </div>
        {balance < 10 && (
          <span className="ml-auto rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-semibold text-destructive">
            Running low
          </span>
        )}
      </div>

      {/* Subtitle */}
      <p className="px-5 mb-4 text-sm text-muted-foreground leading-relaxed">
        Good conversations take time. Choose a plan and keep the connection going.
      </p>

      {/* Plans */}
      <div className="px-4 space-y-3">

        {/* Small plans row */}
        <div className="grid grid-cols-2 gap-3">
          {plans.filter((p) => !p.highlight).map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`relative rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.97] ${
                selected === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <p className="text-[11px] font-semibold text-muted-foreground mb-2">{plan.label}</p>
              <p className="text-2xl font-extrabold tracking-tight">{plan.minutes}
                <span className="text-sm font-medium text-muted-foreground ml-1">min</span>
              </p>
              {plan.bonus > 0 && (
                <p className="text-[11px] text-accent font-semibold mt-0.5">+{plan.bonus} free</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">{plan.perMin}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <p className="text-lg font-bold">₹{plan.price}</p>
              </div>

              {selected === plan.id && (
                <div className="absolute right-3 top-3">
                  <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Premium 999 plan */}
        {plans.filter((p) => p.highlight).map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.98] ${
              selected === plan.id
                ? "border-primary bg-primary/5"
                : "border-border bg-card"
            }`}
          >
            {/* Badge */}
            <div className="absolute -top-3 left-5">
              <span className="rounded-full gradient-primary px-3.5 py-1 text-[10px] font-bold text-primary-foreground tracking-wide">
                BEST VALUE
              </span>
            </div>

            <div className="flex items-start justify-between pt-1">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">{plan.label}</p>
                <p className="text-4xl font-extrabold tracking-tight mt-0.5">
                  {plan.minutes}
                  <span className="text-xl font-semibold text-muted-foreground ml-1">min</span>
                </p>
                <p className="text-xs text-primary font-semibold mt-1">+{plan.bonus} bonus minutes free</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{plan.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground line-through">₹1,499</p>
                <p className="text-3xl font-extrabold text-primary">₹999</p>
                <p className="text-[11px] font-medium text-accent">{plan.perMin}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 h-px bg-border" />

            {/* Feature list */}
            <div className="space-y-2">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-[12px] text-foreground">{f}</p>
                </div>
              ))}
            </div>

            {selected === plan.id && (
              <div className="absolute right-4 top-4">
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Subtle note */}
      <p className="mt-5 px-5 text-center text-[11px] text-muted-foreground leading-relaxed">
        Extra minutes beyond your plan: ₹3–4/min depending on companion
      </p>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-20">
        <div className="rounded-3xl bg-card/80 backdrop-blur-lg border border-border p-3 shadow-elevated">
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Pay ₹{plans[selected].price} · Add {plans[selected].minutes + plans[selected].bonus} min
              </>
            )}
          </button>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Secure payment · Instant activation</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default RechargePage;

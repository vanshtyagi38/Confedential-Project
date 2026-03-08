import { ArrowLeft, Zap, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const plans = [
  { minutes: 20, price: 50, bonus: 0, popular: false, label: "Starter" },
  { minutes: 60, price: 100, bonus: 10, popular: false, label: "Value Pack" },
  { minutes: 600, price: 999, bonus: 0, popular: true, label: "10-Day Unlimited", subtitle: "1 hour/day for 10 days" },
];

const RechargePage = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();

  const handlePurchase = async (plan: typeof plans[0]) => {
    // For now, add minutes directly (Razorpay integration to be added)
    if (!session?.user || !profile) return;

    const newBalance = profile.balance_minutes + plan.minutes + plan.bonus;
    const { error } = await (supabase as any)
      .from("user_profiles")
      .update({ balance_minutes: newBalance })
      .eq("user_id", session.user.id);

    if (error) {
      toast.error("Failed to recharge. Try again.");
      return;
    }

    // Log transaction
    await (supabase as any).from("wallet_transactions").insert({
      user_id: session.user.id,
      type: "credit",
      minutes: plan.minutes + plan.bonus,
      amount: plan.price,
      description: `Recharged ${plan.minutes} min for ₹${plan.price}`,
    });

    await refreshProfile();
    toast.success(`🎉 Added ${plan.minutes + plan.bonus} minutes!`);
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Recharge Minutes ⚡</h1>
      </div>

      {/* Current balance */}
      <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
        <Clock className="h-6 w-6 text-accent" />
        <div>
          <p className="text-xs text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">{Math.floor(profile?.balance_minutes || 0)} min</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.price}
            onClick={() => handlePurchase(plan)}
            className={`relative flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${
              plan.popular ? "border-primary shadow-elevated" : "bg-card shadow-card"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-4 rounded-full gradient-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                BEST VALUE 🔥
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold">{plan.minutes} min</p>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {plan.label}
                </span>
              </div>
              {plan.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</p>
              )}
              {plan.bonus > 0 && (
                <p className="text-xs text-accent font-semibold">+{plan.bonus} min bonus</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                ₹{(plan.price / plan.minutes).toFixed(1)}/min
              </p>
            </div>
            <div className="flex items-center gap-1.5 gradient-primary rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground">
              <Zap className="h-4 w-4" />
              ₹{plan.price}
            </div>
          </button>
        ))}
      </div>

      <p className="mt-4 px-4 text-center text-xs text-muted-foreground">
        💡 Extra minutes beyond subscription: ₹3-4/min based on companion
      </p>

      <BottomNav />
    </div>
  );
};

export default RechargePage;

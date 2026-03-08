import { ArrowLeft, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const plans = [
  { amount: 50, bonus: 0, popular: false },
  { amount: 100, bonus: 10, popular: false },
  { amount: 250, bonus: 40, popular: true },
  { amount: 500, bonus: 100, popular: false },
];

const RechargePage = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <div className="flex items-center gap-3 px-4 py-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Recharge Wallet</h1>
      </div>

      <div className="px-4 space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.amount}
            className={`relative flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all active:scale-[0.98] ${
              plan.popular ? "border-primary shadow-elevated" : "bg-card shadow-card"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-4 rounded-full gradient-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                BEST VALUE
              </span>
            )}
            <div>
              <p className="text-xl font-bold">₹{plan.amount}</p>
              {plan.bonus > 0 && (
                <p className="text-xs text-accent font-semibold">+₹{plan.bonus} bonus</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 gradient-primary rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground">
              <Zap className="h-4 w-4" />
              Buy
            </div>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default RechargePage;

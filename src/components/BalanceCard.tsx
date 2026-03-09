import { Wallet, Plus, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const BalanceCard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const balance = profile?.balance_minutes || 0;

  return (
    <div className="mx-4 flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
          <Clock className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Chat Balance</p>
          <p className="text-xl font-bold">{Math.floor(balance)} min</p>
        </div>
      </div>
      <button
        onClick={() => navigate("/recharge")}
        className="gradient-primary flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all active:scale-95 hover:brightness-110"
      >
        <Plus className="h-4 w-4" />
        Recharge
      </button>
    </div>
  );
};

export default BalanceCard;

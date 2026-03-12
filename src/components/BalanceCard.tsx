import { Plus, Clock, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import CompanionRegistration from "@/components/CompanionRegistration";

const BalanceCard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const balance = profile?.balance_minutes || 0;
  const [regOpen, setRegOpen] = useState(false);

  return (
    <div className="mx-4 space-y-2.5">
      {/* Recharge Card */}
      <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
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

      {/* List Your Profile Card */}
      <button
        onClick={() => setRegOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl bg-card p-4 shadow-card transition-all active:scale-[0.98] hover:bg-secondary/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">List Your Profile</p>
            <p className="text-[11px] text-muted-foreground">Become a companion & earn</p>
          </div>
        </div>
        <span className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">Apply →</span>
      </button>

      <CompanionRegistration open={regOpen} onClose={() => setRegOpen(false)} />
    </div>
  );
};

export default BalanceCard;

import { Wallet, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BalanceCardProps {
  balance: number;
}

const BalanceCard = ({ balance }: BalanceCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="mx-4 flex items-center justify-between rounded-xl bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <Wallet className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Your Balance</p>
          <p className="text-xl font-bold">₹{balance}</p>
        </div>
      </div>
      <button
        onClick={() => navigate("/recharge")}
        className="gradient-primary flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Recharge
      </button>
    </div>
  );
};

export default BalanceCard;

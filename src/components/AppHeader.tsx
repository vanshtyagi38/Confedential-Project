import { Shield, Zap } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AppHeader = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">

        {/* Logo + Brand */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={logoIcon}
              alt="SingleTape"
              className="h-12 w-12 rounded-xl object-contain"
            />
            {/* Online/active indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-accent" />
          </div>
          <div>
            <h1 className="text-[17px] font-extrabold leading-none tracking-tight">
              <span className="text-foreground">Single</span>
              <span className="text-primary">Tape</span>
            </h1>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Your Vibe, Your Chat ✨
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Safe badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground">
              Safe
            </span>
          </div>

          {/* Balance — single tap to recharge */}
          {profile && (
            <button
              onClick={() => navigate("/recharge")}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
            >
              <Zap className="h-3 w-3" />
              <span>{profile.balance_minutes}m</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default AppHeader;

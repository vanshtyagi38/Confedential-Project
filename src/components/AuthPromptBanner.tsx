import { LogIn, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AuthPromptBanner = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  if (session && profile) return null;

  return (
    <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            Join SingleTape for free
          </p>
          <p className="text-[11px] text-muted-foreground">
            Get 5 free minutes to chat now
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate("/onboarding")}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
      >
        <LogIn className="h-3.5 w-3.5" />
        Sign Up
      </button>
    </div>
  );
};

export default AuthPromptBanner;

import { Shield } from "lucide-react";
import logoIcon from "@/assets/logo-icon.png";

const AppHeader = () => {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5">
        <img src={logoIcon} alt="SingleTape" className="h-9 w-9 rounded-lg" />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            <span className="gradient-primary bg-clip-text text-transparent">SingleTape</span>
          </h1>
          <p className="text-[10px] text-muted-foreground">Your Vibe, Your Chat</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>Safe & Private</span>
      </div>
    </header>
  );
};

export default AppHeader;

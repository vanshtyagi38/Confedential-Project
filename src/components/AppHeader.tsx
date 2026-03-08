import { Shield } from "lucide-react";

const AppHeader = () => {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          <span className="gradient-primary bg-clip-text text-transparent">BaatCheet</span>
        </h1>
        <p className="text-xs text-muted-foreground">Your AI Friend 💬</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>Safe & Private</span>
      </div>
    </header>
  );
};

export default AppHeader;

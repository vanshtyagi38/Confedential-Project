import { Download, Smartphone, Zap, Shield } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const InstallAppBanner = () => {
  const { canInstall, isInstalled, install } = usePWAInstall();

  if (isInstalled) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await install();
    } else {
      // Fallback: show manual instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert("Tap the Share button ↗ then 'Add to Home Screen' to install SingleTape!");
      } else {
        alert("Tap the menu ⋮ in your browser, then 'Install app' or 'Add to Home Screen'!");
      }
    }
  };

  return (
    <div className="mx-4 mt-5 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
      <div className="px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <Download className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">
              📲 Download SingleTape App
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Install our app for the best experience — faster chats, notifications & offline access!
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Zap, label: "Instant Access" },
            { icon: Smartphone, label: "Like Native App" },
            { icon: Shield, label: "100% Safe" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 rounded-xl bg-secondary/50 px-2 py-2">
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleInstall}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:brightness-110"
        >
          <Download className="h-4 w-4" />
          Install Free App
        </button>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          No app store needed · Works on all devices · Free forever
        </p>
      </div>
    </div>
  );
};

export default InstallAppBanner;

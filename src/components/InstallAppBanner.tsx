import { Download, Smartphone, Zap, Shield, Share } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useState } from "react";

const InstallAppBanner = () => {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [showManual, setShowManual] = useState(false);

  if (isInstalled) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleInstall = async () => {
    if (canInstall) {
      setInstalling(true);
      await install();
      setInstalling(false);
    } else {
      setShowManual(true);
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
          disabled={installing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:brightness-110 disabled:opacity-70"
        >
          <Download className="h-4 w-4" />
          {installing ? "Installing..." : "Install Free App"}
        </button>

        {showManual && !canInstall && (
          <div className="mt-3 rounded-xl bg-secondary/50 p-3 text-xs text-foreground leading-relaxed">
            {isIOS ? (
              <p>Tap the <Share className="inline h-3.5 w-3.5 text-primary" /> <strong>Share</strong> button → then "<strong>Add to Home Screen</strong>"</p>
            ) : (
              <p>Tap the <strong>⋮</strong> menu → then "<strong>Install app</strong>" or "<strong>Add to Home Screen</strong>"</p>
            )}
          </div>
        )}

        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          No app store needed · Works on all devices · Free forever
        </p>
      </div>
    </div>
  );
};

export default InstallAppBanner;

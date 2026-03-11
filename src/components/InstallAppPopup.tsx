import { Download, Smartphone, Share } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useState } from "react";

interface InstallAppPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InstallAppPopup = ({ open, onOpenChange }: InstallAppPopupProps) => {
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  // Don't show if already installed
  if (isInstalled) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleInstall = async () => {
    if (canInstall) {
      setInstalling(true);
      const accepted = await install();
      setInstalling(false);
      if (accepted) {
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-3xl border-primary/20 bg-card p-0 overflow-hidden gap-0 left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogTitle className="sr-only">Install SingleTape App</DialogTitle>

        <div className="flex flex-col items-center px-6 pt-6 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <Smartphone className="h-8 w-8 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">
            Don't miss any messages! 💬
          </h3>
          <p className="mt-2 text-center text-sm text-muted-foreground leading-relaxed">
            Install SingleTape for <span className="font-semibold text-primary">faster chats</span>, instant notifications, and a smoother experience ✨
          </p>
        </div>

        <div className="px-6 pb-4 space-y-2">
          {canInstall ? (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:brightness-110 disabled:opacity-70"
            >
              <Download className="h-5 w-5" />
              {installing ? "Installing..." : "Install App – It's Free!"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl bg-secondary/50 p-4 text-sm text-foreground leading-relaxed">
                {isIOS ? (
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-primary">To install on iPhone/iPad:</p>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                      <span>Tap the <Share className="inline h-4 w-4 text-primary" /> Share button</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                      <span>Tap "<strong>Add to Home Screen</strong>"</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="font-semibold text-primary">To install:</p>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                      <span>Tap the <strong>⋮</strong> menu in your browser</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                      <span>Tap "<strong>Install app</strong>" or "<strong>Add to Home Screen</strong>"</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallAppPopup;

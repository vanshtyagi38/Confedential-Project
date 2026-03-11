import { Download, X, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface InstallAppPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InstallAppPopup = ({ open, onOpenChange }: InstallAppPopupProps) => {
  const { canInstall, install } = usePWAInstall();

  const handleInstall = async () => {
    if (canInstall) {
      await install();
      onOpenChange(false);
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert("Tap the Share button ↗ then 'Add to Home Screen' to install SingleTape!");
      } else {
        alert("Tap the menu ⋮ in your browser, then 'Install app' or 'Add to Home Screen'!");
      }
      onOpenChange(false);
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
          <button
            onClick={handleInstall}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:brightness-110"
          >
            <Download className="h-5 w-5" />
            Install App – It's Free!
          </button>
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

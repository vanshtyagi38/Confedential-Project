import { useState } from "react";
import { Copy, Share2, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  referralCode: string;
  referralLink: string;
};

const InvitePopup = ({ open, onClose, referralCode, referralLink }: Props) => {
  const [copying, setCopying] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopying(true);
      toast.success("Link copied! 🔗");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      toast.error("Couldn't copy — try manually");
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Come chat with me!",
          text: "Try this app — you'll love it 💕",
          url: referralLink,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Hey! I found this amazing app. Join with my link and get 5 free minutes! 🎉 ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(`Hey! Join SingleTape and get 5 free minutes! 🎉`);
    const url = encodeURIComponent(referralLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const shareInstagram = () => {
    copyLink();
    toast.info("Link copied! Paste it in your Instagram DM or story 📸");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="mx-4 max-w-sm rounded-3xl border-primary/20 bg-card p-0 overflow-hidden">
        <div className="gradient-primary px-6 py-5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Invite Your Friend or Crush 💕
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-xs text-white/80">
            They'll never know it was you... unless you want them to 😏
          </p>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-4">
          {/* Social share buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-green-500/10 py-3 text-xs font-semibold transition-all active:scale-95"
            >
              <span className="text-2xl">💬</span>
              <span className="text-green-600">WhatsApp</span>
            </button>
            <button
              onClick={shareTelegram}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-blue-500/10 py-3 text-xs font-semibold transition-all active:scale-95"
            >
              <span className="text-2xl">✈️</span>
              <span className="text-blue-500">Telegram</span>
            </button>
            <button
              onClick={shareInstagram}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-pink-500/10 py-3 text-xs font-semibold transition-all active:scale-95"
            >
              <span className="text-2xl">📸</span>
              <span className="text-pink-500">Instagram</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary py-3 text-xs font-semibold transition-all active:scale-95"
            >
              <Copy className="h-3.5 w-3.5" />
              {copying ? "Copied! ✅" : "Copy Link"}
            </button>
            <button
              onClick={shareLink}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl gradient-primary py-3 text-xs font-bold text-primary-foreground transition-all active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60">
            Each signup = 1 free spin for you 🎡
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvitePopup;

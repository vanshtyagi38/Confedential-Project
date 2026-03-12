import { useState } from "react";
import { Copy, Share2, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Brand logo SVGs
const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const SmsLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
  </svg>
);

type Props = {
  open: boolean;
  onClose: () => void;
  referralCode: string;
  referralLink: string;
};

const taglines = [
  "Invite your crush 💕",
  "Find your true love, invite now 💘",
  "Invite your college mate now 🎓",
  "Share with someone special ✨",
  "Invite your bestie 👯",
];

const InvitePopup = ({ open, onClose, referralCode, referralLink }: Props) => {
  const [copying, setCopying] = useState(false);
  const [currentTagline, setCurrentTagline] = useState(0);

  // Rotate tagline on open
  useState(() => {
    if (open) {
      setCurrentTagline(Math.floor(Math.random() * taglines.length));
    }
  });

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
    const text = encodeURIComponent(`${taglines[currentTagline]}\n\nJoin with my link and get 5 free minutes! 🎉\n${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(taglines[currentTagline]);
    const url = encodeURIComponent(referralLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const shareInstagram = () => {
    copyLink();
    toast.info("Link copied! Paste it in your Instagram story or DM 📸");
  };

  const shareSms = () => {
    const text = encodeURIComponent(`${taglines[currentTagline]} Join SingleTape and get 5 free minutes! ${referralLink}`);
    window.open(`sms:?&body=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="mx-4 max-w-sm rounded-3xl border-primary/20 bg-white p-0 overflow-hidden shadow-2xl">
        {/* Gradient Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-primary" />
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-transparent to-orange-500/20" />
          
          <div className="relative px-6 py-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                {taglines[currentTagline]}
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-white/90 font-medium">
              They'll never know it was you... unless you want them to 😉
            </p>
          </div>
          
          {/* Decorative bottom curve */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-white rounded-t-3xl" />
        </div>

        <div className="space-y-5 px-6 pb-6 pt-2">
          {/* Social share buttons with real logos */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareWhatsApp}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-[#25D366]/10 py-4 text-sm font-semibold transition-all hover:bg-[#25D366]/20 active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-transform group-hover:scale-110">
                <WhatsAppLogo />
              </div>
              <span className="text-[#128C7E]">WhatsApp</span>
            </button>
            
            <button
              onClick={shareTelegram}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-[#229ED9]/10 py-4 text-sm font-semibold transition-all hover:bg-[#229ED9]/20 active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#229ED9] text-white shadow-lg shadow-[#229ED9]/30 transition-transform group-hover:scale-110">
                <TelegramLogo />
              </div>
              <span className="text-[#229ED9]">Telegram</span>
            </button>
            
            <button
              onClick={shareInstagram}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 py-4 text-sm font-semibold transition-all hover:from-purple-500/20 hover:to-pink-500/20 active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/30 transition-transform group-hover:scale-110">
                <InstagramLogo />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Instagram</span>
            </button>
            
            <button
              onClick={shareSms}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-blue-500/10 py-4 text-sm font-semibold transition-all hover:bg-blue-500/20 active:scale-95"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
                <SmsLogo />
              </div>
              <span className="text-blue-600">Text Message</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">or</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyLink}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border bg-secondary/50 py-3.5 text-sm font-semibold transition-all hover:bg-secondary hover:border-primary/30 active:scale-95"
            >
              <Copy className="h-4 w-4" />
              {copying ? "Copied! ✨" : "Copy Link"}
            </button>
            <button
              onClick={shareLink}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          {/* Reward info */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-3 text-center border border-amber-100">
            <p className="text-xs font-semibold text-amber-700">
              🎁 Each signup = 1 free spin for you
            </p>
            <p className="text-[10px] text-amber-600/80 mt-0.5">
              They get 5 free minutes too!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvitePopup;

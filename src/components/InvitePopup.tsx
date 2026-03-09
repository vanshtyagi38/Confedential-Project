import { useState } from "react";
import { Copy, Share2, Mail, X, Heart } from "lucide-react";
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
  const [email, setEmail] = useState("");
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

  const sendEmail = () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    const subject = encodeURIComponent("You gotta try this 💕");
    const body = encodeURIComponent(
      `Hey! I found this cool app and thought you'd love it. Check it out: ${referralLink}`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
    toast.success("Opening email...");
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="mx-4 max-w-sm rounded-3xl border-primary/20 bg-card p-0 overflow-hidden">
        {/* Header gradient */}
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
          {/* Email invite */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Drop their email (we won't tell 🤫)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="crush@example.com"
                className="flex-1 rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              <button
                onClick={sendEmail}
                className="flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground active:scale-95 transition-transform"
              >
                <Mail className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Copy link */}
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

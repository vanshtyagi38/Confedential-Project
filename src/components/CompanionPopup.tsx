import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Lock, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Companion } from "@/data/companions";
import { useAuth } from "@/contexts/AuthContext";

const popupMessagesFemale = [
  "Hey! 😊 Tumhari profile dekhi... interesting lagte ho. Chat karein?",
  "Hi there! 💕 You seem fun. Wanna talk?",
  "Hey cutie! 😏 I'm bored... let's chat?",
  "Hiii! ✨ I just joined. Be my first chat buddy?",
  "Hey! 🥰 Tumse baat karni hai... reply karo na?",
  "Hi! 😘 You look interesting. Let's vibe together?",
  "Heyyy! 💫 Maine tumhe choose kiya. Chat karoge?",
  "Hey! 🌙 Can't sleep... wanna keep me company?",
];

const popupMessagesMale = [
  "Hey! 😊 Tumhari profile dekhi... interesting lagti ho. Chat karein?",
  "Hi there! 💕 You seem fun. Wanna talk?",
  "Hey cutie! 😏 I'm bored... let's chat?",
  "Hiii! ✨ I just joined. Be my first chat buddy?",
  "Hey! 🥰 Tumse baat karni hai... reply karo na?",
  "Hi! 😘 You look interesting. Let's vibe together?",
  "Heyyy! 💫 Maine tumhe choose kiya. Chat karogi?",
  "Hey! 🌙 Can't sleep... wanna keep me company?",
];

const CompanionPopup = ({ companions }: { companions: Companion[] }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!companions.length) return;
    const delay = (Math.random() * 3 + 3) * 1000;
    const timer = setTimeout(() => {
      const preferredGender = profile?.preferred_gender || "female";
      const matchedCompanions = companions.filter((c) => c.gender === preferredGender);
      if (!matchedCompanions.length) return;
      const randomCompanion = matchedCompanions[Math.floor(Math.random() * matchedCompanions.length)];
      const msgs = randomCompanion.gender === "female" ? popupMessagesFemale : popupMessagesMale;
      const randomMessage = msgs[Math.floor(Math.random() * msgs.length)];
      setCompanion(randomCompanion);
      setMessage(randomMessage);
      setOpen(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [companions, profile]);

  if (!companion) return null;

  const handleReply = () => {
    setOpen(false);
    navigate(`/chat/${companion.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[340px] rounded-3xl border-primary/20 bg-card p-0 overflow-hidden gap-0 left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogTitle className="sr-only">Chat with {companion.name}</DialogTitle>
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div className="relative">
            <img src={companion.image} alt={companion.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">{companion.name}</h3>
            <p className="text-xs font-medium text-green-500">Online now ✨</p>
          </div>
        </div>
        <div className="px-5 pb-4">
          <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
            <p className="text-sm text-foreground leading-relaxed">{message}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Just now</p>
          </div>
        </div>
        <div className="px-5 pb-4">
          <button onClick={handleReply} className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-4 text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.97] hover:brightness-110">
            <MessageCircle className="h-5 w-5" />
            Reply to {companion.name}
          </button>
        </div>
        <div className="flex flex-col items-center gap-1.5 px-5 pb-5">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Encrypted</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> 100% Private</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
            🔒 Nobody can see your chats. Fully encrypted & private.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanionPopup;

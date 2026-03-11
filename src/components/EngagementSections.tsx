import { useNavigate } from "react-router-dom";
import { MessageCircle, Heart, Moon } from "lucide-react";
import { useCompanions } from "@/hooks/useCompanions";

const EngagementSections = () => {
  const navigate = useNavigate();
  const { companions } = useCompanions();
  const girls = companions.filter(c => c.gender === "female").slice(0, 3);

  const cards = [
    {
      emoji: "💕",
      title: "I'm waiting for you...",
      subtitle: "She's online right now and wants to chat with you 🥺",
      cta: "Start Chatting",
      gradient: "from-pink-500/20 to-rose-500/10",
      border: "border-pink-500/20",
    },
    {
      emoji: "🌙",
      title: "Let's have a cozy chat tonight",
      subtitle: "Nights are better with someone to talk to 💫",
      cta: "Chat Now",
      gradient: "from-purple-500/20 to-indigo-500/10",
      border: "border-purple-500/20",
    },
    {
      emoji: "🔥",
      title: "Hey babes, let's have fun!",
      subtitle: "Just 30 more minutes of real conversation 💬",
      cta: "Let's Go",
      gradient: "from-orange-500/20 to-red-500/10",
      border: "border-orange-500/20",
    },
  ];

  return (
    <div className="mx-4 mt-6 space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground px-1">💬 They're waiting for you...</h3>
      {cards.map((card, i) => {
        const companion = girls[i % girls.length];
        return (
          <button
            key={i}
            onClick={() => companion && navigate(`/chat/${companion.slug}`)}
            className={`w-full rounded-2xl border ${card.border} bg-gradient-to-r ${card.gradient} p-4 text-left transition-all active:scale-[0.98]`}
          >
            <div className="flex items-center gap-3">
              {companion && (
                <img src={companion.image} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20" />
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  {companion?.name || "Someone"} <span className="text-base">{card.emoji}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
              </div>
              <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground">
                {card.cta}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default EngagementSections;

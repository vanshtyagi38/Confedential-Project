import { Plus, Clock, UserPlus, Heart, Gift, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import CompanionRegistration from "@/components/CompanionRegistration";
import InvitePopup from "@/components/InvitePopup";

const BalanceCard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const balance = profile?.balance_minutes || 0;
  const [regOpen, setRegOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>();

  const cards = [
    {
      id: "list",
      icon: <UserPlus className="h-5 w-5 text-primary" />,
      iconBg: "bg-primary/10",
      title: "List Your Profile",
      subtitle: "Become a companion & earn",
      cta: "Apply →",
      ctaClass: "bg-primary/10 text-primary",
      onClick: () => setRegOpen(true),
    },
    {
      id: "recharge",
      icon: <Clock className="h-5 w-5 text-accent" />,
      iconBg: "bg-secondary",
      title: "Recharge Now",
      subtitle: `Balance: ${Math.floor(balance)} min`,
      cta: "Top Up →",
      ctaClass: "bg-accent/10 text-accent",
      onClick: () => navigate("/recharge"),
    },
    {
      id: "invite",
      icon: <Heart className="h-5 w-5 text-destructive" />,
      iconBg: "bg-destructive/10",
      title: "Invite Your Crush",
      subtitle: "Share & earn free minutes",
      cta: "Invite →",
      ctaClass: "bg-destructive/10 text-destructive",
      onClick: () => setInviteOpen(true),
    },
    {
      id: "offer",
      icon: <Gift className="h-5 w-5 text-accent" />,
      iconBg: "bg-accent/10",
      title: "Recharge Offer",
      subtitle: "Get 50% extra on first recharge",
      cta: "Grab →",
      ctaClass: "bg-accent/10 text-accent",
      onClick: () => navigate("/recharge"),
    },
  ];

  const scrollTo = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const child = container.children[index] as HTMLElement;
    if (child) {
      container.scrollTo({ left: child.offsetLeft - 16, behavior: "smooth" });
    }
    setActiveIndex(index);
  }, []);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    const start = () => {
      timerRef.current = window.setInterval(() => {
        setActiveIndex((prev) => {
          const next = (prev + 1) % cards.length;
          scrollTo(next);
          return next;
        });
      }, 4000);
    };
    start();
    return () => clearInterval(timerRef.current);
  }, [cards.length, scrollTo]);

  // Pause auto-scroll on touch
  const pauseAutoScroll = () => clearInterval(timerRef.current);
  const resumeAutoScroll = () => {
    clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % cards.length;
        scrollTo(next);
        return next;
      });
    }, 4000);
  };

  const referralCode = profile?.referral_code || "";
  const referralLink = `https://singletape.com?ref=${referralCode}`;

  return (
    <div className="mx-4 space-y-2">
      {/* Auto-scrolling cards */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory"
        onTouchStart={pauseAutoScroll}
        onTouchEnd={resumeAutoScroll}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            className="flex min-w-[85%] snap-start items-center justify-between rounded-2xl bg-card p-4 shadow-card transition-all active:scale-[0.98] hover:bg-secondary/30 shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                {card.icon}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{card.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>
              </div>
            </div>
            <span className={`rounded-xl px-3 py-1.5 text-xs font-bold ${card.ctaClass} shrink-0`}>
              {card.cta}
            </span>
          </button>
        ))}
      </div>

      <CompanionRegistration open={regOpen} onClose={() => setRegOpen(false)} />
      <InvitePopup
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        referralCode={referralCode}
        referralLink={referralLink}
      />
    </div>
  );
};

export default BalanceCard;

import { Clock, UserPlus, Heart, Gift } from "lucide-react";
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
      icon: <UserPlus className="h-6 w-6 text-primary" />,
      iconBg: "bg-gradient-to-br from-primary/15 to-primary/5",
      title: "List Your Profile",
      subtitle: "Become a companion & earn",
      cta: "Apply →",
      ctaClass: "bg-primary text-primary-foreground shadow-sm",
      gradientBg: "from-primary/8 via-card to-card",
      onClick: () => setRegOpen(true),
    },
    {
      id: "recharge",
      icon: <Clock className="h-6 w-6 text-accent" />,
      iconBg: "bg-gradient-to-br from-accent/15 to-accent/5",
      title: "Recharge Now",
      subtitle: `Balance: ${Math.floor(balance)} min`,
      cta: "Top Up →",
      ctaClass: "bg-accent text-white shadow-sm",
      gradientBg: "from-accent/8 via-card to-card",
      onClick: () => navigate("/recharge"),
    },
    {
      id: "invite",
      icon: <Heart className="h-6 w-6 text-destructive" />,
      iconBg: "bg-gradient-to-br from-destructive/15 to-destructive/5",
      title: "Invite Your Crush",
      subtitle: "Share & earn free minutes",
      cta: "Invite →",
      ctaClass: "bg-destructive text-white shadow-sm",
      gradientBg: "from-destructive/8 via-card to-card",
      onClick: () => setInviteOpen(true),
    },
    {
      id: "offer",
      icon: <Gift className="h-6 w-6 text-accent" />,
      iconBg: "bg-gradient-to-br from-accent/15 to-accent/5",
      title: "Recharge Offer",
      subtitle: "Get 50% extra on first recharge",
      cta: "Grab →",
      ctaClass: "bg-accent text-white shadow-sm",
      gradientBg: "from-accent/8 via-card to-card",
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
    <div className="mx-4 mt-2">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory"
        onTouchStart={pauseAutoScroll}
        onTouchEnd={resumeAutoScroll}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            className={`flex min-w-[88%] snap-start items-center justify-between rounded-[18px] bg-gradient-to-r ${card.gradientBg} border border-border/40 p-5 shadow-[0_2px_16px_-4px_hsl(var(--primary)/0.1)] transition-all duration-300 active:scale-[0.97] hover:shadow-[0_4px_24px_-4px_hsl(var(--primary)/0.15)] shrink-0`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} shadow-sm`}>
                {card.icon}
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
              </div>
            </div>
            <span className={`rounded-xl px-4 py-2 text-xs font-bold ${card.ctaClass} shrink-0 transition-transform duration-200 hover:scale-105`}>
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

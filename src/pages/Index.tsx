import { useState, useMemo, useEffect } from "react";
import PageSEO from "@/components/PageSEO";
import { Helmet } from "react-helmet-async";
import { Heart, Sparkles, Users, Circle, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BalanceCard from "@/components/BalanceCard";
import CompanionCard from "@/components/CompanionCard";
import FilterSheet from "@/components/FilterSheet";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import CompanionPopup from "@/components/CompanionPopup";
import { useCompanions } from "@/hooks/useCompanions";
import Footer from "@/components/Footer";
import EngagementSections from "@/components/EngagementSections";
import InstallAppBanner from "@/components/InstallAppBanner";
import ActiveNow from "@/components/ActiveNow";
import ActiveUsers from "@/components/ActiveUsers";
import { supabase } from "@/integrations/supabase/client";
import GoogleOneTap from "@/components/GoogleOneTap";

function shuffleArray<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type PresenceMap = Record<string, { is_online: boolean; last_seen: string }>;

const Index = () => {
  const { profile } = useAuth();
  const { companions, loading } = useCompanions();
  const [filter, setFilter] = useState("All");
  const [activeUsers, setActiveUsers] = useState(28900);
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});

  // Fetch presence data
  useEffect(() => {
    const loadPresence = async () => {
      const { data } = await (supabase as any).from("user_presence").select("*");
      if (data) {
        const map: PresenceMap = {};
        data.forEach((p: any) => { map[p.user_id] = { is_online: p.is_online, last_seen: p.last_seen }; });
        setPresenceMap(map);
      }
    };
    loadPresence();

    // Subscribe to presence changes
    const channel = supabase
      .channel("presence-grid")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, (payload: any) => {
        const p = payload.new;
        if (p) {
          setPresenceMap(prev => ({ ...prev, [p.user_id]: { is_online: p.is_online, last_seen: p.last_seen } }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Active user count changes every 1-5 seconds
  useEffect(() => {
    const tick = () => {
      setActiveUsers((prev) => {
        const delta = Math.floor(Math.random() * 301) - 150;
        return Math.max(28400, Math.min(29400, prev + delta));
      });
      const next = (Math.random() * 4 + 1) * 1000;
      timeout = window.setTimeout(tick, next);
    };
    let timeout = window.setTimeout(tick, (Math.random() * 2 + 0.5) * 1000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const tick = () => {
      setShuffleSeed(Date.now());
      const next = (Math.random() * 420 + 180) * 1000;
      timeout = window.setTimeout(tick, next);
    };
    let timeout = window.setTimeout(tick, (Math.random() * 420 + 180) * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const getCompanionOnlineStatus = (companion: any) => {
    if (!companion.isRealUser || !companion.ownerUserId) {
      // AI companions: randomized online status
      return { isOnline: true, lastSeen: undefined };
    }
    const p = presenceMap[companion.ownerUserId];
    return {
      isOnline: p?.is_online || false,
      lastSeen: p?.last_seen,
    };
  };

  const matchedCompanions = useMemo(() => {
    const base = profile
      ? companions.filter((c) => c.gender === profile.preferred_gender)
      : companions;

    // Sort: online first, then shuffle within groups
    const online = base.filter(c => {
      const status = getCompanionOnlineStatus(c);
      return status.isOnline;
    });
    const offline = base.filter(c => {
      const status = getCompanionOnlineStatus(c);
      return !status.isOnline;
    });

    return [...shuffleArray(online, shuffleSeed), ...shuffleArray(offline, shuffleSeed + 1)];
  }, [profile, companions, shuffleSeed, presenceMap]);

  const filtered = filter === "All" ? matchedCompanions : matchedCompanions.filter((c) => c.tag === filter);
  const bestMatches = matchedCompanions.slice(0, 4);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-24">
      <PageSEO title="SingleTape – Chat with Crush | Anonymous Chat App" description="India's most fun private chat platform. Talk to amazing people, stay anonymous, stay safe." path="/" />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "What is SingleTape?", acceptedAnswer: { "@type": "Answer", text: "SingleTape is India's most fun private chat platform where you can talk to amazing people, stay anonymous, and stay safe." } },
            { "@type": "Question", name: "Is SingleTape free to use?", acceptedAnswer: { "@type": "Answer", text: "Yes! You get free minutes when you sign up. You can earn more minutes through referrals, daily streaks, and spin rewards." } },
            { "@type": "Question", name: "Is my identity safe on SingleTape?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Your real identity is never shared. You chat anonymously and only share what you choose to." } },
            { "@type": "Question", name: "How do I earn free minutes?", acceptedAnswer: { "@type": "Answer", text: "Refer friends to earn 5 free minutes per referral. Maintain daily streaks and spin the reward wheel for bonus minutes." } }
          ]
        })}</script>
      </Helmet>
      <AppHeader />
      <BalanceCard />
      

      <div className="mx-4 mt-3 flex items-center justify-center gap-2 rounded-[16px] border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 px-4 py-2.5 shadow-[0_1px_8px_-2px_hsl(var(--primary)/0.08)]">
        <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 animate-pulse-soft" />
        <span className="text-sm font-semibold text-foreground">
          <span className="text-primary">{activeUsers.toLocaleString()}</span> active users online
        </span>
        <Users className="h-4 w-4 text-primary/60" />
      </div>

      <ActiveNow companions={matchedCompanions} presenceMap={presenceMap} />
      <ActiveUsers />

      <div className="mt-5 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">Best Matches for You 🔥</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Based on your age & preferences</p>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {bestMatches.map((companion, i) => {
          const status = getCompanionOnlineStatus(companion);
          return (
            <div key={companion.id} className="w-36 shrink-0">
              <CompanionCard companion={companion} index={i} compact isOnline={status.isOnline} lastSeen={status.lastSeen} />
            </div>
          );
        })}
      </div>

      <div className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">All Companions</h2>
          </div>
          <FilterSheet activeFilter={filter} onFilterChange={setFilter} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Someone fun is waiting to talk to you 💬</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
        {filtered.map((companion, i) => {
          const status = getCompanionOnlineStatus(companion);
          return (
            <CompanionCard key={companion.id} companion={companion} index={i} isOnline={status.isOnline} lastSeen={status.lastSeen} />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <p>No companions match this filter.</p>
        </div>
      )}

      <InstallAppBanner />
      <EngagementSections />
      <Footer />
      <CompanionPopup companions={companions} />
      <GoogleOneTap />
      <BottomNav />
    </div>
  );
};

export default Index;

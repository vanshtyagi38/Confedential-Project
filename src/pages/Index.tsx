import { useState, useMemo, useEffect, useCallback } from "react";
import { Heart, Sparkles, Users, Circle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BalanceCard from "@/components/BalanceCard";
import CompanionCard from "@/components/CompanionCard";
import FilterSheet from "@/components/FilterSheet";
import BottomNav from "@/components/BottomNav";
import { companions } from "@/data/companions";
import { useAuth } from "@/contexts/AuthContext";
import CompanionPopup from "@/components/CompanionPopup";

const Index = () => {
  const { profile } = useAuth();
  const [filter, setFilter] = useState("All");
  const [activeUsers, setActiveUsers] = useState(28900);

  useEffect(() => {
    const tick = () => {
      setActiveUsers((prev) => {
        const delta = Math.floor(Math.random() * 201) - 100; // -100 to +100
        return Math.max(28400, Math.min(29400, prev + delta));
      });
      const next = (Math.random() * 57 + 3) * 1000; // 3–60s
      timeout = window.setTimeout(tick, next);
    };
    let timeout = window.setTimeout(tick, (Math.random() * 5 + 2) * 1000);
    return () => clearTimeout(timeout);
  }, []);

  const matchedCompanions = useMemo(() => {
    if (!profile) return companions;
    // Filter by preferred gender
    const preferred = companions.filter((c) => c.gender === profile.preferred_gender);
    // Sort by age proximity (best match first)
    return preferred.sort((a, b) => Math.abs(a.age - profile.age) - Math.abs(b.age - profile.age));
  }, [profile]);

  const filtered = filter === "All" ? matchedCompanions : matchedCompanions.filter((c) => c.tag === filter);

  // Get best matches (top 4 closest in age)
  const bestMatches = matchedCompanions.slice(0, 4);

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-24">
      <AppHeader />
      <BalanceCard />

      {/* Active Users Banner */}
      <div className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5">
        <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 animate-pulse-soft" />
        <span className="text-sm font-semibold text-foreground">
          <span className="text-primary">{activeUsers.toLocaleString()}</span> active users online
        </span>
        <Users className="h-4 w-4 text-primary/60" />
      </div>

      {/* Best Matches */}
      <div className="mt-5 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">Best Matches for You 🔥</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Based on your age & preferences
        </p>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
        {bestMatches.map((companion, i) => (
          <div key={companion.id} className="w-36 shrink-0">
            <CompanionCard companion={companion} index={i} compact />
          </div>
        ))}
      </div>

      {/* All Companions */}
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">All Companions</h2>
          </div>
          <FilterSheet activeFilter={filter} onFilterChange={setFilter} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Someone fun is waiting to talk to you 💬
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
        {filtered.map((companion, i) => (
          <CompanionCard key={companion.id} companion={companion} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <p>No companions match this filter.</p>
        </div>
      )}

      <CompanionPopup />
      <BottomNav />
    </div>
  );
};

export default Index;

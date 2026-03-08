import { useState, useMemo } from "react";
import { Heart, Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BalanceCard from "@/components/BalanceCard";
import CompanionCard from "@/components/CompanionCard";
import FilterSheet from "@/components/FilterSheet";
import BottomNav from "@/components/BottomNav";
import { companions } from "@/data/companions";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { profile } = useAuth();
  const [filter, setFilter] = useState("All");

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
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <AppHeader />
      <BalanceCard />

      {/* Best Matches */}
      <div className="mt-6 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">Best Matches for You 🔥</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Based on your age & preferences
        </p>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
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

      <div className="mt-4 grid grid-cols-2 gap-3 px-4">
        {filtered.map((companion, i) => (
          <CompanionCard key={companion.id} companion={companion} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 text-center text-muted-foreground">
          <p>No companions match this filter.</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Index;

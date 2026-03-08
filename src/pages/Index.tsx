import { useState } from "react";
import { Heart } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BalanceCard from "@/components/BalanceCard";
import CompanionCard from "@/components/CompanionCard";
import FilterSheet from "@/components/FilterSheet";
import BottomNav from "@/components/BottomNav";
import { companions } from "@/data/companions";

const Index = () => {
  const [filter, setFilter] = useState("All");
  const [balance] = useState(50);

  const filtered = filter === "All" ? companions : companions.filter((c) => c.tag === filter);

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <AppHeader />
      <BalanceCard balance={balance} />

      <div className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Choose Your Companion</h2>
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

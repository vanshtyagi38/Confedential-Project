import { useState, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import { Flame, MapPin, MessageCircle, Circle } from "lucide-react";
import { Companion } from "@/data/companions";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type PresenceMap = Record<string, { is_online: boolean; last_seen: string }>;

interface ActiveNowProps {
  companions: Companion[];
  presenceMap: PresenceMap;
}

const ActiveNow = ({ companions, presenceMap }: ActiveNowProps) => {
  const navigate = useNavigate();
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);

  // Stable seed to avoid re-randomization on every render
  const [shuffleSeed] = useState(() => Date.now());

  const activeCompanions = useMemo(() => {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;

    const filtered = companions.filter((c) => {
      if (!c.isRealUser || !c.ownerUserId) return true;
      const p = presenceMap[c.ownerUserId];
      if (!p) return false;
      if (p.is_online) return true;
      return now - new Date(p.last_seen).getTime() < tenMinutes;
    });

    // Deterministic shuffle using seed
    const shuffled = [...filtered];
    let s = shuffleSeed;
    for (let i = shuffled.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 15);
  }, [companions, presenceMap, shuffleSeed]);

  if (activeCompanions.length === 0) return null;

  return (
    <>
      <div className="mt-5 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-bold">Active Now</h2>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {activeCompanions.map((companion) => (
            <button
              key={companion.id}
              onClick={() => setSelectedCompanion(companion)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              {/* Avatar with gradient ring */}
              <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[hsl(346,80%,60%)] to-[hsl(346,70%,72%)] shadow-[0_2px_12px_-2px_hsl(346,80%,60%,0.35)]">
                <div className="h-[62px] w-[62px] rounded-full border-[2.5px] border-background overflow-hidden transition-transform duration-200 group-hover:scale-105">
                  <img
                    src={companion.image}
                    alt={companion.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Online pulse dot */}
                <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 animate-pulse-soft" />
              </div>
              <span className="text-[11px] font-medium text-foreground max-w-[68px] truncate">
                {companion.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Preview Modal */}
      <Dialog open={!!selectedCompanion} onOpenChange={() => setSelectedCompanion(null)}>
        <DialogContent className="w-[340px] max-w-[92vw] rounded-[20px] p-0 overflow-hidden border-border/40 shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.2)]">
          <DialogTitle className="sr-only">{selectedCompanion?.name}</DialogTitle>
          {selectedCompanion && (
            <>
              {/* Hero image */}
              <div className="relative h-56 w-full">
                <img
                  src={selectedCompanion.image}
                  alt={selectedCompanion.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {selectedCompanion.name}, {selectedCompanion.age}
                    </h3>
                    <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 animate-pulse-soft" />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-white/80 text-xs">
                    <MapPin className="h-3 w-3" />
                    <span>{selectedCompanion.city}</span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 pt-3 pb-4 space-y-3">
                {selectedCompanion.bio && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {selectedCompanion.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {selectedCompanion.tag && (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      {selectedCompanion.tag}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                    {selectedCompanion.languages}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedCompanion(null);
                    navigate(`/chat/${selectedCompanion.slug}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.4)] transition-all duration-200 hover:shadow-[0_6px_24px_-4px_hsl(var(--primary)/0.5)] active:scale-[0.97]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Start Chat
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActiveNow;

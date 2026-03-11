import { MapPin, Languages, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Companion } from "@/data/companions";

interface CompanionCardProps {
  companion: Companion;
  index: number;
  compact?: boolean;
}

const CompanionCard = ({ companion, index, compact }: CompanionCardProps) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div
        onClick={() => navigate(`/chat/${companion.id}`)}
        className="animate-fade-in-up cursor-pointer overflow-hidden rounded-2xl bg-card shadow-card transition-all active:scale-95 hover:shadow-elevated"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={companion.image} alt={companion.name} className="h-full w-full object-cover scale-105 hover:scale-110 transition-transform duration-500" loading="lazy" />
          <div className="gradient-card-overlay absolute inset-0" />
          {/* Online dot */}
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-green-500/90 px-1.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-soft" />
            <span className="text-[8px] font-bold text-white">LIVE</span>
          </div>
          <div className="absolute bottom-2 left-2">
            <p className="text-sm font-bold text-primary-foreground drop-shadow-md">{companion.name}, {companion.age}</p>
            <p className="text-[10px] text-primary-foreground/80 drop-shadow-md">{companion.city}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in-up overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elevated transition-all"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={companion.image} alt={companion.name} className="h-full w-full object-cover" loading="lazy" />
        <div className="gradient-card-overlay absolute inset-0" />
        <span className="absolute right-2 top-2 rounded-full gradient-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
          {companion.tag}
        </span>
        <div className="absolute bottom-3 left-3">
          <h3 className="text-lg font-bold text-primary-foreground">
            {companion.name}, {companion.age}
          </h3>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {companion.city}
          </span>
          <span className="flex items-center gap-1">
            <Languages className="h-3 w-3" />
            {companion.languages}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs">
          <MessageCircle className="h-3 w-3 text-accent" />
          <span className="font-semibold text-accent">₹{companion.ratePerMin}/min</span>
        </div>

        <button
          onClick={() => navigate(`/chat/${companion.id}`)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.97] hover:brightness-110"
        >
          <MessageCircle className="h-4 w-4" />
          Chat Now
        </button>
      </div>
    </div>
  );
};

export default CompanionCard;

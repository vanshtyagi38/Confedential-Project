import { MapPin, Languages, MessageCircle, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { Companion } from "@/data/companions";

interface CompanionCardProps {
  companion: Companion;
  index: number;
  compact?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
}

const CompanionCard = ({ companion, index, compact, isOnline, lastSeen }: CompanionCardProps) => {
  const navigate = useNavigate();
  const { requireAuth } = useAuthGuard();

  const handleChat = () => {
    requireAuth(() => navigate(`/chat/${companion.id}`));
  };

  const formatLastSeen = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (compact) {
    return (
      <div
        onClick={handleChat}
        className="animate-fade-in-up cursor-pointer overflow-hidden rounded-2xl bg-card shadow-card transition-all active:scale-95 hover:shadow-elevated"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <img src={companion.image} alt={companion.name} className="h-full w-full object-cover scale-105 hover:scale-110 transition-transform duration-500" loading="lazy" />
          <div className="gradient-card-overlay absolute inset-0" />
          <div className={`absolute right-2 top-2 flex items-center gap-1 rounded-full ${isOnline ? "bg-green-500/90" : "bg-muted-foreground/70"} px-1.5 py-0.5`}>
            <span className={`h-1.5 w-1.5 rounded-full bg-white ${isOnline ? "animate-pulse-soft" : ""}`} />
            <span className="text-[8px] font-bold text-white">{isOnline ? "LIVE" : "OFF"}</span>
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
      className="animate-fade-in-up cursor-pointer overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden group">
        <img src={companion.image} alt={companion.name} className="h-full w-full object-cover scale-105 group-hover:scale-115 transition-transform duration-700" loading="lazy" />
        <div className="gradient-card-overlay absolute inset-0" />
        <div className={`absolute left-2 top-2 flex items-center gap-1 rounded-full ${isOnline ? "bg-green-500/90" : "bg-muted-foreground/60"} px-2 py-0.5 backdrop-blur-sm`}>
          <span className={`h-1.5 w-1.5 rounded-full bg-white ${isOnline ? "animate-pulse-soft" : ""}`} />
          <span className="text-[9px] font-bold text-white">{isOnline ? "ONLINE" : lastSeen ? formatLastSeen(lastSeen) : "OFFLINE"}</span>
        </div>
        <span className="absolute right-2 top-2 rounded-full gradient-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground shadow-md">
          {companion.tag}
        </span>
        {companion.isRealUser && (
          <span className="absolute right-2 bottom-14 rounded-full bg-accent/90 px-2 py-0.5 text-[9px] font-bold text-accent-foreground">
            Real Person
          </span>
        )}
        <div className="absolute bottom-3 left-3">
          <h3 className="text-lg font-extrabold text-primary-foreground drop-shadow-lg">
            {companion.name}, {companion.age}
          </h3>
          <p className="text-[11px] text-primary-foreground/80 drop-shadow-md">Tap to chat now 💬</p>
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

        <button
          onClick={handleChat}
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

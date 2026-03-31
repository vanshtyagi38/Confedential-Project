import { useReels, getGDriveThumbnailUrl } from "@/hooks/useReels";
import { Play, Heart, Film } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReelsSection = () => {
  const { reels, loading } = useReels();
  const navigate = useNavigate();

  if (loading || reels.length === 0) return null;

  return (
    <div className="mt-5 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Reels 🔥</h2>
        </div>
        <button
          onClick={() => navigate("/reels")}
          className="text-xs font-semibold text-primary"
        >
          See All
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Trending clips from your favorites</p>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {reels.slice(0, 10).map((reel, i) => {
          const thumbnail = reel.thumbnail_url || reel.companion?.image_url || getGDriveThumbnailUrl(reel.video_url);
          return (
            <button
              key={reel.id}
              onClick={() => navigate(`/reels?start=${i}`)}
              className="relative w-28 shrink-0 snap-start overflow-hidden rounded-2xl border border-border bg-muted shadow-sm transition-transform active:scale-95"
            >
              <div className="aspect-[9/16] w-full bg-muted">
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={reel.caption || "Reel"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="rounded-full bg-white/90 p-2 shadow">
                  <Play className="h-4 w-4 fill-primary text-primary" />
                </div>
              </div>
              {/* Companion name + caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                {reel.companion && (
                  <p className="truncate text-[10px] font-bold text-white">{reel.companion.name}</p>
                )}
                {reel.caption && (
                  <p className="truncate text-[9px] text-white/80">{reel.caption}</p>
                )}
                {reel.likes_count > 0 && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <Heart className="h-2.5 w-2.5 fill-red-400 text-red-400" />
                    <span className="text-[9px] text-white/80">{reel.likes_count}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReelsSection;

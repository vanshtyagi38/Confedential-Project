import { useEffect, useRef, useState } from "react";
import { useReels, type Reel } from "@/hooks/useReels";
import { ArrowLeft, MessageCircle, Crown, X, VolumeX } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ReelItem = ({
  reel,
  isActive,
  isMuted,
  onUnmute,
  isLastFree,
  onShowPaywall,
}: {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onUnmute: () => void;
  isLastFree: boolean;
  onShowPaywall: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [showPoster, setShowPoster] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.muted = isMuted;
      video.play().then(() => setShowPoster(false)).catch(() => {
        video.muted = true;
        video.play().then(() => setShowPoster(false)).catch(() => {});
      });
      // Show paywall popup when last free reel ends
      if (isLastFree) {
        const handleEnded = () => onShowPaywall();
        video.addEventListener("ended", handleEnded);
        return () => video.removeEventListener("ended", handleEnded);
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive, isMuted, isLastFree, onShowPaywall]);

  const handleTap = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      onUnmute();
      return;
    }
    if (video.paused) video.play();
    else video.pause();
  };

  // Use companion image as poster/thumbnail
  const posterUrl = reel.thumbnail_url || reel.companion?.image_url || "";

  return (
    <div className="relative h-[100dvh] w-full snap-start snap-always bg-black flex items-center justify-center">
      {/* Poster/thumbnail while loading */}
      {showPoster && posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover z-[1]"
        />
      )}

      <video
        ref={videoRef}
        src={reel.video_url}
        className="h-full w-full object-cover"
        loop
        playsInline
        poster={posterUrl}
        preload={isActive ? "auto" : "metadata"}
        onClick={handleTap}
        onCanPlay={() => { if (isActive) setShowPoster(false); }}
      />

      {/* Tap to unmute */}
      {isActive && isMuted && (
        <button
          onClick={() => {
            const v = videoRef.current;
            if (v) { v.muted = false; onUnmute(); }
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 rounded-full bg-black/60 p-4 backdrop-blur-sm animate-pulse"
        >
          <VolumeX className="h-8 w-8 text-white" />
          <span className="mt-1 block text-[10px] text-white/80">Tap to unmute</span>
        </button>
      )}

      {/* RIGHT SIDE — Profile avatar (Instagram-style, bottom-right) */}
      {reel.companion && (
        <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-3">
          <button
            onClick={() => navigate(`/chat/${reel.companion_slug}`)}
            className="relative"
          >
            <Avatar className="h-12 w-12 ring-2 ring-primary shadow-lg">
              <AvatarImage src={reel.companion.image_url || ""} alt={reel.companion.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                {reel.companion.name[0]}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground shadow">
              +
            </span>
          </button>
          <button
            onClick={() => navigate(`/chat/${reel.companion_slug}`)}
            className="rounded-full bg-primary/20 p-2.5 backdrop-blur-sm"
          >
            <MessageCircle className="h-5 w-5 text-primary" />
          </button>
        </div>
      )}

      {/* BOTTOM — Name bar + Chat CTA */}
      <div className="absolute bottom-4 left-3 right-20 z-10">
        {reel.companion && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-bold text-white drop-shadow-lg">
              @{reel.companion.name.toLowerCase().replace(/\s/g, "")}
            </span>
            <span className="text-xs text-white/60">
              {reel.companion.age} · {reel.companion.city}
            </span>
          </div>
        )}
        {reel.caption && (
          <p className="mb-2 text-sm text-white/90 drop-shadow-lg line-clamp-2">{reel.caption}</p>
        )}
        {reel.companion && (
          <Button
            size="sm"
            onClick={() => navigate(`/chat/${reel.companion_slug}`)}
            className="gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg text-xs"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Chat with {reel.companion.name} 💬
          </Button>
        )}
      </div>
    </div>
  );
};

/** Small popup overlay instead of full-page paywall */
const RechargePopup = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-3 mb-6 w-full max-w-sm animate-in slide-in-from-bottom-4 rounded-2xl border border-primary/30 bg-black/90 p-5 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-white/10 p-1"
        >
          <X className="h-4 w-4 text-white/60" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-full bg-primary/20 p-2.5">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Unlock Hot Reels 🔥</h3>
            <p className="text-xs text-white/60">On your first recharge</p>
          </div>
        </div>

        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 mb-3">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-2xl font-extrabold text-primary">₹999</p>
              <p className="text-xs text-white/70">10 Days Unlimited Access</p>
            </div>
            <div className="text-right text-[10px] text-white/50 space-y-0.5">
              <p>✅ 500+ hot reels</p>
              <p>✅ Unlimited chat</p>
              <p>✅ Priority matching</p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => navigate("/recharge")}
          className="w-full gap-2 rounded-full bg-primary text-primary-foreground font-bold shadow-xl"
        >
          <Crown className="h-4 w-4" /> Recharge ₹999 — Unlock All
        </Button>
        <p className="mt-2 text-center text-[9px] text-white/30">One-time · No auto-renewal</p>
      </div>
    </div>
  );
};

const ReelsPage = () => {
  const { reels, loading } = useReels();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const startIndex = parseInt(searchParams.get("start") || "0", 10);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  const FREE_REEL_LIMIT = 4;

  useEffect(() => {
    if (containerRef.current && reels.length > 0 && startIndex > 0) {
      const target = containerRef.current.children[startIndex] as HTMLElement;
      if (target) target.scrollIntoView({ behavior: "instant" });
    }
  }, [reels.length, startIndex]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!isNaN(idx)) setActiveIndex(idx);
          }
        });
      },
      { root: containerRef.current, threshold: 0.6 }
    );
    Array.from(containerRef.current.children).forEach((child) =>
      observer.observe(child)
    );
    return () => observer.disconnect();
  }, [reels]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const freeReels = reels.slice(0, FREE_REEL_LIMIT);

  return (
    <div className="relative h-[100dvh] w-full bg-black">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed left-4 top-4 z-50 rounded-full bg-black/50 p-2 backdrop-blur-sm"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>

      <div
        ref={containerRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {freeReels.map((reel, i) => (
          <div key={reel.id} data-index={i}>
            <ReelItem
              reel={reel}
              isActive={i === activeIndex}
              isMuted={isMuted}
              onUnmute={() => setIsMuted(false)}
              isLastFree={i === FREE_REEL_LIMIT - 1}
              onShowPaywall={() => setShowPaywall(true)}
            />
          </div>
        ))}
      </div>

      {/* Paywall popup */}
      {showPaywall && <RechargePopup onClose={() => setShowPaywall(false)} />}
    </div>
  );
};

export default ReelsPage;

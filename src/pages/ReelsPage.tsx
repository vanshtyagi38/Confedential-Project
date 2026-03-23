import { useEffect, useRef, useState, useCallback } from "react";
import { useReels, type Reel } from "@/hooks/useReels";
import { ArrowLeft, Crown, Lock, MessageCircle, Volume2, VolumeX } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ReelItem = ({
  reel,
  isActive,
  isMuted,
  onUnmute,
}: {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onUnmute: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.muted = isMuted;
      video.play().then(() => setPlaying(true)).catch(() => {
        // Browser blocked unmuted autoplay — retry muted
        video.muted = true;
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      });
    } else {
      video.pause();
      video.currentTime = 0;
      setPlaying(false);
    }
  }, [isActive, isMuted]);

  const handleTap = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      onUnmute();
      return;
    }
    if (video.paused) {
      video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full snap-start snap-always bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={reel.video_url}
        className="h-full w-full object-cover"
        loop
        playsInline
        preload={isActive ? "auto" : "metadata"}
        onClick={handleTap}
      />

      {/* Tap to unmute hint */}
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

      {/* Companion avatar — right side */}
      {reel.companion && (
        <div className="absolute bottom-36 right-3 z-10">
          <button
            onClick={() => navigate(`/chat/${reel.companion_slug}`)}
            className="flex flex-col items-center gap-1"
          >
            <Avatar className="h-10 w-10 ring-2 ring-primary">
              <AvatarImage src={reel.companion.image_url || ""} alt={reel.companion.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {reel.companion.name[0]}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      )}

      {/* Bottom info + CTA */}
      <div className="absolute bottom-6 left-4 right-16 z-10">
        {reel.companion && (
          <button
            onClick={() => navigate(`/chat/${reel.companion_slug}`)}
            className="mb-2 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={reel.companion.image_url || ""} />
              <AvatarFallback className="text-[10px]">{reel.companion.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-white">
              {reel.companion.name}, {reel.companion.age}
            </span>
            <span className="text-[10px] text-white/70">{reel.companion.city}</span>
          </button>
        )}
        {reel.caption && (
          <p className="text-sm font-medium text-white drop-shadow-lg">{reel.caption}</p>
        )}
        {reel.companion && (
          <Button
            size="sm"
            onClick={() => navigate(`/chat/${reel.companion_slug}`)}
            className="mt-2 gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <MessageCircle className="h-4 w-4" /> Chat with {reel.companion.name} 💬
          </Button>
        )}
      </div>
    </div>
  );
};

const RechargeSlide = () => {
  const navigate = useNavigate();
  return (
    <div className="relative flex h-[100dvh] w-full snap-start snap-always items-center justify-center bg-gradient-to-b from-black via-black/95 to-black">
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <div className="rounded-full bg-primary/20 p-4">
          <Crown className="h-12 w-12 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-white/60" />
          <h2 className="text-xl font-bold text-white">Unlock Hot Reels 🔥</h2>
        </div>
        <p className="max-w-xs text-sm text-white/70">
          Get access to 500+ exclusive reels and unlimited chat with your favorite companions
        </p>
        <div className="mt-2 rounded-2xl border border-primary/30 bg-primary/10 p-5 backdrop-blur-sm">
          <p className="text-3xl font-extrabold text-primary">₹999</p>
          <p className="mt-1 text-sm font-medium text-white/80">10 Days Unlimited Access</p>
          <ul className="mt-3 space-y-1.5 text-left text-xs text-white/60">
            <li>✅ 500+ exclusive hot reels</li>
            <li>✅ Unlimited chat minutes</li>
            <li>✅ Priority matching</li>
            <li>✅ No ads</li>
          </ul>
        </div>
        <Button
          size="lg"
          onClick={() => navigate("/recharge")}
          className="mt-2 w-full max-w-xs gap-2 rounded-full bg-primary text-primary-foreground text-base font-bold shadow-xl"
        >
          <Crown className="h-5 w-5" /> Get 10-Day Pass — ₹999
        </Button>
        <p className="text-[10px] text-white/40">One-time payment · No auto-renewal</p>
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
  const [isMuted, setIsMuted] = useState(true); // start muted for autoplay

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
  const showPaywall = reels.length >= FREE_REEL_LIMIT;

  return (
    <div className="relative h-[100dvh] w-full bg-black">
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
            />
          </div>
        ))}
        {showPaywall && (
          <div data-index={FREE_REEL_LIMIT}>
            <RechargeSlide />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelsPage;

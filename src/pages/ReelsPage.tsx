import { useEffect, useRef, useState, useCallback } from "react";
import { useReels, getGDriveDirectUrl, extractGDriveFileId } from "@/hooks/useReels";
import { ArrowLeft, Heart, Share2, Volume2, VolumeX, Play } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ReelItem = ({
  reel,
  isActive,
}: {
  reel: any;
  isActive: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const fileId = extractGDriveFileId(reel.video_url);
  const videoSrc = getGDriveDirectUrl(reel.video_url);

  // Auto-play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true));
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: reel.caption || "Check this reel!", url: window.location.href });
    }
  };

  // Fallback to iframe if video tag fails
  const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : reel.video_url;

  return (
    <div className="relative h-[100dvh] w-full snap-start snap-always bg-black">
      {isActive || Math.abs(0) <= 1 ? (
        videoError ? (
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            style={{ border: "none" }}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              className="absolute inset-0 h-full w-full object-contain"
              loop
              muted={muted}
              playsInline
              preload={isActive ? "auto" : "metadata"}
              onClick={togglePlay}
              onError={() => setVideoError(true)}
            />
            {!playing && isActive && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 z-10 flex items-center justify-center"
              >
                <div className="rounded-full bg-black/40 p-4">
                  <Play className="h-10 w-10 fill-white text-white" />
                </div>
              </button>
            )}
          </>
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-5">
        <button
          onClick={() => setMuted(!muted)}
          className="flex flex-col items-center gap-1"
        >
          {muted ? (
            <VolumeX className="h-6 w-6 text-white" />
          ) : (
            <Volume2 className="h-6 w-6 text-white" />
          )}
        </button>
        <button
          onClick={() => setLiked(!liked)}
          className="flex flex-col items-center gap-1"
        >
          <Heart
            className={`h-7 w-7 transition-all ${
              liked ? "fill-red-500 text-red-500 scale-110" : "text-white"
            }`}
          />
          <span className="text-[10px] font-medium text-white">
            {reel.likes_count + (liked ? 1 : 0)}
          </span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <Share2 className="h-6 w-6 text-white" />
          <span className="text-[10px] font-medium text-white">Share</span>
        </button>
      </div>

      {/* Bottom caption */}
      <div className="absolute bottom-6 left-4 right-16 z-10">
        {reel.caption && (
          <p className="text-sm font-medium text-white drop-shadow-lg">{reel.caption}</p>
        )}
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

  // Scroll to start index on mount
  useEffect(() => {
    if (containerRef.current && reels.length > 0 && startIndex > 0) {
      const target = containerRef.current.children[startIndex] as HTMLElement;
      if (target) target.scrollIntoView({ behavior: "instant" });
    }
  }, [reels.length, startIndex]);

  // Intersection observer to track active reel
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

    Array.from(containerRef.current.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [reels]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

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
        {reels.map((reel, i) => (
          <div key={reel.id} data-index={i}>
            <ReelItem
              reel={reel}
              isActive={Math.abs(i - activeIndex) <= 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReelsPage;

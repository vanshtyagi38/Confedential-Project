import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { imageKeyMap } from "@/data/companions";

export type Reel = {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string;
  companion_slug: string | null;
  likes_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  companion?: {
    name: string;
    slug: string;
    image_url: string | null;
    age: number;
    city: string;
  } | null;
};

export const extractGDriveFileId = (url: string): string | null => {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const getGDriveEmbedUrl = (url: string): string => {
  const fileId = extractGDriveFileId(url);
  if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
  return url;
};

export const getGDriveDirectUrl = (url: string): string => {
  if (url.startsWith('/')) return url;
  const fileId = extractGDriveFileId(url);
  if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
  return url;
};

export const getGDriveThumbnailUrl = (url: string): string => {
  const fileId = extractGDriveFileId(url);
  if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  return "";
};

export const useReels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: reelsData } = await (supabase as any)
        .from("reels")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!reelsData) { setReels([]); setLoading(false); return; }

      const slugs = reelsData
        .map((r: any) => r.companion_slug)
        .filter(Boolean);

      let companionMap: Record<string, any> = {};
      if (slugs.length > 0) {
        const { data: companions } = await (supabase as any)
          .from("companions")
          .select("slug, name, image_url, image_key, age, city")
          .in("slug", slugs);
        if (companions) {
          companions.forEach((c: any) => {
            // Resolve image: use image_key mapped to local asset, fallback to image_url
            const resolvedImage = c.image_key && imageKeyMap[c.image_key]
              ? imageKeyMap[c.image_key]
              : c.image_url;
            companionMap[c.slug] = { ...c, image_url: resolvedImage };
          });
        }
      }

      const enriched = reelsData.map((r: any) => ({
        ...r,
        companion: r.companion_slug ? companionMap[r.companion_slug] || null : null,
      }));

      setReels(enriched);
      setLoading(false);
    };
    load();
  }, []);

  return { reels, loading };
};

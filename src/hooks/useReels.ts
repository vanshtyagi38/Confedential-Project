import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
};

export const extractGDriveFileId = (url: string): string | null => {
  // Matches /file/d/FILE_ID/ or id=FILE_ID
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

export const getGDriveEmbedUrl = (url: string): string => {
  const fileId = extractGDriveFileId(url);
  if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
  return url;
};

export const getGDriveStreamUrl = (url: string): string => {
  const fileId = extractGDriveFileId(url);
  if (fileId) return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=AIzaSyDummy`;
  return url;
};

export const getGDriveDirectUrl = (url: string): string => {
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
      const { data } = await (supabase as any)
        .from("reels")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setReels(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return { reels, loading };
};

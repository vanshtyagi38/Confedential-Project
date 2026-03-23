import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { extractGDriveFileId, getGDriveThumbnailUrl } from "@/hooks/useReels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Film, GripVertical, ExternalLink } from "lucide-react";

type Reel = {
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

const AdminReels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [adding, setAdding] = useState(false);

  const loadReels = async () => {
    const { data } = await (supabase as any)
      .from("reels")
      .select("*")
      .order("sort_order", { ascending: true });
    setReels(data || []);
    setLoading(false);
  };

  useEffect(() => { loadReels(); }, []);

  const addReel = async () => {
    if (!newUrl.trim()) { toast.error("Paste a Google Drive video link"); return; }
    const fileId = extractGDriveFileId(newUrl);
    if (!fileId) { toast.error("Invalid Google Drive link. Use a /file/d/ share link."); return; }

    setAdding(true);
    const { error } = await (supabase as any).from("reels").insert({
      video_url: newUrl.trim(),
      thumbnail_url: getGDriveThumbnailUrl(newUrl),
      caption: newCaption.trim(),
      sort_order: reels.length,
    });
    if (error) { toast.error("Failed to add reel"); console.error(error); }
    else { toast.success("Reel added!"); setNewUrl(""); setNewCaption(""); await loadReels(); }
    setAdding(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from("reels").update({ is_active: !current }).eq("id", id);
    setReels(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r));
  };

  const deleteReel = async (id: string) => {
    if (!confirm("Delete this reel?")) return;
    await (supabase as any).from("reels").delete().eq("id", id);
    setReels(prev => prev.filter(r => r.id !== id));
    toast.success("Reel deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Film className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Manage Reels</h1>
        <span className="ml-auto rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {reels.length} reels
        </span>
      </div>

      {/* Add new reel */}
      <Card>
        <CardHeader><CardTitle className="text-base">Add New Reel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Google Drive Video Link</Label>
            <Input
              placeholder="https://drive.google.com/file/d/xxxxx/view?usp=sharing"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
            />
            {newUrl && extractGDriveFileId(newUrl) && (
              <p className="mt-1 text-xs text-green-600">✓ Valid file ID: {extractGDriveFileId(newUrl)}</p>
            )}
            {newUrl && !extractGDriveFileId(newUrl) && (
              <p className="mt-1 text-xs text-destructive">✗ Invalid link format</p>
            )}
          </div>
          <div>
            <Label>Caption (optional)</Label>
            <Input placeholder="Short caption..." value={newCaption} onChange={e => setNewCaption(e.target.value)} />
          </div>
          <Button onClick={addReel} disabled={adding}>
            <Plus className="mr-2 h-4 w-4" /> {adding ? "Adding..." : "Add Reel"}
          </Button>
        </CardContent>
      </Card>

      {/* Reels list */}
      <div className="space-y-3">
        {reels.map((reel, i) => (
          <Card key={reel.id} className={!reel.is_active ? "opacity-50" : ""}>
            <CardContent className="flex items-center gap-4 p-4">
              <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" />
              
              {/* Thumbnail */}
              <div className="h-16 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                {reel.thumbnail_url ? (
                  <img src={reel.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{reel.caption || "No caption"}</p>
                <p className="truncate text-xs text-muted-foreground">{reel.video_url}</p>
                <p className="text-xs text-muted-foreground">❤️ {reel.likes_count} likes · #{i + 1}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Active</Label>
                  <Switch checked={reel.is_active} onCheckedChange={() => toggleActive(reel.id, reel.is_active)} />
                </div>
                <a
                  href={`https://drive.google.com/file/d/${extractGDriveFileId(reel.video_url)}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <Button variant="ghost" size="icon" onClick={() => deleteReel(reel.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && reels.length === 0 && (
        <p className="text-center text-muted-foreground">No reels yet. Add your first one above!</p>
      )}
    </div>
  );
};

export default AdminReels;

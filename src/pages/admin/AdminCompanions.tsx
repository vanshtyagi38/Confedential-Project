import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { dbRowToCompanion, imageKeyMap, type Companion } from "@/data/companions";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Ban, Trash2, Edit, Eye, CheckCircle, XCircle, UserPlus, Image as ImageIcon, Loader2,
} from "lucide-react";

type DbCompanion = any;
type Application = any;

const AdminCompanions = () => {
  const { logAction } = useAdminAuth();
  const [companions, setCompanions] = useState<DbCompanion[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<DbCompanion | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 15;

  const fetchCompanions = async () => {
    const { data } = await (supabase as any)
      .from("companions")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setCompanions(data);
  };

  const fetchApplications = async () => {
    const { data } = await (supabase as any)
      .from("companion_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setApplications(data);
  };

  useEffect(() => { fetchCompanions(); fetchApplications(); }, []);

  const filtered = companions.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const getImageSrc = (c: any) => {
    if (c.image_key && imageKeyMap[c.image_key]) return imageKeyMap[c.image_key];
    return c.image_url || "";
  };

  const handleBan = async (c: any) => {
    await (supabase as any).from("companions").update({
      status: "banned",
      banned_at: new Date().toISOString(),
    }).eq("id", c.id);
    await logAction("ban_companion", "companion", c.id, { name: c.name });
    toast.success(`${c.name} banned for 24 hours`);
    fetchCompanions();
  };

  const handleUnban = async (c: any) => {
    await (supabase as any).from("companions").update({
      status: "active",
      banned_at: null,
    }).eq("id", c.id);
    await logAction("unban_companion", "companion", c.id, { name: c.name });
    toast.success(`${c.name} unbanned`);
    fetchCompanions();
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Delete ${c.name}? This will hide them from all chats after 24 hours.`)) return;
    await (supabase as any).from("companions").update({
      status: "deleted",
      banned_at: new Date().toISOString(),
    }).eq("id", c.id);
    await logAction("delete_companion", "companion", c.id, { name: c.name });
    toast.success(`${c.name} deleted`);
    fetchCompanions();
  };

  const openEdit = (c: any) => {
    setEditData({ ...c });
    setImageFile(null);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    setSaving(true);

    let newImageUrl = editData.image_url;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `companion-${editData.slug}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("companion-images")
        .upload(path, imageFile, { contentType: imageFile.type });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("companion-images").getPublicUrl(path);
        newImageUrl = urlData.publicUrl;
      }
    }

    await (supabase as any).from("companions").update({
      name: editData.name,
      age: editData.age,
      gender: editData.gender,
      tag: editData.tag,
      city: editData.city,
      languages: editData.languages,
      rate_per_min: editData.rate_per_min,
      bio: editData.bio,
      image_url: newImageUrl,
      image_key: imageFile ? null : editData.image_key, // clear image_key if new upload
    }).eq("id", editData.id);

    await logAction("edit_companion", "companion", editData.id, { name: editData.name });
    toast.success("Companion updated");
    setSaving(false);
    setEditOpen(false);
    fetchCompanions();
  };

  // Application actions
  const handleApproveApp = async (app: Application) => {
    // Create companion from application
    const slug = `${app.name.toLowerCase().replace(/\s+/g, "-")}-real-${Date.now()}`;
    await (supabase as any).from("companions").insert({
      slug,
      name: app.name,
      age: app.age,
      gender: app.gender,
      tag: app.tag || "New Companion",
      city: app.city,
      languages: app.languages,
      rate_per_min: 3,
      image_url: app.image_url,
      bio: app.bio,
      interests: app.interests || "",
      is_real_user: true,
      owner_user_id: app.user_id,
      status: "active",
    });

    await (supabase as any).from("companion_applications").update({
      admin_status: "approved",
      updated_at: new Date().toISOString(),
    }).eq("id", app.id);

    await logAction("approve_companion_application", "companion_application", app.id, { name: app.name });
    toast.success(`${app.name} approved and listed!`);
    fetchApplications();
    fetchCompanions();
  };

  const handleRejectApp = async (app: Application) => {
    const reason = prompt("Rejection reason (optional):");
    await (supabase as any).from("companion_applications").update({
      admin_status: "rejected",
      rejection_reason: reason || null,
      updated_at: new Date().toISOString(),
    }).eq("id", app.id);
    await logAction("reject_companion_application", "companion_application", app.id, { name: app.name });
    toast.success(`${app.name} rejected`);
    fetchApplications();
  };

  const pendingApps = applications.filter((a: any) => a.admin_status === "pending");
  const allApps = applications;

  const handleMarkPaid = async (app: Application) => {
    const ref = prompt("Payment reference (e.g. UPI ID, transaction ID):");
    await (supabase as any).from("companion_applications").update({
      payment_status: "paid",
      payment_reference: ref || "manual",
      updated_at: new Date().toISOString(),
    }).eq("id", app.id);
    await logAction("mark_application_paid", "companion_application", app.id, { name: app.name });
    toast.success(`${app.name} marked as paid`);
    fetchApplications();
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/20 text-green-400",
      banned: "bg-red-500/20 text-red-400",
      deleted: "bg-muted text-muted-foreground",
      pending: "bg-yellow-500/20 text-yellow-400",
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Companion Management</h1>

      <Tabs defaultValue="companions">
        <TabsList className="mb-4">
          <TabsTrigger value="companions">All Companions ({companions.length})</TabsTrigger>
          <TabsTrigger value="applications">
            Applications {pendingApps.length > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{pendingApps.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companions">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug, city..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <img
                        src={getImageSrc(c)}
                        alt={c.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.age}</TableCell>
                    <TableCell>{c.city}</TableCell>
                    <TableCell>
                      <span className={`text-xs ${c.is_real_user ? "text-accent" : "text-muted-foreground"}`}>
                        {c.is_real_user ? "Real" : "AI"}
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {c.status === "active" ? (
                          <Button size="icon" variant="ghost" onClick={() => handleBan(c)} title="Ban 24h" className="text-yellow-500">
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : c.status === "banned" ? (
                          <Button size="icon" variant="ghost" onClick={() => handleUnban(c)} title="Unban" className="text-green-500">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(c)} title="Delete" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications">
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age/City</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allApps.map((app: any) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      {app.image_url ? (
                        <img src={app.image_url} alt={app.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{app.name}</TableCell>
                    <TableCell>{app.age}, {app.city}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${app.payment_status === "paid" ? "text-green-500" : "text-yellow-500"}`}>
                        {app.payment_status} {app.payment_reference && `(${app.payment_reference})`}
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(app.admin_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {app.admin_status === "pending" && app.payment_status === "paid" && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleApproveApp(app)} className="text-green-500" title="Approve">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleRejectApp(app)} className="text-destructive" title="Reject">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {app.admin_status !== "pending" && (
                        <span className="text-xs text-muted-foreground">{app.admin_status}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {allApps.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No applications yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Companion</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                <img src={getImageSrc(editData)} alt="" className="h-16 w-16 rounded-full object-cover" />
                <div>
                  <Label>Update Photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input type="number" value={editData.age} onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                </div>
                <div>
                  <Label>Tag</Label>
                  <Input value={editData.tag} onChange={(e) => setEditData({ ...editData, tag: e.target.value })} />
                </div>
                <div>
                  <Label>Languages</Label>
                  <Input value={editData.languages} onChange={(e) => setEditData({ ...editData, languages: e.target.value })} />
                </div>
                <div>
                  <Label>Rate/min (₹)</Label>
                  <Input type="number" value={editData.rate_per_min} onChange={(e) => setEditData({ ...editData, rate_per_min: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={editData.bio} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompanions;

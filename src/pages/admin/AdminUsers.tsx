import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Ban, Trash2, Eye, ChevronLeft, ChevronRight, Plus, Edit3, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";

type UserRow = {
  user_id: string;
  display_name: string | null;
  gender: string;
  age: number;
  balance_minutes: number;
  spin_credits: number;
  created_at: string | null;
  referral_code: string | null;
  preferred_gender: string;
  contact?: string | null;
  city?: string | null;
  email?: string | null;
  image_url?: string | null;
  msgCount?: number;
};

const PAGE_SIZE = 15;

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<UserRow>>({});
  const [addMinutesOpen, setAddMinutesOpen] = useState(false);
  const [addMinutesUserId, setAddMinutesUserId] = useState("");
  const [minutesToAdd, setMinutesToAdd] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { logAction } = useAdminAuth();

  useEffect(() => {
    const load = async () => {
      const { data: profiles } = await (supabase as any).from("user_profiles").select("*");
      const { data: messages } = await (supabase as any).from("chat_messages").select("user_id");

      const msgMap: Record<string, number> = {};
      (messages || []).forEach((m: any) => {
        msgMap[m.user_id] = (msgMap[m.user_id] || 0) + 1;
      });

      const enriched = (profiles || []).map((p: any) => ({
        ...p,
        msgCount: msgMap[p.user_id] || 0,
      }));
      setUsers(enriched);
      setFiltered(enriched);
    };
    load();
  }, []);

  useEffect(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.display_name?.toLowerCase().includes(q) || u.user_id.includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    if (genderFilter !== "all") {
      result = result.filter(u => u.gender === genderFilter);
    }
    setFiltered(result);
    setPage(0);
  }, [search, genderFilter, users]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSuspend = async (userId: string) => {
    await (supabase as any).from("user_profiles").update({ balance_minutes: 0 }).eq("user_id", userId);
    await logAction("suspend_user", "user", userId);
    toast.success("User suspended (balance set to 0)");
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, balance_minutes: 0 } : u));
  };

  const handleDeleteUser = async (userId: string) => {
    // Delete all user data
    await (supabase as any).from("chat_messages").delete().eq("user_id", userId);
    await (supabase as any).from("wallet_transactions").delete().eq("user_id", userId);
    await (supabase as any).from("user_streaks").delete().eq("user_id", userId);
    await (supabase as any).from("support_messages").delete().eq("user_id", userId);
    await (supabase as any).from("companion_wishlist").delete().eq("user_id", userId);
    await (supabase as any).from("user_profiles").delete().eq("user_id", userId);
    await logAction("delete_user", "user", userId);
    toast.success("User account deleted");
    setUsers(prev => prev.filter(u => u.user_id !== userId));
    setDeleteConfirmId(null);
    setSelectedUser(null);
  };

  const handleAddMinutes = async () => {
    if (!addMinutesUserId || minutesToAdd <= 0) return;
    const user = users.find(u => u.user_id === addMinutesUserId);
    if (!user) return;
    const newBalance = (user.balance_minutes || 0) + minutesToAdd;
    await (supabase as any).from("user_profiles").update({ balance_minutes: newBalance }).eq("user_id", addMinutesUserId);
    await (supabase as any).from("wallet_transactions").insert({
      user_id: addMinutesUserId,
      type: "credit",
      minutes: minutesToAdd,
      amount: 0,
      description: `Admin added ${minutesToAdd} minutes`,
    });
    await logAction("add_minutes", "user", addMinutesUserId, { minutes: minutesToAdd });
    toast.success(`Added ${minutesToAdd} minutes`);
    setUsers(prev => prev.map(u => u.user_id === addMinutesUserId ? { ...u, balance_minutes: newBalance } : u));
    setAddMinutesOpen(false);
    setMinutesToAdd(0);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    const updateFields: any = {};
    if (editData.display_name !== undefined) updateFields.display_name = editData.display_name;
    if (editData.gender !== undefined) updateFields.gender = editData.gender;
    if (editData.age !== undefined) updateFields.age = editData.age;
    if (editData.contact !== undefined) updateFields.contact = editData.contact;
    if (editData.city !== undefined) updateFields.city = editData.city;
    if (editData.email !== undefined) updateFields.email = editData.email;
    if (editData.preferred_gender !== undefined) updateFields.preferred_gender = editData.preferred_gender;

    await (supabase as any).from("user_profiles").update(updateFields).eq("user_id", selectedUser.user_id);
    await logAction("edit_user", "user", selectedUser.user_id, updateFields);
    toast.success("User updated");
    setUsers(prev => prev.map(u => u.user_id === selectedUser.user_id ? { ...u, ...updateFields } : u));
    setSelectedUser(prev => prev ? { ...prev, ...updateFields } : null);
    setEditMode(false);
  };

  const openUserDetail = (u: UserRow) => {
    setSelectedUser(u);
    setEditMode(false);
    setEditData({
      display_name: u.display_name || "",
      gender: u.gender,
      age: u.age,
      contact: u.contact || "",
      city: u.city || "",
      email: u.email || "",
      preferred_gender: u.preferred_gender,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">User Management</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 rounded-xl" />
        </div>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{u.gender}</Badge></TableCell>
                  <TableCell>{u.age}</TableCell>
                  <TableCell>{Number(u.balance_minutes).toFixed(0)} min</TableCell>
                  <TableCell>{u.msgCount}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openUserDetail(u)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { setAddMinutesUserId(u.user_id); setMinutesToAdd(10); setAddMinutesOpen(true); }}><Plus className="h-4 w-4 text-green-500" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleSuspend(u.user_id)}><Ban className="h-4 w-4 text-amber-500" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteConfirmId(u.user_id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} users total</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="flex items-center text-sm">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* User Detail / Edit Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              User Profile
              <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
                <Edit3 className="h-3 w-3 mr-1" />{editMode ? "Cancel" : "Edit"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input value={editData.display_name || ""} onChange={e => setEditData(d => ({ ...d, display_name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Gender</label>
                      <Select value={editData.gender} onValueChange={v => setEditData(d => ({ ...d, gender: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Age</label>
                      <Input type="number" value={editData.age || 0} onChange={e => setEditData(d => ({ ...d, age: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <Input value={editData.email || ""} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Contact</label>
                    <Input value={editData.contact || ""} onChange={e => setEditData(d => ({ ...d, contact: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">City</label>
                    <Input value={editData.city || ""} onChange={e => setEditData(d => ({ ...d, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Preferred Gender</label>
                    <Select value={editData.preferred_gender} onValueChange={v => setEditData(d => ({ ...d, preferred_gender: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveEdit} className="w-full"><Save className="h-4 w-4 mr-1" /> Save Changes</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Name:</span> <strong>{selectedUser.display_name || "—"}</strong></div>
                  <div><span className="text-muted-foreground">ID:</span> <strong className="text-xs break-all">{selectedUser.user_id}</strong></div>
                  <div><span className="text-muted-foreground">Gender:</span> <strong>{selectedUser.gender}</strong></div>
                  <div><span className="text-muted-foreground">Age:</span> <strong>{selectedUser.age}</strong></div>
                  <div><span className="text-muted-foreground">Balance:</span> <strong>{Number(selectedUser.balance_minutes).toFixed(0)} min</strong></div>
                  <div><span className="text-muted-foreground">Spins:</span> <strong>{selectedUser.spin_credits}</strong></div>
                  <div><span className="text-muted-foreground">Email:</span> <strong>{selectedUser.email || "—"}</strong></div>
                  <div><span className="text-muted-foreground">Contact:</span> <strong>{selectedUser.contact || "—"}</strong></div>
                  <div><span className="text-muted-foreground">City:</span> <strong>{selectedUser.city || "—"}</strong></div>
                  <div><span className="text-muted-foreground">Prefers:</span> <strong>{selectedUser.preferred_gender}</strong></div>
                  <div><span className="text-muted-foreground">Referral:</span> <strong>{selectedUser.referral_code || "—"}</strong></div>
                  <div><span className="text-muted-foreground">Messages:</span> <strong>{selectedUser.msgCount}</strong></div>
                  <div><span className="text-muted-foreground">Joined:</span> <strong>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "—"}</strong></div>
                </div>
              )}
              {!editMode && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => { setAddMinutesUserId(selectedUser.user_id); setMinutesToAdd(10); setAddMinutesOpen(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Add Minutes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleSuspend(selectedUser.user_id)}>
                    <Ban className="h-3 w-3 mr-1" /> Suspend
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmId(selectedUser.user_id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Minutes Dialog */}
      <Dialog open={addMinutesOpen} onOpenChange={setAddMinutesOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Add Minutes to Wallet</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input type="number" min={1} value={minutesToAdd} onChange={e => setMinutesToAdd(Number(e.target.value))} placeholder="Minutes" />
            <Button onClick={handleAddMinutes} className="w-full">Add {minutesToAdd} Minutes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-destructive">Delete User Account</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete all user data including messages, wallet, and profile. This cannot be undone.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={() => deleteConfirmId && handleDeleteUser(deleteConfirmId)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;

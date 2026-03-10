import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Ban, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
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
        u.display_name?.toLowerCase().includes(q) || u.user_id.includes(q)
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
    toast.success("User suspended");
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, balance_minutes: 0 } : u));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">User Management</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 rounded-xl" />
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
                    <Button size="icon" variant="ghost" onClick={() => setSelectedUser(u)}><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleSuspend(u.user_id)}><Ban className="h-4 w-4 text-amber-500" /></Button>
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

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Name:</span> <strong>{selectedUser.display_name || "—"}</strong></div>
                <div><span className="text-muted-foreground">ID:</span> <strong className="text-xs break-all">{selectedUser.user_id}</strong></div>
                <div><span className="text-muted-foreground">Gender:</span> <strong>{selectedUser.gender}</strong></div>
                <div><span className="text-muted-foreground">Age:</span> <strong>{selectedUser.age}</strong></div>
                <div><span className="text-muted-foreground">Balance:</span> <strong>{Number(selectedUser.balance_minutes).toFixed(0)} min</strong></div>
                <div><span className="text-muted-foreground">Spins:</span> <strong>{selectedUser.spin_credits}</strong></div>
                <div><span className="text-muted-foreground">Referral Code:</span> <strong>{selectedUser.referral_code || "—"}</strong></div>
                <div><span className="text-muted-foreground">Prefers:</span> <strong>{selectedUser.preferred_gender}</strong></div>
                <div><span className="text-muted-foreground">Messages:</span> <strong>{selectedUser.msgCount}</strong></div>
                <div><span className="text-muted-foreground">Joined:</span> <strong>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "—"}</strong></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;

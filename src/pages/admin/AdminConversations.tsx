import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Conversation = {
  key: string;
  userId: string;
  userName: string;
  companion: string;
  totalMessages: number;
  firstMessage: string;
  lastMessage: string;
};

type Message = { role: string; content: string; created_at: string };

const PAGE_SIZE = 15;

const AdminConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [viewConvo, setViewConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: msgs }, { data: profiles }] = await Promise.all([
        (supabase as any).from("chat_messages").select("*").order("created_at", { ascending: true }),
        (supabase as any).from("user_profiles").select("user_id, display_name"),
      ]);

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.display_name || "Unknown"; });

      const grouped: Record<string, any[]> = {};
      (msgs || []).forEach((m: any) => {
        const key = `${m.user_id}__${m.companion_slug}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(m);
      });

      const convos: Conversation[] = Object.entries(grouped).map(([key, items]) => ({
        key,
        userId: items[0].user_id,
        userName: nameMap[items[0].user_id] || "Unknown",
        companion: items[0].companion_slug,
        totalMessages: items.length,
        firstMessage: items[0].created_at,
        lastMessage: items[items.length - 1].created_at,
      }));

      convos.sort((a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime());
      setConversations(convos);
    };
    load();
  }, []);

  const filtered = search
    ? conversations.filter(c => c.userName.toLowerCase().includes(search.toLowerCase()) || c.companion.includes(search.toLowerCase()) || c.key.includes(search))
    : conversations;

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const viewMessages = async (convo: Conversation) => {
    setViewConvo(convo);
    const { data } = await (supabase as any)
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", convo.userId)
      .eq("companion_slug", convo.companion)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Conversations</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by user or companion..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-10 rounded-xl" />
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Companion</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(c => (
                <TableRow key={c.key}>
                  <TableCell className="font-medium">{c.userName}</TableCell>
                  <TableCell><Badge variant="secondary">{c.companion}</Badge></TableCell>
                  <TableCell>{c.totalMessages}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.firstMessage).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.lastMessage).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => viewMessages(c)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No conversations</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} conversations</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="flex items-center text-sm">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={!!viewConvo} onOpenChange={() => setViewConvo(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewConvo?.userName} × {viewConvo?.companion}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-3 p-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    <p>{m.content}</p>
                    <p className="text-[10px] mt-1 opacity-60">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminConversations;

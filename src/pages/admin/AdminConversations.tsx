import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, ChevronLeft, ChevronRight, Bot, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Conversation = {
  key: string;
  userId: string;
  userName: string;
  companion: string;
  totalMessages: number;
  firstMessage: string;
  lastMessage: string;
  type: "companion" | "user";
  otherUserName?: string;
};

type Message = { role: string; content: string; created_at: string; sender_id?: string };

const PAGE_SIZE = 15;

// Fetch all rows from a table, paginating past the 1000-row default limit
async function fetchAllRows(table: string, select: string, orderCol: string) {
  const rows: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select(select)
      .order(orderCol, { ascending: true })
      .range(from, from + batchSize - 1);
    if (error || !data || data.length === 0) break;
    rows.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return rows;
}

const AdminConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [viewConvo, setViewConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Fetch all data in parallel
      const [companionMsgs, profiles, userRooms, userMsgs] = await Promise.all([
        fetchAllRows("chat_messages", "*", "created_at"),
        (supabase as any).from("user_profiles").select("user_id, display_name").then((r: any) => r.data || []),
        (supabase as any).from("user_chat_rooms").select("*").then((r: any) => r.data || []),
        fetchAllRows("user_chat_messages", "*", "created_at"),
      ]);

      const nameMap: Record<string, string> = {};
      profiles.forEach((p: any) => { nameMap[p.user_id] = p.display_name || "Unknown"; });

      const convos: Conversation[] = [];

      // 1. Companion chats
      const companionGrouped: Record<string, any[]> = {};
      companionMsgs.forEach((m: any) => {
        const key = `companion__${m.user_id}__${m.companion_slug}`;
        if (!companionGrouped[key]) companionGrouped[key] = [];
        companionGrouped[key].push(m);
      });

      Object.entries(companionGrouped).forEach(([key, items]) => {
        convos.push({
          key,
          userId: items[0].user_id,
          userName: nameMap[items[0].user_id] || "Unknown",
          companion: items[0].companion_slug,
          totalMessages: items.length,
          firstMessage: items[0].created_at,
          lastMessage: items[items.length - 1].created_at,
          type: "companion",
        });
      });

      // 2. User-to-user chats
      const userMsgsByRoom: Record<string, any[]> = {};
      userMsgs.forEach((m: any) => {
        if (!userMsgsByRoom[m.room_id]) userMsgsByRoom[m.room_id] = [];
        userMsgsByRoom[m.room_id].push(m);
      });

      const roomMap: Record<string, any> = {};
      userRooms.forEach((r: any) => { roomMap[r.id] = r; });

      Object.entries(userMsgsByRoom).forEach(([roomId, items]) => {
        const room = roomMap[roomId];
        if (!room) return;
        convos.push({
          key: `user__${roomId}`,
          userId: room.user_a_id,
          userName: nameMap[room.user_a_id] || "Unknown",
          companion: nameMap[room.user_b_id] || "Unknown",
          otherUserName: nameMap[room.user_b_id] || "Unknown",
          totalMessages: items.length,
          firstMessage: items[0].created_at,
          lastMessage: items[items.length - 1].created_at,
          type: "user",
        });
      });

      convos.sort((a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime());
      setConversations(convos);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = conversations.filter(c => {
    const matchesTab = tab === "all" || c.type === tab;
    const matchesSearch = !search || 
      c.userName.toLowerCase().includes(search.toLowerCase()) || 
      c.companion.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const viewMessages = async (convo: Conversation) => {
    setViewConvo(convo);
    if (convo.type === "companion") {
      const { data } = await (supabase as any)
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("user_id", convo.userId)
        .eq("companion_slug", convo.companion)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    } else {
      const roomId = convo.key.replace("user__", "");
      const { data } = await (supabase as any)
        .from("user_chat_messages")
        .select("sender_id, content, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      setMessages((data || []).map((m: any) => ({
        role: m.sender_id === convo.userId ? "user" : "assistant",
        content: m.content,
        created_at: m.created_at,
        sender_id: m.sender_id,
      })));
    }
  };

  const companionCount = conversations.filter(c => c.type === "companion").length;
  const userCount = conversations.filter(c => c.type === "user").length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Conversations</h1>

      <Tabs value={tab} onValueChange={v => { setTab(v); setPage(0); }}>
        <TabsList>
          <TabsTrigger value="all">All ({conversations.length})</TabsTrigger>
          <TabsTrigger value="companion" className="gap-1.5"><Bot className="h-3.5 w-3.5" />Companion ({companionCount})</TabsTrigger>
          <TabsTrigger value="user" className="gap-1.5"><Users className="h-3.5 w-3.5" />User-to-User ({userCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by user or companion..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-10 rounded-xl" />
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>With</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : paged.map(c => (
                <TableRow key={c.key}>
                  <TableCell>
                    <Badge variant={c.type === "companion" ? "secondary" : "outline"} className="gap-1">
                      {c.type === "companion" ? <Bot className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {c.type === "companion" ? "AI" : "P2P"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{c.userName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.companion}</Badge>
                  </TableCell>
                  <TableCell>{c.totalMessages}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.firstMessage).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.lastMessage).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => viewMessages(c)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && paged.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No conversations</TableCell></TableRow>
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
            <DialogTitle className="flex items-center gap-2">
              {viewConvo?.type === "companion" ? <Bot className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {viewConvo?.userName} × {viewConvo?.companion}
            </DialogTitle>
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

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Send, ImagePlus, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";

type Thread = { user_id: string; display_name: string; last_msg: string; last_time: string; unread: number };
type Msg = { id: string; content: string; image_url: string | null; sender: string; created_at: string; user_id: string };

const AdminSupport = () => {
  const { session } = useAdminAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadThreads(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadThreads = async () => {
    const { data: msgs } = await (supabase as any).from("support_messages").select("*").order("created_at", { ascending: false });
    if (!msgs) { setLoading(false); return; }
    const { data: profiles } = await (supabase as any).from("user_profiles").select("user_id, display_name");
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.display_name || "User"; });

    const threadMap: Record<string, Thread> = {};
    (msgs as Msg[]).forEach((m) => {
      if (!threadMap[m.user_id]) {
        threadMap[m.user_id] = { user_id: m.user_id, display_name: nameMap[m.user_id] || "User", last_msg: m.content, last_time: m.created_at, unread: 0 };
      }
      if (m.sender === "user" && !(m as any).is_read) threadMap[m.user_id].unread++;
    });
    setThreads(Object.values(threadMap).sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime()));
    setLoading(false);
  };

  const openThread = async (userId: string) => {
    setSelected(userId);
    const { data } = await (supabase as any).from("support_messages").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    setMessages(data || []);
    // Mark as read
    await (supabase as any).from("support_messages").update({ is_read: true }).eq("user_id", userId).eq("sender", "user");
    loadThreads();
  };

  const sendReply = async () => {
    if (!input.trim() || !selected || !session?.user) return;
    setSending(true);
    await (supabase as any).from("support_messages").insert({
      user_id: selected, content: input.trim(), sender: "admin",
    });
    setInput("");
    await openThread(selected);
    setSending(false);
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Help & Support</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">
        {/* Thread list */}
        <Card className="overflow-y-auto p-0">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p className="text-sm">No support messages yet</p>
            </div>
          ) : threads.map((t) => (
            <button key={t.user_id} onClick={() => openThread(t.user_id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted transition-colors ${selected === t.user_id ? "bg-primary/10" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{t.display_name}</span>
                {t.unread > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{t.unread}</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{t.last_msg}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(t.last_time)}</p>
            </button>
          ))}
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2 flex flex-col p-0 overflow-hidden">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      msg.sender === "admin" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                    }`}>
                      {msg.image_url && <img src={msg.image_url} alt="" className="max-w-full rounded-xl mb-1.5 max-h-48 object-cover" />}
                      {msg.content !== "📷 Image" && <p className="text-sm">{msg.content}</p>}
                      <p className={`text-[10px] mt-1 ${msg.sender === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatTime(msg.created_at)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="Type your reply..." className="flex-1 rounded-xl bg-muted px-4 py-2.5 text-sm outline-none" />
                <button onClick={sendReply} disabled={sending || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Send className="h-4 w-4 text-primary-foreground" />}
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminSupport;

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, ImagePlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";

type SupportMsg = {
  id: string;
  content: string;
  image_url: string | null;
  sender: string;
  created_at: string;
};

const SupportPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [messages, setMessages] = useState<SupportMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session?.user) return;
    loadMessages();
    // Mark messages as read
    (supabase as any).from("support_messages").update({ is_read: true })
      .eq("user_id", session.user.id).eq("sender", "admin").eq("is_read", false).then(() => {});
    
    // Realtime subscription
    const channel = supabase.channel("support-" + session.user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${session.user.id}` },
        (payload: any) => {
          setMessages(prev => [...prev, payload.new as SupportMsg]);
          if (payload.new.sender === "admin") {
            (supabase as any).from("support_messages").update({ is_read: true }).eq("id", payload.new.id).then(() => {});
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadMessages = async () => {
    const { data } = await (supabase as any).from("support_messages")
      .select("*").eq("user_id", session!.user.id).order("created_at", { ascending: true });
    setMessages(data || []);
    setLoading(false);
  };

  const sendMessage = async (content: string, imageUrl?: string) => {
    if (!session?.user || (!content.trim() && !imageUrl)) return;
    setSending(true);
    await (supabase as any).from("support_messages").insert({
      user_id: session.user.id,
      content: content.trim() || "📷 Image",
      image_url: imageUrl || null,
      sender: "user",
    });
    setInput("");
    await loadMessages();
    setSending(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user) return;
    setSending(true);
    const ext = file.name.split(".").pop();
    const path = `support/${session.user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("companion-images").upload(path, file);
    if (error) { toast.error("Upload failed"); setSending(false); return; }
    const { data: urlData } = supabase.storage.from("companion-images").getPublicUrl(path);
    await sendMessage("", urlData.publicUrl);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <img src={logoIcon} alt="Support" className="h-9 w-9 rounded-full" />
        <div className="flex-1">
          <h1 className="text-sm font-bold">Help & Support</h1>
          <p className="text-[11px] text-green-500">We typically reply within minutes</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-sm font-bold">Hi there!</p>
            <p className="text-xs text-muted-foreground mt-1">How can we help you today? Send us a message.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm"
              }`}>
                {msg.image_url && (
                  <img src={msg.image_url} alt="attachment" className="max-w-full rounded-xl mb-1.5 max-h-48 object-cover" />
                )}
                {msg.content && msg.content !== "📷 Image" && (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
                <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button onClick={() => fileRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage(input)}
            placeholder="Type your message..."
            className="flex-1 rounded-xl bg-card px-4 py-2.5 text-sm outline-none border border-border focus:border-primary transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={sending || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-primary disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Send className="h-4 w-4 text-primary-foreground" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;

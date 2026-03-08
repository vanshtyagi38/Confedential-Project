import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Phone, Video, Image as ImageIcon, X, CheckCheck, Check, Loader2 } from "lucide-react";
import { companions } from "@/data/companions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MessageStatus = "sending" | "sent" | "delivered" | "seen";

type Message = {
  id: string;
  text: string;
  sender: "user" | "companion";
  time: string;
  imageUrl?: string;
  status?: MessageStatus;
};

type ChatContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
type ChatMsg = { role: "user" | "assistant"; content: ChatContent };

const quickReplies = ["Hey! 👋", "How are you?", "Tell me about yourself", "I'm bored 😴", "Make me laugh 😂"];

const getTimeString = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/companion-chat`;

// Humanized delay — short replies feel faster, long ones take more time
function getHumanDelay(isImage: boolean): number {
  if (isImage) return 1800 + Math.random() * 2200; // Images take longer to "look at"
  return 800 + Math.random() * 1200; // Natural thinking pause
}

function getStreamStartDelay(): number {
  // Simulate "reading & thinking" before typing starts
  return 400 + Math.random() * 600;
}

async function streamChat({
  messages,
  companionId,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  messages: ChatMsg[];
  companionId: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, companionId }),
    signal,
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: "Network error" }));
    onError(data.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) { onError("No response stream"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush remaining
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }
  onDone();
}

// Upload image to storage
async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from("chat-images").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });

  if (error) throw error;

  const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
  return data.publicUrl;
}

const StatusIcon = ({ status }: { status?: MessageStatus }) => {
  switch (status) {
    case "sending": return <Loader2 className="h-2.5 w-2.5 animate-spin text-primary-foreground/50" />;
    case "sent": return <Check className="h-2.5 w-2.5 text-primary-foreground/50" />;
    case "delivered": return <CheckCheck className="h-2.5 w-2.5 text-primary-foreground/50" />;
    case "seen": return <CheckCheck className="h-2.5 w-2.5 text-primary-foreground/80" />;
    default: return null;
  }
};

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companion = companions.find((c) => c.id === id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTextRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Track online status
  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => setOnline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, []);

  useEffect(() => {
    if (companion) {
      setMessages([{
        id: "intro",
        text: companion.bio,
        sender: "companion",
        time: getTimeString(),
      }]);
      setChatHistory([{ role: "assistant", content: companion.bio }]);
    }
  }, [companion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, streaming]);

  // Simulate status progression
  const progressStatus = useCallback((msgId: string) => {
    setTimeout(() => setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "sent" } : m)), 400 + Math.random() * 300);
    setTimeout(() => setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "delivered" } : m)), 1000 + Math.random() * 500);
    setTimeout(() => setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "seen" } : m)), 1800 + Math.random() * 1200);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearPendingImage = () => {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  if (!companion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Companion not found</p>
      </div>
    );
  }

  const sendMessage = async (text: string, retryMsg?: Message) => {
    if (streaming) return;
    const trimmed = text.trim();
    if (!trimmed && !pendingImage) return;
    setInput("");

    const hasImage = !!pendingImage;
    let imageUrl: string | undefined;
    const msgId = retryMsg?.id || Date.now().toString();

    // Show user message immediately
    if (!retryMsg) {
      const userMsg: Message = {
        id: msgId,
        text: trimmed,
        sender: "user",
        time: getTimeString(),
        imageUrl: pendingImagePreview || undefined,
        status: "sending",
      };
      setMessages((prev) => [...prev, userMsg]);
    } else {
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "sending" } : m));
    }

    // Upload image if present
    if (pendingImage) {
      try {
        imageUrl = await uploadImage(pendingImage);
        // Update message with real URL
        setMessages((prev) =>
          prev.map((m) => m.id === msgId ? { ...m, imageUrl } : m)
        );
      } catch (err) {
        toast.error("Failed to upload image. Try again.");
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "sent" } : m));
        return;
      }
      clearPendingImage();
    }

    progressStatus(msgId);

    // Build multimodal message for AI
    let userContent: ChatContent;
    if (imageUrl) {
      const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
      if (trimmed) parts.push({ type: "text", text: trimmed });
      parts.push({ type: "image_url", image_url: { url: imageUrl } });
      userContent = parts;
    } else {
      userContent = trimmed;
    }

    const newHistory: ChatMsg[] = [...chatHistory, { role: "user", content: userContent }];
    setChatHistory(newHistory);

    // Humanized delay before typing
    const thinkDelay = getHumanDelay(hasImage);
    setTyping(true);
    await new Promise((r) => setTimeout(r, thinkDelay));
    setTyping(false);

    // Small extra pause then start streaming
    await new Promise((r) => setTimeout(r, getStreamStartDelay()));
    setStreaming(true);
    streamTextRef.current = "";

    const companionMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: companionMsgId, text: "", sender: "companion", time: getTimeString() },
    ]);

    abortRef.current = new AbortController();

    try {
      await streamChat({
        messages: newHistory,
        companionId: companion.id,
        signal: abortRef.current.signal,
        onDelta: (chunk) => {
          streamTextRef.current += chunk;
          const currentText = streamTextRef.current;
          setMessages((prev) =>
            prev.map((m) => (m.id === companionMsgId ? { ...m, text: currentText } : m))
          );
        },
        onDone: () => {
          setStreaming(false);
          abortRef.current = null;
          setChatHistory((prev) => [
            ...prev,
            { role: "assistant", content: streamTextRef.current },
          ]);
        },
        onError: (err) => {
          setStreaming(false);
          abortRef.current = null;
          setMessages((prev) => prev.filter((m) => m.id !== companionMsgId));
          if (err.includes("429") || err.includes("Too many")) {
            toast.error("Too many messages! Wait a moment and try again.", { duration: 5000 });
          } else if (err.includes("402") || err.includes("credits")) {
            toast.error("AI credits exhausted. Please try again later.", { duration: 5000 });
          } else {
            toast.error(err, {
              action: { label: "Retry", onClick: () => sendMessage(trimmed) },
            });
          }
        },
      });
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setStreaming(false);
      setMessages((prev) => prev.filter((m) => m.id !== companionMsgId));
      toast.error("Connection lost. Check your internet.", {
        action: { label: "Retry", onClick: () => sendMessage(trimmed) },
      });
    }
  };

  return (
    <div className="mx-auto flex h-screen max-w-lg flex-col bg-background">
      {/* Offline banner */}
      {!online && (
        <div className="bg-destructive px-4 py-1.5 text-center text-xs font-medium text-destructive-foreground">
          You're offline. Messages will send when connected.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card px-3 py-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative">
          <img src={companion.image} alt={companion.name} className="h-10 w-10 rounded-full object-cover" />
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${online ? "bg-accent" : "bg-muted-foreground"}`} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold">{companion.name}</h2>
          <p className="text-[10px] text-muted-foreground">
            {typing ? (
              <span className="text-primary animate-pulse-soft">typing...</span>
            ) : streaming ? (
              <span className="text-accent animate-pulse-soft">replying...</span>
            ) : online ? (
              <>Online · ₹{companion.ratePerMin}/min</>
            ) : (
              "Offline"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-secondary p-2 transition-transform active:scale-90">
            <Phone className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="rounded-full bg-secondary p-2 transition-transform active:scale-90">
            <Video className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
          >
            {msg.sender === "companion" && (
              <img src={companion.image} alt="" className="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full object-cover" />
            )}
            <div
              className={`max-w-[75%] overflow-hidden rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-card shadow-card rounded-bl-md"
              }`}
            >
              {/* Image */}
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Shared"
                  className="max-h-60 w-full object-cover"
                  loading="lazy"
                />
              )}
              {/* Text */}
              {(msg.text || (!msg.imageUrl && msg.sender === "companion")) && (
                <div className="px-4 py-2.5">
                  <p className="whitespace-pre-wrap">{msg.text || "..."}</p>
                </div>
              )}
              {/* Footer */}
              <div className={`flex items-center gap-1 px-4 pb-2 ${!msg.text && msg.imageUrl ? "pt-1" : ""}`}>
                <p className={`text-[9px] ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
                {msg.sender === "user" && <StatusIcon status={msg.status} />}
              </div>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start animate-fade-in-up">
            <img src={companion.image} alt="" className="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full object-cover" />
            <div className="flex gap-1.5 rounded-2xl bg-card px-4 py-3 shadow-card rounded-bl-md">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary/60" />
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary/60" style={{ animationDelay: "0.2s" }} />
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary/60" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick replies */}
      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              onClick={() => sendMessage(qr)}
              className="shrink-0 rounded-full border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:bg-secondary active:scale-95"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Image preview */}
      {pendingImagePreview && (
        <div className="relative mx-4 mb-2">
          <div className="relative inline-block rounded-lg overflow-hidden border">
            <img src={pendingImagePreview} alt="Preview" className="max-h-32 object-cover" />
            <button
              onClick={clearPendingImage}
              className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background transition-transform active:scale-90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-card px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={streaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-90 disabled:opacity-40"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder={pendingImage ? "Add a caption..." : "Type a message..."}
            disabled={streaming}
            className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && !pendingImage) || streaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

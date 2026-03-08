import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Phone, Video } from "lucide-react";
import { companions } from "@/data/companions";
import { toast } from "sonner";

type Message = {
  id: string;
  text: string;
  sender: "user" | "companion";
  time: string;
};

type ChatMsg = { role: "user" | "assistant"; content: string };

const quickReplies = ["Hey! 👋", "How are you?", "Tell me about yourself", "What do you like?", "I'm bored 😴"];

const getTimeString = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/companion-chat`;

async function streamChat({
  messages,
  companionId,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMsg[];
  companionId: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, companionId }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: "Network error" }));
    onError(data.error || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("No response stream");
    return;
  }

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

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companion = companions.find((c) => c.id === id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTextRef = useRef("");

  useEffect(() => {
    if (companion) {
      setMessages([
        {
          id: "intro",
          text: companion.bio,
          sender: "companion",
          time: getTimeString(),
        },
      ]);
      setChatHistory([
        { role: "assistant", content: companion.bio },
      ]);
    }
  }, [companion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, streaming]);

  if (!companion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Companion not found</p>
      </div>
    );
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const trimmed = text.trim();
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmed,
      sender: "user",
      time: getTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const newHistory: ChatMsg[] = [...chatHistory, { role: "user", content: trimmed }];
    setChatHistory(newHistory);

    setTyping(true);
    streamTextRef.current = "";

    // Small delay to feel natural
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
    setTyping(false);
    setStreaming(true);

    // Create placeholder companion message
    const companionMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: companionMsgId, text: "", sender: "companion", time: getTimeString() },
    ]);

    try {
      await streamChat({
        messages: newHistory,
        companionId: companion.id,
        onDelta: (chunk) => {
          streamTextRef.current += chunk;
          const currentText = streamTextRef.current;
          setMessages((prev) =>
            prev.map((m) => (m.id === companionMsgId ? { ...m, text: currentText } : m))
          );
        },
        onDone: () => {
          setStreaming(false);
          setChatHistory((prev) => [
            ...prev,
            { role: "assistant", content: streamTextRef.current },
          ]);
        },
        onError: (err) => {
          setStreaming(false);
          // Remove empty companion message
          setMessages((prev) => prev.filter((m) => m.id !== companionMsgId));
          toast.error(err);
        },
      });
    } catch (e) {
      setStreaming(false);
      setMessages((prev) => prev.filter((m) => m.id !== companionMsgId));
      toast.error("Failed to get a response. Try again!");
    }
  };

  return (
    <div className="mx-auto flex h-screen max-w-lg flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card px-3 py-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative">
          <img
            src={companion.image}
            alt={companion.name}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-accent" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold">{companion.name}</h2>
          <p className="text-[10px] text-muted-foreground">
            {typing ? (
              <span className="text-primary animate-pulse-soft">typing...</span>
            ) : streaming ? (
              <span className="text-accent animate-pulse-soft">replying...</span>
            ) : (
              <>Online · ₹{companion.ratePerMin}/min</>
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
              <img
                src={companion.image}
                alt=""
                className="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full object-cover"
              />
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-card shadow-card rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text || "..."}</p>
              <p
                className={`mt-1 text-[9px] ${
                  msg.sender === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start animate-fade-in-up">
            <img
              src={companion.image}
              alt=""
              className="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full object-cover"
            />
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

      {/* Input */}
      <div className="border-t bg-card px-3 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Type a message..."
            disabled={streaming}
            className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

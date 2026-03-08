import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Phone, Video } from "lucide-react";
import { companions } from "@/data/companions";

type Message = {
  id: string;
  text: string;
  sender: "user" | "companion";
  time: string;
};

const quickReplies = ["Hey! 👋", "How are you?", "Tell me about yourself", "What do you like?"];

const getTimeString = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const generateReply = (name: string): string => {
  const replies = [
    `Haha, that's sweet! I'm glad you texted me 😊`,
    `Aww thanks! So tell me, what's on your mind today? 🤔`,
    `You're fun to talk to! I like that ✨`,
    `Hmm interesting... tell me more about yourself!`,
    `That made me smile 😄 You seem like a really cool person!`,
    `Oh wow, really? That's so cool! 🤩`,
    `Hehe, you're making me blush! Let's keep chatting 💬`,
    `I love this conversation! You have great energy ⚡`,
  ];
  return replies[Math.floor(Math.random() * replies.length)];
};

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companion = companions.find((c) => c.id === id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    }
  }, [companion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  if (!companion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Companion not found</p>
      </div>
    );
  }

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      time: getTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        text: generateReply(companion.name),
        sender: "companion",
        time: getTimeString(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1200 + Math.random() * 1500);
  };

  return (
    <div className="mx-auto flex h-screen max-w-lg flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card px-3 py-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <img
          src={companion.image}
          alt={companion.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h2 className="text-sm font-bold">{companion.name}</h2>
          <p className="text-[10px] text-muted-foreground">
            {typing ? "typing..." : "Online"} · ₹{companion.ratePerMin}/min
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full bg-secondary p-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="rounded-full bg-secondary p-2">
            <Video className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-card shadow-card rounded-bl-md"
              }`}
            >
              <p>{msg.text}</p>
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
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-card px-4 py-3 shadow-card rounded-bl-md">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground" />
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }} />
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick replies */}
      {messages.length <= 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              onClick={() => sendMessage(qr)}
              className="shrink-0 rounded-full border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
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
            className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
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

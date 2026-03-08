import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Phone, Video, Sparkles } from "lucide-react";
import { companions } from "@/data/companions";
import {
  type Mood,
  getInitialMood,
  transitionMood,
  generateSmartReply,
  getTypingDelay,
  shouldSendFollowUp,
  getFollowUpMessage,
} from "@/lib/chatEngine";

type Message = {
  id: string;
  text: string;
  sender: "user" | "companion";
  time: string;
};

const quickReplies = ["Hey! 👋", "How are you?", "Tell me about yourself", "What do you like?", "I'm bored 😴"];

const getTimeString = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const moodEmojis: Record<Mood, string> = {
  flirty: "😏",
  playful: "😄",
  shy: "🙈",
  sassy: "💅",
  caring: "🥰",
  moody: "🌧️",
  excited: "🤩",
  deep: "🌙",
};

const ChatPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companion = companions.find((c) => c.id === id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [mood, setMood] = useState<Mood>("playful");
  const [msgCount, setMsgCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (companion) {
      const initialMood = getInitialMood(companion);
      setMood(initialMood);
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

  const addCompanionMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        text,
        sender: "companion",
        time: getTimeString(),
      },
    ]);
  }, []);

  if (!companion) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Companion not found</p>
      </div>
    );
  }

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const newCount = msgCount + 1;
    setMsgCount(newCount);

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      time: getTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Transition mood
    const newMood = transitionMood(mood, newCount);
    setMood(newMood);

    const delay = getTypingDelay(newMood);

    setTimeout(() => {
      setTyping(false);
      const reply = generateSmartReply(text.trim(), companion, newMood, newCount);
      addCompanionMessage(reply);

      // Possible follow-up message (creates addictive "she's still thinking about you" feeling)
      if (shouldSendFollowUp(newCount, newMood)) {
        setTimeout(() => {
          setTyping(true);
          setTimeout(() => {
            setTyping(false);
            addCompanionMessage(getFollowUpMessage(newMood));
          }, 1500 + Math.random() * 1000);
        }, 2000 + Math.random() * 3000);
      }
    }, delay);
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
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold">{companion.name}</h2>
          <p className="text-[10px] text-muted-foreground">
            {typing ? (
              <span className="text-primary animate-pulse-soft">typing...</span>
            ) : (
              <>Online · {moodEmojis[mood]} · ₹{companion.ratePerMin}/min</>
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

      {/* Mood indicator */}
      <div className="flex items-center justify-center gap-1.5 bg-secondary/50 py-1.5 text-[10px] text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        <span>{companion.name} is feeling {mood} {moodEmojis[mood]}</span>
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
              className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-card shadow-card rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
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

import { useState, useRef, useEffect, useCallback } from "react";
import PageSEO from "@/components/PageSEO";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Send, Image as ImageIcon, X, CheckCheck, Check, Loader2, Clock, Zap, Ban, MoreVertical, Trash2, Flag, AlertTriangle, Smile } from "lucide-react";
import { useCompanionStatus } from "@/hooks/useCompanions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { updateStreak } from "@/lib/streakEngine";
import InstallAppPopup from "@/components/InstallAppPopup";
import { useRealtimeChat, useTypingIndicator } from "@/hooks/useRealtimeChat";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MessageStatus = "sending" | "sent" | "delivered" | "seen";

type Message = {
  id: string;
  text: string;
  sender: "user" | "companion" | "system";
  time: string;
  imageUrl?: string;
  status?: MessageStatus;
  selected?: boolean;
};

type ChatContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
type ChatMsg = { role: "user" | "assistant"; content: ChatContent };

const EMOJI_LIST = ["😊", "😂", "❤️", "🥰", "😍", "🔥", "💕", "😘", "👋", "🙈", "😏", "💫", "✨", "😎", "🥺", "💜"];
const quickReplies = ["Hey! 👋", "How are you?", "Tell me about yourself", "I'm bored 😴", "Make me laugh 😂"];

const getTimeString = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/companion-chat`;

// Human-like typing delay: ~40-60 WPM = ~1-1.5 sec per word
// Average response ~6-7 words → ~6-10 seconds total thinking + typing
function getHumanDelay(isImage: boolean): number {
  if (isImage) return 3000 + Math.random() * 3000; // 3-6s for image processing
  // Simulate "reading" the message + thinking
  return 2000 + Math.random() * 3000; // 2-5s reading/thinking delay
}

function getStreamStartDelay(): number {
  // Additional delay before starting to "type" — simulates typing start
  return 1500 + Math.random() * 2000; // 1.5-3.5s
}

async function streamChat({
  messages, companionId, companionMeta, userProfile, onDelta, onDone, onError, signal,
}: {
  messages: ChatMsg[];
  companionId: string;
  companionMeta: any;
  userProfile?: any;
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
    body: JSON.stringify({ messages, companionId, companionMeta, userProfile }),
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

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("chat-images").upload(path, file, {
    contentType: file.type, cacheControl: "3600",
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const { companion, loading: companionLoading, isBanned, isDeleted, banExpired } = useCompanionStatus(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [outOfBalance, setOutOfBalance] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(profile?.balance_minutes || 0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamTextRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const aiLockRef = useRef(false); // Prevents duplicate AI generation
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minutesUsedRef = useRef(0);
  const chatActiveRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes of inactivity stops billing
  const streakUpdatedRef = useRef(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const installPromptShownRef = useRef(false);
  const userMsgCountRef = useRef(0);
  const installThresholdRef = useRef(5 + Math.floor(Math.random() * 6));

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [deleteChatOpen, setDeleteChatOpen] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  // Load block state from localStorage on mount
  useEffect(() => {
    if (!companion) return;
    const key = `block_${session?.user?.id}_${companion.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const until = parseInt(stored, 10);
      if (Date.now() < until) {
        setBlockedUntil(until);
      } else {
        localStorage.removeItem(key);
      }
    }
  }, [companion, session?.user?.id]);

  // Timer to auto-clear block when expired
  useEffect(() => {
    if (!blockedUntil) return;
    const remaining = blockedUntil - Date.now();
    if (remaining <= 0) { setBlockedUntil(null); return; }
    const timer = setTimeout(() => setBlockedUntil(null), remaining);
    return () => clearTimeout(timer);
  }, [blockedUntil]);

  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;
  const blockMinutesLeft = isBlocked ? Math.ceil((blockedUntil! - Date.now()) / 60000) : 0;

  // Determine if this is a real user companion (no AI)
  const isRealUser = companion?.isRealUser === true;

  // Owner mode: current user IS the companion owner, viewing a chatter's conversation
  const chatWithUserId = searchParams.get("user");
  const isOwnerMode = isRealUser && !!chatWithUserId && companion?.ownerUserId === session?.user?.id;

  // The "conversation user" is the user who initiated chat with the companion
  // In normal mode: it's the current user. In owner mode: it's chatWithUserId.
  const conversationUserId = isOwnerMode ? chatWithUserId : session?.user?.id;

  // Real-time chat for real user companions
  const handleRealtimeMessage = useCallback((msg: any) => {
    if (!isRealUser) return;
    // In owner mode: messages from the chatter (role=user) are "companion" side for display
    // In normal mode: messages from the owner (role=assistant) are "companion" side
    const isFromOtherSide = isOwnerMode ? msg.role === "user" : msg.role === "assistant";
    if (!isFromOtherSide) return;
    // Also verify it belongs to this conversation
    if (msg.user_id !== conversationUserId) return;
    
    const newMsg: Message = {
      id: msg.id,
      text: msg.content,
      sender: "companion",
      time: new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      imageUrl: msg.image_url || undefined,
      status: "delivered",
    };
    setMessages((prev) => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, newMsg];
    });
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: "seen" } : m));
    }, 1500);
  }, [isRealUser, isOwnerMode, conversationUserId]);

  useRealtimeChat(
    isRealUser ? companion?.id : undefined,
    session?.user?.id,
    companion?.ownerUserId,
    handleRealtimeMessage
  );

  const { otherTyping, sendTyping } = useTypingIndicator(
    isRealUser ? companion?.id : undefined,
    session?.user?.id
  );

  // Online tracking
  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => setOnline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, []);

  // Load previous messages from DB
  useEffect(() => {
    if (!companion || !session?.user || !conversationUserId) return;
    const load = async () => {
      // Fetch latest 500 messages (descending), then reverse to ascending order
      const { data: rawData } = await (supabase as any)
        .from("chat_messages")
        .select("*")
        .eq("user_id", conversationUserId)
        .eq("companion_slug", companion.id)
        .order("created_at", { ascending: false })
        .limit(500);
      const data = rawData ? [...rawData].reverse() : null;

      if (data && data.length > 0) {
        const loaded: Message[] = data.map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: isOwnerMode
            ? (m.role === "assistant" ? "user" : "companion") // owner sees own replies as "user" side
            : (m.role === "user" ? "user" : "companion"),
          time: new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          imageUrl: m.image_url || undefined,
          status: "seen" as MessageStatus,
        }));
        const history: ChatMsg[] = data.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setMessages(loaded);
        setChatHistory(history);
      } else {
        if (!isOwnerMode) {
          setMessages([{
            id: "intro",
            text: companion.bio,
            sender: "companion",
            time: getTimeString(),
          }]);
          setChatHistory([{ role: "assistant", content: companion.bio }]);
        }
      }
    };
    load();
  }, [companion, session?.user, conversationUserId, isOwnerMode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, streaming, otherTyping]);

  useEffect(() => {
    if (isOwnerMode) return; // Owners don't pay balance
    setDisplayBalance(profile?.balance_minutes || 0);
    if ((profile?.balance_minutes || 0) <= 0) setOutOfBalance(true);
  }, [profile?.balance_minutes, isOwnerMode]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    chatActiveRef.current = false;
  }, []);

  const resetIdleTimeout = useCallback(() => {
    if (isOwnerMode) return;
    lastActivityRef.current = Date.now();
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = setTimeout(() => {
      // User idle for 2 min — stop billing
      stopTimer();
    }, IDLE_TIMEOUT_MS);
  }, [isOwnerMode, stopTimer]);

  const startTimer = useCallback(() => {
    if (isOwnerMode) return;
    resetIdleTimeout(); // Reset idle on every activity
    if (timerRef.current) return; // Already running
    chatActiveRef.current = true;
    timerRef.current = setInterval(() => {
      // Check if still active (not idle)
      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS) {
        stopTimer();
        return;
      }
      minutesUsedRef.current += 1;
      setDisplayBalance((prev) => {
        const next = Math.max(0, prev - 1);
        if (next <= 0) {
          setOutOfBalance(true);
          stopTimer(); // Stop billing when balance hits 0
        }
        return next;
      });
    }, 60000);
  }, [isOwnerMode, resetIdleTimeout, stopTimer]);

  // Save used minutes to DB — uses minutesUsedRef (actual minutes consumed)
  const saveUsedMinutes = useCallback(async () => {
    if (minutesUsedRef.current <= 0 || !session?.user?.id) return;
    const used = minutesUsedRef.current;
    minutesUsedRef.current = 0; // Reset to prevent double-saving
    // Atomically deduct: fetch current balance, subtract used, save
    const { data: currentProfile } = await (supabase as any)
      .from("user_profiles")
      .select("balance_minutes")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (currentProfile) {
      const newBalance = Math.max(0, currentProfile.balance_minutes - used);
      await (supabase as any)
        .from("user_profiles")
        .update({ balance_minutes: newBalance })
        .eq("user_id", session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (isOwnerMode) return;
    const handleUnload = () => {
      // Use sendBeacon for reliable save on tab close
      const used = minutesUsedRef.current;
      if (used > 0 && session?.user?.id) {
        saveUsedMinutes();
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      stopTimer();
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      saveUsedMinutes().then(() => refreshProfile());
    };
  }, [session?.user?.id, isOwnerMode, stopTimer, saveUsedMinutes, refreshProfile]);

  const saveMessage = async (companionSlug: string, role: string, content: string, userId?: string, imageUrl?: string) => {
    const uid = userId || session?.user?.id;
    if (!uid) return;
    await (supabase as any).from("chat_messages").insert({
      user_id: uid,
      companion_slug: companionSlug,
      role,
      content,
      image_url: imageUrl || null,
    });
  };

  const progressStatus = useCallback((msgId: string) => {
    setTimeout(() => setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "sent" } : m)), 400 + Math.random() * 300);
    setTimeout(() => setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "delivered" } : m)), 1000 + Math.random() * 500);
    setTimeout(() => setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "seen" } : m)), 1800 + Math.random() * 1200);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only image files supported"); return; }
    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearPendingImage = () => {
    if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const toggleSelectMessage = (msgId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (!session?.user || selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);
    await (supabase as any).from("chat_messages").delete().in("id", idsArray).eq("user_id", session.user.id);
    setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    toast.success(`${idsArray.length} message(s) deleted`);
  };

  const handleDeleteEntireChat = async () => {
    if (!session?.user || !companion) return;
    await (supabase as any).from("chat_messages").delete().eq("user_id", session.user.id).eq("companion_slug", companion.id);
    setMessages([]);
    setChatHistory([]);
    setDeleteChatOpen(false);
    toast.success("Chat deleted");
  };

  const handleReportCompanion = async () => {
    if (!session?.user || !companion || !reportReason.trim()) return;
    setReporting(true);
    await (supabase as any).from("companion_reports").insert({
      user_id: session.user.id,
      companion_slug: companion.id,
      reason: reportReason.trim(),
    });
    setReporting(false);
    setReportOpen(false);
    setReportReason("");
    toast.success("Report submitted. We'll review it shortly.");
  };

  const chatLocked = isBanned || (isDeleted && !banExpired);

  if (companionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!companion || (isDeleted && banExpired)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <p className="text-muted-foreground">This profile is no longer available</p>
        <button onClick={() => navigate("/")} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          Browse Companions
        </button>
      </div>
    );
  }

  const sendMessage = async (text: string) => {
    if (streaming || chatLocked || aiLockRef.current) return;
    if (isBlocked) {
      toast.error(`You're blocked for ${blockMinutesLeft} more minute(s). Please wait.`, { duration: 4000 });
      return;
    }
    const trimmed = text.trim();
    if (!trimmed && !pendingImage) return;

    // Only check balance for normal users (not companion owners)
    if (!isOwnerMode && outOfBalance) {
      toast.error("Out of chat minutes! Recharge to continue.", {
        action: { label: "Recharge", onClick: () => navigate("/recharge") },
      });
      return;
    }

    setInput("");
    setShowEmojiPicker(false);
    if (!isOwnerMode) startTimer();

    const hasImage = !!pendingImage;
    let imageUrl: string | undefined;
    const msgId = Date.now().toString();

    const userMsg: Message = {
      id: msgId,
      text: trimmed,
      sender: "user",
      time: getTimeString(),
      imageUrl: pendingImagePreview || undefined,
      status: "sending",
    };
    setMessages((prev) => [...prev, userMsg]);

    if (pendingImage) {
      try {
        imageUrl = await uploadImage(pendingImage);
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, imageUrl } : m));
      } catch {
        toast.error("Failed to upload image.");
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, status: "sent" } : m));
        return;
      }
      clearPendingImage();
    }

    progressStatus(msgId);

    // Install prompt (only for normal users)
    if (!isOwnerMode) {
      userMsgCountRef.current += 1;
      if (
        !installPromptShownRef.current &&
        userMsgCountRef.current >= installThresholdRef.current &&
        !window.matchMedia("(display-mode: standalone)").matches
      ) {
        installPromptShownRef.current = true;
        setTimeout(() => setShowInstallPopup(true), 2000);
      }
    }

    if (isOwnerMode) {
      // Companion owner replying: save as "assistant" under the chatter's user_id
      await saveMessage(companion.id, "assistant", trimmed || "[image]", conversationUserId!, imageUrl);
      if (isRealUser) sendTyping();
      return;
    }

    // Normal user sending message
    await saveMessage(companion.id, "user", trimmed || "[image]", undefined, imageUrl);

    if (!streakUpdatedRef.current && session?.user) {
      streakUpdatedRef.current = true;
      updateStreak(session.user.id).then(({ bonusAwarded, milestoneReached }) => {
        if (milestoneReached && bonusAwarded > 0) {
          toast.success(`🔥 Streak milestone! +${bonusAwarded} free minutes!`);
          refreshProfile();
        }
      });
    }

    // For real user companions, just save the message — no AI response
    if (isRealUser) {
      return;
    }

    // AI companion flow — acquire lock immediately to prevent duplicates
    aiLockRef.current = true;

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

    const thinkDelay = getHumanDelay(hasImage);
    setTyping(true);
    await new Promise((r) => setTimeout(r, thinkDelay));
    setTyping(false);

    await new Promise((r) => setTimeout(r, getStreamStartDelay()));
    setStreaming(true);
    streamTextRef.current = "";

    const companionMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: companionMsgId, text: "", sender: "companion", time: getTimeString() },
    ]);

    abortRef.current = new AbortController();

    const releaseLock = () => {
      aiLockRef.current = false;
      setStreaming(false);
      abortRef.current = null;
    };

    try {
      await streamChat({
        messages: newHistory.slice(-40),
        companionId: companion.id,
        companionMeta: {
          name: companion.name,
          age: companion.age,
          gender: companion.gender,
          tag: companion.tag,
          city: companion.city,
          languages: companion.languages,
          bio: companion.bio,
        },
        userProfile: profile ? {
          display_name: profile.display_name,
          gender: profile.gender,
          age: profile.age,
        } : undefined,
        signal: abortRef.current.signal,
        onDelta: (chunk) => {
          streamTextRef.current += chunk;
          const currentText = streamTextRef.current;
          // Intercept block tag during streaming — don't show it
          if (currentText.includes("[BLOCK_USER_30MIN]")) {
            // Abort the stream immediately
            abortRef.current?.abort();
            releaseLock();
            // Activate 30-min block
            const until = Date.now() + 30 * 60 * 1000;
            const key = `block_${session?.user?.id}_${companion.id}`;
            localStorage.setItem(key, until.toString());
            setBlockedUntil(until);
            // Remove streamed message, show system warning
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== companionMsgId),
              {
                id: `block-${Date.now()}`,
                text: `⚠️ ${companion.name} has blocked you for 30 minutes due to repeated inappropriate behavior. Please be respectful when chatting.`,
                sender: "system",
                time: getTimeString(),
              },
            ]);
            saveMessage(companion.id, "assistant", "[User blocked for 30 minutes due to abuse]");
            toast.error(`Blocked for 30 minutes by ${companion.name}`, { duration: 8000 });
            return;
          }
          // Filter out any partial block tag from display
          const displayText = currentText.replace(/\[BLOCK_USER_30MIN\]/g, "").trim();
          setMessages((prev) =>
            prev.map((m) => (m.id === companionMsgId ? { ...m, text: displayText } : m))
          );
        },
        onDone: () => {
          releaseLock();
          const finalText = streamTextRef.current.trim();
          
          // Double-check block tag in final text
          if (finalText.includes("[BLOCK_USER_30MIN]")) {
            const until = Date.now() + 30 * 60 * 1000;
            const key = `block_${session?.user?.id}_${companion.id}`;
            localStorage.setItem(key, until.toString());
            setBlockedUntil(until);
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== companionMsgId),
              {
                id: `block-${Date.now()}`,
                text: `⚠️ ${companion.name} has blocked you for 30 minutes due to repeated inappropriate behavior. Please be respectful when chatting.`,
                sender: "system",
                time: getTimeString(),
              },
            ]);
            saveMessage(companion.id, "assistant", "[User blocked for 30 minutes due to abuse]");
            toast.error(`Blocked for 30 minutes by ${companion.name}`, { duration: 8000 });
            return;
          }
          
          const cleanText = finalText.replace(/\[BLOCK_USER_30MIN\]/g, "").trim();
          if (cleanText) {
            setMessages((prev) =>
              prev.map((m) => (m.id === companionMsgId ? { ...m, text: cleanText } : m))
            );
            setChatHistory((prev) => [...prev, { role: "assistant", content: cleanText }]);
            saveMessage(companion.id, "assistant", cleanText);
          } else {
            setMessages((prev) => prev.filter((m) => m.id !== companionMsgId));
          }
        },
        onError: (err) => {
          releaseLock();
          setMessages((prev) => prev.filter((m) => m.id !== companionMsgId));
          if (err.includes("429")) {
            toast.error("Too many messages! Wait a moment.", { duration: 5000 });
          } else if (err.includes("402")) {
            toast.error("AI credits exhausted. Try again later.", { duration: 5000 });
          } else {
            toast.error(err, {
              action: { label: "Retry", onClick: () => sendMessage(trimmed) },
            });
          }
        },
      });
    } catch (e: any) {
      releaseLock();
      if (e.name === "AbortError") return;
      setMessages((prev) => prev.filter((m) => m.id !== companionMsgId));
      toast.error("Connection lost.", {
        action: { label: "Retry", onClick: () => sendMessage(trimmed) },
      });
    }
  };

  const showTypingIndicator = isRealUser ? otherTyping : typing;

  // Display name: in owner mode, show "User" or we could fetch their name
  const headerName = isOwnerMode ? "Chat" : companion.name;

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col bg-background">
      <PageSEO title={`Chat with ${companion?.name || 'Someone'} – SingleTape`} description={`Private chat with ${companion?.name || 'someone amazing'} on SingleTape. Safe, anonymous & fun.`} />
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
        <button className="relative" onClick={() => !isOwnerMode && setReportOpen(true)}>
          <img src={companion.image} alt={companion.name} className="h-10 w-10 rounded-full object-cover" />
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${online ? "bg-accent" : "bg-muted-foreground"}`} />
        </button>
        <button className="flex-1 text-left" onClick={() => !isOwnerMode && setReportOpen(true)}>
          <h2 className="text-sm font-bold">
            {companion.name}
            {isRealUser && <span className="ml-1 text-[10px] text-accent font-normal">● Real</span>}
            {isOwnerMode && <span className="ml-1 text-[10px] text-primary font-normal">● Your Profile</span>}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {showTypingIndicator ? (
              <span className="text-primary animate-pulse-soft">typing...</span>
            ) : streaming ? (
              <span className="text-accent animate-pulse-soft">replying...</span>
            ) : online ? (
              isOwnerMode ? "Replying as your companion" : <>Online · ₹{companion.ratePerMin}/min</>
            ) : "Offline"}
          </p>
        </button>
        {!isOwnerMode && (
          <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold">
            <Clock className="h-3 w-3 text-accent" />
            <span className={displayBalance <= 2 ? "text-destructive" : "text-foreground"}>
              {Math.floor(displayBalance)}m
            </span>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectMode(!selectMode)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {selectMode ? "Cancel Selection" : "Select Messages"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteChatOpen(true)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Entire Chat
            </DropdownMenuItem>
            {!isOwnerMode && (
              <DropdownMenuItem onClick={() => setReportOpen(true)} className="text-destructive">
                <Flag className="h-4 w-4 mr-2" />
                Report {companion.name}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Selection bar */}
      {selectMode && (
        <div className="flex items-center justify-between bg-secondary px-4 py-2">
          <span className="text-xs font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} className="text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="text-xs font-bold text-destructive disabled:opacity-40">Delete</button>
          </div>
        </div>
      )}

      {/* Banned banner */}
      {chatLocked && (
        <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-3">
          <Ban className="h-4 w-4 text-destructive" />
          <span className="text-xs font-bold text-destructive">
            {isBanned ? "🚫 This profile is banned for 24 hours" : "🚫 This profile has been removed"}
          </span>
        </div>
      )}

      {/* User blocked banner */}
      {isBlocked && !chatLocked && (
        <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-3">
          <Ban className="h-4 w-4 text-destructive" />
          <span className="text-xs font-bold text-destructive">
            🚫 You're blocked for {blockMinutesLeft} minute(s). Please be respectful.
          </span>
        </div>
      )}

      {!isOwnerMode && outOfBalance && !chatLocked && (
        <div className="flex items-center justify-between bg-destructive/10 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-destructive">
            <Zap className="h-4 w-4" />
            Out of chat minutes!
          </div>
          <button
            onClick={() => navigate("/recharge")}
            className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            Recharge
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          msg.sender === "system" ? (
            <div key={msg.id} className="flex justify-center animate-fade-in-up my-2">
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 max-w-[85%] text-center">
                <p className="text-xs font-medium text-destructive">{msg.text}</p>
                <p className="text-[9px] text-muted-foreground mt-1">{msg.time}</p>
              </div>
            </div>
          ) : (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in-up ${selectMode ? "cursor-pointer" : ""}`}
            onClick={() => selectMode && toggleSelectMessage(msg.id)}
          >
            {selectMode && (
              <div className={`flex items-center mr-2 ${msg.sender === "user" ? "order-1 ml-2 mr-0" : ""}`}>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedIds.has(msg.id) ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                  {selectedIds.has(msg.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
            )}
            {msg.sender === "companion" && !selectMode && (
              <img src={companion.image} alt="" className="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full object-cover" />
            )}
            <div
              className={`max-w-[75%] overflow-hidden rounded-2xl text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-card shadow-card rounded-bl-md"
              } ${selectedIds.has(msg.id) ? "ring-2 ring-primary" : ""}`}
            >
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Shared" className="max-h-60 w-full object-cover" loading="lazy" />
              )}
              {(msg.text || (!msg.imageUrl && msg.sender === "companion")) && (
                <div className="px-4 py-2.5">
                  <p className="whitespace-pre-wrap">{msg.text || "..."}</p>
                </div>
              )}
              <div className={`flex items-center gap-1 px-4 pb-2 ${!msg.text && msg.imageUrl ? "pt-1" : ""}`}>
                <p className={`text-[9px] ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
                {msg.sender === "user" && <StatusIcon status={msg.status} />}
              </div>
            </div>
          </div>
          )
        ))}

        {showTypingIndicator && (
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
      {!isOwnerMode && messages.length <= 1 && !outOfBalance && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-border/50 bg-background no-scrollbar">
          {quickReplies.map((qr) => (
            <button
              key={qr}
              onClick={() => sendMessage(qr)}
              className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:bg-secondary active:scale-95"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="flex flex-wrap gap-2 px-4 pb-2 animate-fade-in-up">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setInput((prev) => prev + emoji)}
              className="text-xl hover:scale-125 transition-transform active:scale-90"
            >
              {emoji}
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

      <InstallAppPopup open={showInstallPopup} onOpenChange={setShowInstallPopup} />

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Report {companion.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Tell us what's wrong. We'll review your report and take action.</p>
            <div className="space-y-2">
              {["Inappropriate content", "Spam / Bot behavior", "Harassment", "Other"].map((r) => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-left transition-colors ${reportReason === r ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-secondary text-muted-foreground"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            {reportReason === "Other" && (
              <textarea
                placeholder="Describe the issue..."
                onChange={(e) => setReportReason(e.target.value || "Other")}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none resize-none h-20"
              />
            )}
            <button
              onClick={handleReportCompanion}
              disabled={!reportReason.trim() || reporting}
              className="w-full rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground disabled:opacity-40"
            >
              {reporting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={deleteChatOpen} onOpenChange={setDeleteChatOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Entire Chat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will delete all messages with {companion.name}. This cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setDeleteChatOpen(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium">Cancel</button>
            <button onClick={handleDeleteEntireChat} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground">Delete</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Input */}
      <div className="border-t bg-card px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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
            disabled={streaming || isBlocked || (!isOwnerMode && outOfBalance)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-90 disabled:opacity-40"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={streaming || isBlocked || (!isOwnerMode && outOfBalance)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-90 disabled:opacity-40"
          >
            <Smile className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (isRealUser) sendTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder={
              isBlocked
                ? `Blocked for ${blockMinutesLeft} min...`
                : !isOwnerMode && outOfBalance
                ? "Recharge to continue chatting..."
                : pendingImage
                ? "Add a caption..."
                : isOwnerMode
                ? "Reply as your companion..."
                : "Type a message..."
            }
            disabled={streaming || isBlocked || (!isOwnerMode && outOfBalance)}
            className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && !pendingImage) || streaming || isBlocked || (!isOwnerMode && outOfBalance)}
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

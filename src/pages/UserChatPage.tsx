import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Image as ImageIcon, X, CheckCheck, Check, Loader2, Ban, MoreVertical, Trash2, AlertTriangle, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  sender: "me" | "them";
  time: string;
  imageUrl?: string;
  status?: MessageStatus;
};

const EMOJI_LIST = ["😊", "😂", "❤️", "🥰", "😍", "🔥", "💕", "😘", "👋", "🙈", "😏", "💫", "✨", "😎", "🥺", "💜"];

const getTimeString = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `user-chats/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

interface UserChatPageProps {
  embedded?: boolean;
  embeddedRoomId?: string;
}

const UserChatPage = ({ embedded = false, embeddedRoomId }: UserChatPageProps = {}) => {
  const { roomId: paramRoomId } = useParams<{ roomId: string }>();
  const roomId = embedded ? embeddedRoomId : paramRoomId;
  const navigate = useNavigate();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{ id: string; display_name: string | null; image_url: string | null } | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteChatOpen, setDeleteChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);

  const userId = session?.user?.id;

  // Load room info and other user
  useEffect(() => {
    if (!roomId || !userId) return;
    const loadRoom = async () => {
      const { data: room } = await (supabase as any)
        .from("user_chat_rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (!room) {
        toast.error("Chat not found");
        navigate("/chats");
        return;
      }

      const otherUserId = room.user_a_id === userId ? room.user_b_id : room.user_a_id;

      const { data: profile } = await (supabase as any)
        .from("user_profiles")
        .select("user_id, display_name, image_url")
        .eq("user_id", otherUserId)
        .maybeSingle();

      setOtherUser(profile || { id: otherUserId, display_name: "User", image_url: null });

      // Check blocks
      const { data: myBlock } = await (supabase as any)
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", userId)
        .eq("blocked_id", otherUserId)
        .maybeSingle();
      setIsBlocked(!!myBlock);

      // Check if other user blocked me (try to send a message and it'll fail, but we check room access)
      const { data: theirBlock } = await (supabase as any)
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", otherUserId)
        .eq("blocked_id", userId)
        .maybeSingle();
      setIsBlockedByOther(!!theirBlock);

      // Load messages (latest 20 first, then load more on scroll)
      const { data: msgs } = await (supabase as any)
        .from("user_chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (msgs) {
        const loaded: Message[] = msgs.reverse().map((m: any) => ({
          id: m.id,
          text: m.content,
          sender: m.sender_id === userId ? "me" : "them",
          time: new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          imageUrl: m.image_url || undefined,
          status: "seen" as MessageStatus,
        }));
        setMessages(loaded);
      }
      setLoading(false);
    };
    loadRoom();
  }, [roomId, userId]);

  // Realtime subscription
  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase
      .channel(`user-chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          const msg = payload.new;
          if (msg.sender_id === userId) return; // already added locally
          const newMsg: Message = {
            id: msg.id,
            text: msg.content,
            sender: "them",
            time: new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            imageUrl: msg.image_url || undefined,
            status: "delivered",
          };
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [roomId, userId]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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

  const sendMessage = async (text: string) => {
    if (!userId || !roomId) return;
    const trimmed = text.trim();
    if (!trimmed && !pendingImage) return;
    if (isBlocked || isBlockedByOther) {
      toast.error("This chat is blocked");
      return;
    }

    setInput("");
    setShowEmojiPicker(false);

    let imageUrl: string | undefined;
    const msgId = crypto.randomUUID();

    const userMsg: Message = {
      id: msgId,
      text: trimmed,
      sender: "me",
      time: getTimeString(),
      imageUrl: pendingImagePreview || undefined,
      status: "sending",
    };

    setMessages(prev => [...prev, userMsg]);

    if (pendingImage) {
      try {
        imageUrl = await uploadImage(pendingImage);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, imageUrl } : m));
      } catch {
        toast.error("Failed to upload image");
        return;
      }
      clearPendingImage();
    }

    // Insert into DB
    const { error } = await (supabase as any).from("user_chat_messages").insert({
      room_id: roomId,
      sender_id: userId,
      content: trimmed || "[image]",
      image_url: imageUrl || null,
    });

    if (error) {
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m.id !== msgId));
      return;
    }

    // Progress status
    setTimeout(() => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "sent" } : m)), 400);
    setTimeout(() => setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "delivered" } : m)), 1000);
  };

  const handleBlock = async () => {
    if (!userId || !otherUser) return;
    await (supabase as any).from("user_blocks").insert({
      blocker_id: userId,
      blocked_id: otherUser.id,
    });
    setIsBlocked(true);
    setBlockDialogOpen(false);
    toast.success("User blocked");
  };

  const handleUnblock = async () => {
    if (!userId || !otherUser) return;
    await (supabase as any).from("user_blocks").delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", otherUser.id);
    setIsBlocked(false);
    toast.success("User unblocked");
  };

  const handleDeleteChat = async () => {
    if (!roomId) return;
    // Delete all messages in the room (RLS ensures only room participants)
    await (supabase as any).from("user_chat_messages").delete().eq("room_id", roomId);
    setMessages([]);
    setDeleteChatOpen(false);
    toast.success("Chat cleared");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const chatBlocked = isBlocked || isBlockedByOther;
  const otherName = otherUser?.display_name || "User";

  return (
    <div className={`mx-auto flex ${embedded ? "h-full" : "h-[100dvh]"} w-full ${embedded ? "" : "max-w-2xl"} flex-col bg-background`}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-card px-3 py-3">
        {!embedded && (
          <button onClick={() => navigate("/chats")} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="relative">
          {otherUser?.image_url ? (
            <img src={otherUser.image_url} alt={otherName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
              {otherName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 text-left">
          <h2 className="text-sm font-bold">{otherName}</h2>
          <p className="text-[10px] text-muted-foreground">
            {chatBlocked ? "Blocked" : "User Chat"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isBlocked ? (
              <DropdownMenuItem onClick={handleUnblock}>
                <Ban className="h-4 w-4 mr-2" />
                Unblock User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setBlockDialogOpen(true)} className="text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setDeleteChatOpen(true)} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Blocked banner */}
      {chatBlocked && (
        <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-3">
          <Ban className="h-4 w-4 text-destructive" />
          <span className="text-xs font-bold text-destructive">
            {isBlocked ? "You blocked this user" : "You've been blocked by this user"}
          </span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-muted-foreground">Say hi to start the conversation! 👋</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-fade-in-up`}
          >
            {msg.sender === "them" && (
              otherUser?.image_url ? (
                <img src={otherUser.image_url} alt="" className="mr-2 mt-1 h-7 w-7 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {otherName.charAt(0)}
                </div>
              )
            )}
            <div
              className={`max-w-[75%] overflow-hidden rounded-2xl text-sm leading-relaxed ${
                msg.sender === "me"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-card shadow-card rounded-bl-md"
              }`}
            >
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Shared" className="max-h-60 w-full object-cover" loading="lazy" />
              )}
              {msg.text && msg.text !== "[image]" && (
                <div className="px-4 py-2.5">
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              )}
              <div className={`flex items-center gap-1 px-4 pb-2 ${!msg.text && msg.imageUrl ? "pt-1" : ""}`}>
                <p className={`text-[9px] ${msg.sender === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
                {msg.sender === "me" && <StatusIcon status={msg.status} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="flex flex-wrap gap-2 px-4 pb-2 animate-fade-in-up">
          {EMOJI_LIST.map((emoji) => (
            <button key={emoji} onClick={() => setInput(prev => prev + emoji)} className="text-xl hover:scale-125 transition-transform active:scale-90">
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
            <button onClick={clearPendingImage} className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-background transition-transform active:scale-90">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Block Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Block {otherName}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">They won't be able to send you messages. You can unblock them later.</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setBlockDialogOpen(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium">Cancel</button>
            <button onClick={handleBlock} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground">Block</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Dialog */}
      <Dialog open={deleteChatOpen} onOpenChange={setDeleteChatOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Clear Chat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will delete all messages. This cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setDeleteChatOpen(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium">Cancel</button>
            <button onClick={handleDeleteChat} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground">Delete</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Input */}
      <div className="border-t bg-card px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={chatBlocked}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-90 disabled:opacity-40"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={chatBlocked}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-90 disabled:opacity-40"
          >
            <Smile className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder={chatBlocked ? "Chat blocked" : "Type a message..."}
            disabled={chatBlocked}
            className="flex-1 rounded-full bg-secondary px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && !pendingImage) || chatBlocked}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground transition-transform active:scale-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserChatPage;

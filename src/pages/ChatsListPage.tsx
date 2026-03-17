import { useState, useEffect } from "react";
import PageSEO from "@/components/PageSEO";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Heart, Sparkles, Flame, ArrowRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCompanions } from "@/hooks/useCompanions";
import onboardBoy from "@/assets/onboard-boy.png";
import onboardGirl from "@/assets/onboard-girl.png";

type ChatPreview = {
  companion_slug: string;
  last_message: string;
  last_time: string;
  companion_name: string;
  companion_image: string;
};


type UserChatPreview = {
  room_id: string;
  other_user_id: string;
  other_name: string;
  other_image: string | null;
  other_gender: string;
  last_message: string;
  last_time: string;
};

const hookLines = [
  "Chat with 1 more… maybe she'll be your true love 💘",
  "Your soulmate is just one chat away ✨",
  "Don't stop now… the best conversations await 🔥",
  "One more chat could change everything 💫",
  "Love finds you when you least expect it 💝",
  "She's waiting for your first message… 👀",
  "The next chat might be the one you remember forever 🌙",
];

const ChatsListPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { companions, getCompanionBySlug } = useCompanions();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  
  const [userChats, setUserChats] = useState<UserChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [hookIndex] = useState(() => Math.floor(Math.random() * hookLines.length));


  useEffect(() => {
    if (!session?.user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("chat_messages")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (data) {
        const chatMap = new Map<string, any>();
        data.forEach((msg: any) => {
          if (!chatMap.has(msg.companion_slug)) {
            chatMap.set(msg.companion_slug, msg);
          }
        });

        const previews: ChatPreview[] = [];
        chatMap.forEach((msg, slug) => {
          const companion = getCompanionBySlug(slug);
          previews.push({
            companion_slug: slug,
            last_message: msg.content,
            last_time: new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            companion_name: companion?.name || slug,
            companion_image: companion?.image || "",
          });
        });
        setChats(previews);
      }
      setLoading(false);
    };
    load();
  }, [session?.user, getCompanionBySlug]);

  // Load user-to-user chats
  useEffect(() => {
    if (!session?.user) return;
    const loadUserChats = async () => {
      const userId = session.user.id;
      const { data: rooms } = await (supabase as any)
        .from("user_chat_rooms")
        .select("*")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      if (!rooms || rooms.length === 0) return;

      // Batch fetch all other user IDs
      const otherUserIds = rooms.map((room: any) => 
        room.user_a_id === userId ? room.user_b_id : room.user_a_id
      );

      // Fetch all profiles at once
      const { data: profiles } = await (supabase as any)
        .from("user_profiles")
        .select("user_id, display_name, image_url, gender")
        .in("user_id", otherUserIds);

      const profileMap = new Map<string, any>();
      (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p));

      // Fetch last messages for all rooms at once
      const roomIds = rooms.map((r: any) => r.id);
      const { data: allMessages } = await (supabase as any)
        .from("user_chat_messages")
        .select("room_id, content, created_at")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false });

      const lastMsgMap = new Map<string, any>();
      (allMessages || []).forEach((m: any) => {
        if (!lastMsgMap.has(m.room_id)) lastMsgMap.set(m.room_id, m);
      });

      const previews: UserChatPreview[] = rooms.map((room: any) => {
        const otherUserId = room.user_a_id === userId ? room.user_b_id : room.user_a_id;
        const profile = profileMap.get(otherUserId);
        const lastMsg = lastMsgMap.get(room.id);
        return {
          room_id: room.id,
          other_user_id: otherUserId,
          other_name: profile?.display_name || "User",
          other_image: profile?.image_url || null,
          other_gender: profile?.gender || "male",
          last_message: lastMsg?.content || "No messages yet",
          last_time: lastMsg?.created_at
            ? new Date(lastMsg.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
            : "",
        };
      });
      setUserChats(previews);
    };
    loadUserChats();
  }, [session?.user]);


  const chattedSlugs = new Set(chats.map((c) => c.companion_slug));
  const suggestions = companions
    .filter((c) => !chattedSlugs.has(c.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const getAvatar = (chat: UserChatPreview) => {
    if (chat.other_image) return chat.other_image;
    return chat.other_gender === "male" ? onboardBoy : onboardGirl;
  };

  // Merged list: all companion chats + user chats combined as "Love Birds"
  const totalActive = chats.length + userChats.length;

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-extrabold">Love Birds 💕</h1>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {totalActive} active
          </span>
        </div>

      </div>

      <div className="mx-4 mt-3 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <Heart className="h-4 w-4 text-primary" fill="currentColor" />
          </div>
          <p className="text-xs font-semibold text-foreground leading-tight">
            {hookLines[hookIndex]}
          </p>
        </div>
      </div>

      {/* Merged Love Birds section: companion chats + user chats */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : totalActive === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <div className="relative mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Flame className="h-10 w-10 text-primary" />
            </div>
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground font-bold animate-bounce">!</span>
          </div>
          <h3 className="text-base font-extrabold">No chats yet… but why? 🤔</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-[260px]">
            Your perfect match is already online. Start your first conversation — it could be the beginning of something amazing!
          </p>
          <button onClick={() => navigate("/")} className="mt-5 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition-transform active:scale-95">
            <Sparkles className="h-4 w-4" />
            Find Love Birds
          </button>
        </div>
      ) : (
        <div className="px-4 mt-2 space-y-1">
          {/* User-to-user chats first */}
          {userChats.map((chat, i) => (
            <button
              key={chat.room_id}
              onClick={() => navigate(`/user-chat/${chat.room_id}`)}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-card active:scale-[0.98] animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative">
                <img src={getAvatar(chat)} alt={chat.other_name} className="h-13 w-13 rounded-full object-cover ring-2 ring-accent/20" style={{ width: 52, height: 52 }} />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold">{chat.other_name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">Person</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{chat.last_time}</p>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{chat.last_message}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}

          {/* Companion chats */}
          {chats.map((chat, i) => (
            <button
              key={chat.companion_slug}
              onClick={() => navigate(`/chat/${chat.companion_slug}`)}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-card active:scale-[0.98] animate-fade-in-up"
              style={{ animationDelay: `${(userChats.length + i) * 50}ms` }}
            >
              <div className="relative">
                <img src={chat.companion_image} alt={chat.companion_name} className="h-13 w-13 rounded-full object-cover ring-2 ring-primary/20" style={{ width: 52, height: 52 }} />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{chat.companion_name}</p>
                  <p className="text-[10px] text-muted-foreground">{chat.last_time}</p>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{chat.last_message}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <div className="px-4 mt-4">
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <p className="text-xs font-extrabold text-foreground">
                {totalActive > 0 ? "Chat with someone new today! 💕" : "Trending love birds near you 🔥"}
              </p>
            </div>
            <div className="flex gap-3">
              {suggestions.map((c) => (
                <button key={c.id} onClick={() => navigate(`/chat/${c.id}`)} className="flex-1 flex flex-col items-center gap-1.5 rounded-xl bg-secondary/50 p-2.5 transition-transform active:scale-95">
                  <div className="relative">
                    <img src={c.image} alt={c.name} className="h-14 w-14 rounded-full object-cover ring-2 ring-accent/30" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                  </div>
                  <p className="text-[11px] font-bold truncate w-full text-center">{c.name}</p>
                  <span className="text-[9px] text-accent font-semibold">Online now</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3 px-4 leading-relaxed">
            💫 Every conversation is a chance to find someone special. Don't let it slip away!
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ChatsListPage;

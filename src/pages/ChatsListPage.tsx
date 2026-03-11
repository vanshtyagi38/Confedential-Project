import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Heart, Sparkles, Flame, ArrowRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCompanions } from "@/hooks/useCompanions";

type ChatPreview = {
  companion_slug: string;
  last_message: string;
  last_time: string;
  companion_name: string;
  companion_image: string;
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

  const chattedSlugs = new Set(chats.map((c) => c.companion_slug));
  const suggestions = companions
    .filter((c) => !chattedSlugs.has(c.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-extrabold">Your Chats</h1>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {chats.length} active
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

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : chats.length === 0 ? (
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
            Explore Companions
          </button>
        </div>
      ) : (
        <div className="px-4 mt-2 space-y-1">
          {chats.map((chat, i) => (
            <button
              key={chat.companion_slug}
              onClick={() => navigate(`/chat/${chat.companion_slug}`)}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:bg-card active:scale-[0.98] animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms` }}
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
                {chats.length > 0 ? "Chat with someone new today! 💕" : "Trending companions near you 🔥"}
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

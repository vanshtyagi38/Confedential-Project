import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getCompanionById } from "@/data/companions";

type ChatPreview = {
  companion_slug: string;
  last_message: string;
  last_time: string;
  companion_name: string;
  companion_image: string;
};

const ChatsListPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

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
          const companion = getCompanionById(slug);
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
  }, [session?.user]);

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
      <div className="px-4 py-4">
        <h1 className="text-lg font-bold">Your Chats 💬</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-semibold">No chats yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start chatting with a companion from the home screen!
          </p>
        </div>
      ) : (
        <div className="space-y-1 px-4">
          {chats.map((chat) => (
            <button
              key={chat.companion_slug}
              onClick={() => navigate(`/chat/${chat.companion_slug}`)}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-card active:scale-[0.98]"
            >
              <img
                src={chat.companion_image}
                alt={chat.companion_name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{chat.companion_name}</p>
                  <p className="text-[10px] text-muted-foreground">{chat.last_time}</p>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {chat.last_message}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ChatsListPage;

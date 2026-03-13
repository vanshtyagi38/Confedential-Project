import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, MapPin, MessageCircle, Circle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import onboardBoy from "@/assets/onboard-boy.png";
import onboardGirl from "@/assets/onboard-girl.png";

type OnlineUser = {
  user_id: string;
  display_name: string | null;
  gender: string;
  age: number;
  city: string | null;
  image_url: string | null;
  user_status: string;
};

const ActiveUsers = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("user_profiles")
        .select("user_id, display_name, gender, age, city, image_url, user_status")
        .eq("user_status", "online");
      
      if (data) {
        // Filter out current user
        setUsers(data.filter((u: OnlineUser) => u.user_id !== session?.user?.id));
      }
    };
    load();

    // Refresh every 30s
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const startChat = async (otherUserId: string) => {
    if (!session?.user?.id || starting) return;
    setStarting(true);
    const myId = session.user.id;

    // Check for blocks
    const { data: blocked } = await (supabase as any)
      .from("user_blocks")
      .select("id")
      .or(`and(blocker_id.eq.${myId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${myId})`)
      .limit(1);

    if (blocked && blocked.length > 0) {
      toast.error("Cannot chat with this user");
      setStarting(false);
      return;
    }

    // Check existing room (either direction)
    const { data: existing } = await (supabase as any)
      .from("user_chat_rooms")
      .select("id")
      .or(`and(user_a_id.eq.${myId},user_b_id.eq.${otherUserId}),and(user_a_id.eq.${otherUserId},user_b_id.eq.${myId})`)
      .maybeSingle();

    if (existing) {
      navigate(`/user-chat/${existing.id}`);
      setSelectedUser(null);
      setStarting(false);
      return;
    }

    // Create new room
    const { data: newRoom, error } = await (supabase as any)
      .from("user_chat_rooms")
      .insert({ user_a_id: myId, user_b_id: otherUserId })
      .select("id")
      .single();

    if (error) {
      toast.error("Failed to start chat");
      setStarting(false);
      return;
    }

    navigate(`/user-chat/${newRoom.id}`);
    setSelectedUser(null);
    setStarting(false);
  };

  const getAvatar = (user: OnlineUser) => {
    if (user.image_url) return user.image_url;
    return user.gender === "male" ? onboardBoy : onboardGirl;
  };

  if (users.length === 0) return null;

  return (
    <>
      <div className="mt-5 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">Users Online</h2>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">{users.length}</span>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {users.map((user) => (
            <button
              key={user.user_id}
              onClick={() => setSelectedUser(user)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-accent to-primary shadow-[0_2px_12px_-2px_hsl(var(--accent)/0.35)]">
                <div className="h-[62px] w-[62px] rounded-full border-[2.5px] border-background overflow-hidden transition-transform duration-200 group-hover:scale-105">
                  <img src={getAvatar(user)} alt={user.display_name || "User"} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 animate-pulse-soft" />
              </div>
              <span className="text-[11px] font-medium text-foreground max-w-[68px] truncate">
                {user.display_name || "User"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Preview Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="w-[340px] max-w-[92vw] rounded-[20px] p-0 overflow-hidden border-border/40 shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.2)]">
          <DialogTitle className="sr-only">{selectedUser?.display_name}</DialogTitle>
          {selectedUser && (
            <>
              <div className="relative h-56 w-full">
                <img src={getAvatar(selectedUser)} alt={selectedUser.display_name || "User"} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {selectedUser.display_name || "User"}, {selectedUser.age}
                    </h3>
                    <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500 animate-pulse-soft" />
                  </div>
                  {selectedUser.city && (
                    <div className="flex items-center gap-1 mt-0.5 text-white/80 text-xs">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedUser.city}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 pt-3 pb-4 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
                    {selectedUser.gender === "male" ? "👦 Boy" : "👧 Girl"}
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">
                    ● Online Now
                  </span>
                </div>

                <button
                  onClick={() => startChat(selectedUser.user_id)}
                  disabled={starting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.4)] transition-all duration-200 hover:shadow-[0_6px_24px_-4px_hsl(var(--primary)/0.5)] active:scale-[0.97] disabled:opacity-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  {starting ? "Starting..." : "Start Chat"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActiveUsers;

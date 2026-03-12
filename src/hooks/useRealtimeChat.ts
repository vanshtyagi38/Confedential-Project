import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type RealtimeMessage = {
  id: string;
  user_id: string;
  companion_slug: string;
  role: string;
  content: string;
  image_url: string | null;
  created_at: string;
};

export function useRealtimeChat(
  companionSlug: string | undefined,
  userId: string | undefined,
  ownerUserId: string | null | undefined,
  onNewMessage: (msg: RealtimeMessage) => void
) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!companionSlug || !userId) return;

    // Subscribe to new messages for this companion from the owner
    const channel = supabase
      .channel(`chat-${companionSlug}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `companion_slug=eq.${companionSlug}`,
        },
        (payload: any) => {
          const msg = payload.new as RealtimeMessage;
          // Only handle messages from the OTHER user
          if (msg.user_id !== userId) {
            onNewMessage(msg);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [companionSlug, userId, onNewMessage]);
}

export function useTypingIndicator(companionSlug: string | undefined, userId: string | undefined) {
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!companionSlug || !userId) return;

    const channel = supabase.channel(`typing-${companionSlug}`, {
      config: { presence: { key: userId } },
    });

    channel.on("broadcast", { event: "typing" }, (payload: any) => {
      if (payload.payload?.user_id !== userId) {
        setOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
      }
    }).subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [companionSlug, userId]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !userId) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: userId },
    });
  }, [userId]);

  return { otherTyping, sendTyping };
}

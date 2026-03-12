import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    const load = async () => {
      const { data } = await (supabase as any)
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };
    load();

    // Subscribe to new notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload: any) => {
          const notif = payload.new;
          if (notif.target === "all" || (notif.target_user_ids && notif.target_user_ids.includes(session.user.id))) {
            setNotifications((prev) => [notif, ...prev]);
            // Show browser notification if permitted
            if (Notification.permission === "granted") {
              new Notification(notif.title, {
                body: notif.message,
                icon: "/pwa-192.png",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const requestPermission = async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  };

  return { notifications, requestPermission };
}

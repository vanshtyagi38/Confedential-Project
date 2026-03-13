import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    const load = async () => {
      // Only fetch notifications from the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase as any)
        .from("admin_notifications")
        .select("*")
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };
    load();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload: any) => {
          const notif = payload.new;
          if (notif.target === "all" || (notif.target_user_ids && notif.target_user_ids.includes(session.user.id))) {
            setNotifications((prev) => [notif, ...prev]);
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

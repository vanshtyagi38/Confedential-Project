import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Bell, Send, Loader2, Users, User } from "lucide-react";

type UserOption = { id: string; display_name: string; email: string };

const AdminNotifications = () => {
  const { logAction } = useAdminAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("announcement");
  const [target, setTarget] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Load users for targeting
    (supabase as any).from("user_profiles").select("user_id, display_name, email")
      .then(({ data }: any) => {
        if (data) setUsers(data.map((u: any) => ({ id: u.user_id, display_name: u.display_name || "User", email: u.email || "" })));
      });

    // Load notification history
    (supabase as any).from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }: any) => {
        if (data) setHistory(data);
      });
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);

    const { data: session } = await supabase.auth.getSession();
    const adminId = session?.session?.user?.id;

    const notifData: any = {
      title: title.trim(),
      message: message.trim(),
      link: link.trim() || null,
      type,
      target,
      target_user_ids: target === "specific" && selectedUserId ? [selectedUserId] : [],
      sent_by: adminId,
    };

    const { error } = await (supabase as any).from("admin_notifications").insert(notifData);

    if (error) {
      toast.error("Failed to send notification");
    } else {
      toast.success("Notification sent! 🔔");
      await logAction("send_notification", "notification", null, { title, target, type });
      setTitle("");
      setMessage("");
      setLink("");
      // Refresh history
      const { data } = await (supabase as any).from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(50);
      if (data) setHistory(data);
    }
    setSending(false);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold flex items-center gap-2">
        <Bell className="h-6 w-6 text-primary" />
        Notifications
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Send Form */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold">Send Notification</h2>

          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
          </div>

          <div>
            <Label>Message *</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." rows={3} />
          </div>

          <div>
            <Label>Link (optional)</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">📢 Announcement</SelectItem>
                  <SelectItem value="promotion">🎉 Promotion</SelectItem>
                  <SelectItem value="reminder">⏰ Reminder</SelectItem>
                  <SelectItem value="alert">🚨 Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Send To</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="specific">Specific User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {target === "specific" && (
            <div>
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger><SelectValue placeholder="Choose user..." /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.display_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send Notification
          </Button>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold mb-4">Recent Notifications</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {history.length === 0 && <p className="text-sm text-muted-foreground">No notifications sent yet</p>}
            {history.map((n) => (
              <div key={n.id} className="rounded-xl border border-border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{n.title}</h3>
                  <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] rounded-full bg-secondary px-2 py-0.5">{n.type}</span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    {n.target === "all" ? <><Users className="h-3 w-3" /> All</> : <><User className="h-3 w-3" /> Specific</>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;

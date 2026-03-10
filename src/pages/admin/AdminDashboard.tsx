import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, CreditCard, UserPlus, Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

type Stats = {
  totalUsers: number;
  activeUsers24h: number;
  totalMessages: number;
  totalRevenue: number;
  newUsersToday: number;
  totalTransactions: number;
};

type DailyData = { date: string; count: number };

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
  <Card className="border-border/40 shadow-card hover:shadow-elevated transition-shadow">
    <CardContent className="flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeUsers24h: 0, totalMessages: 0, totalRevenue: 0, newUsersToday: 0, totalTransactions: 0 });
  const [dailyUsers, setDailyUsers] = useState<DailyData[]>([]);
  const [dailyMessages, setDailyMessages] = useState<DailyData[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const yesterday = new Date(now.getTime() - 86400000).toISOString();

      const [profilesRes, messagesRes, transactionsRes] = await Promise.all([
        (supabase as any).from("user_profiles").select("user_id, created_at"),
        (supabase as any).from("chat_messages").select("id, created_at, user_id"),
        (supabase as any).from("wallet_transactions").select("id, amount, created_at, type"),
      ]);

      const profiles = profilesRes.data || [];
      const messages = messagesRes.data || [];
      const transactions = transactionsRes.data || [];

      // Stats
      const totalUsers = profiles.length;
      const newUsersToday = profiles.filter((p: any) => p.created_at?.startsWith(today)).length;
      const activeUserIds = new Set(messages.filter((m: any) => m.created_at > yesterday).map((m: any) => m.user_id));
      const totalMessages = messages.length;
      const totalRevenue = transactions.filter((t: any) => t.type === "credit" && t.amount > 0).reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

      setStats({
        totalUsers,
        activeUsers24h: activeUserIds.size,
        totalMessages,
        totalRevenue,
        newUsersToday,
        totalTransactions: transactions.length,
      });

      // Daily aggregation for charts (last 7 days)
      const days: DailyData[] = [];
      const msgDays: DailyData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
        days.push({ date: label, count: profiles.filter((p: any) => p.created_at?.startsWith(key)).length });
        msgDays.push({ date: label, count: messages.filter((m: any) => m.created_at?.startsWith(key)).length });
      }
      setDailyUsers(days);
      setDailyMessages(msgDays);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard title="Active (24h)" value={stats.activeUsers24h} icon={Activity} color="bg-green-500/10 text-green-500" />
        <StatCard title="Total Messages" value={stats.totalMessages} icon={MessageSquare} color="bg-blue-500/10 text-blue-500" />
        <StatCard title="Revenue" value={`₹${stats.totalRevenue}`} icon={CreditCard} color="bg-amber-500/10 text-amber-500" />
        <StatCard title="New Users Today" value={stats.newUsersToday} icon={UserPlus} color="bg-purple-500/10 text-purple-500" />
        <StatCard title="Transactions" value={stats.totalTransactions} icon={TrendingUp} color="bg-rose-500/10 text-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">New Users (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyUsers}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Messages (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyMessages}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

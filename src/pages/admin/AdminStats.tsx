import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, totalConversations: 0, totalMessages: 0, avgMsgPerConvo: 0,
  });
  const [genderData, setGenderData] = useState<{ name: string; value: number }[]>([]);
  const [companionData, setCompanionData] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: profiles }, { data: messages }] = await Promise.all([
        (supabase as any).from("user_profiles").select("user_id, gender"),
        (supabase as any).from("chat_messages").select("user_id, companion_slug"),
      ]);

      const msgs = messages || [];
      const profs = profiles || [];

      const convoKeys = new Set(msgs.map((m: any) => `${m.user_id}__${m.companion_slug}`));
      const totalConversations = convoKeys.size;
      const totalMessages = msgs.length;

      setStats({
        totalUsers: profs.length,
        totalConversations,
        totalMessages,
        avgMsgPerConvo: totalConversations ? Math.round(totalMessages / totalConversations) : 0,
      });

      // Gender
      const gMap: Record<string, number> = {};
      profs.forEach((p: any) => { gMap[p.gender] = (gMap[p.gender] || 0) + 1; });
      setGenderData(Object.entries(gMap).map(([name, value]) => ({ name, value })));

      // Top companions
      const cMap: Record<string, number> = {};
      msgs.forEach((m: any) => { cMap[m.companion_slug] = (cMap[m.companion_slug] || 0) + 1; });
      setCompanionData(
        Object.entries(cMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))
      );
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Platform Statistics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers },
          { label: "Conversations", value: stats.totalConversations },
          { label: "Messages", value: stats.totalMessages },
          { label: "Avg Msgs/Convo", value: stats.avgMsgPerConvo },
        ].map(s => (
          <Card key={s.label} className="border-border/40">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Gender Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Top Companions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={companionData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStats;

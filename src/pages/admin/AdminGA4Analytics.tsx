import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Globe, FileText, Activity, TrendingUp, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type GA4Data = {
  activeUsers: string;
  todayVisitors: string;
  todayPageViews: string;
  todaySessions: string;
  pageViewsByDay: { dimensions: string[]; metrics: string[] }[];
  countries: { dimensions: string[]; metrics: string[] }[];
  topPages: { dimensions: string[]; metrics: string[] }[];
  dailyVisitors: { dimensions: string[]; metrics: string[] }[];
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(142 76% 36%)",
  "hsl(217 91% 60%)",
  "hsl(45 93% 47%)",
  "hsl(280 68% 60%)",
  "hsl(350 89% 60%)",
  "hsl(180 60% 45%)",
  "hsl(30 80% 55%)",
];

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const m = parseInt(dateStr.slice(4, 6));
  const d = parseInt(dateStr.slice(6, 8));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}`;
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
  title: string; value: string | number; icon: any; color: string; subtitle?: string;
}) => (
  <Card className="border-border/40 shadow-card hover:shadow-elevated transition-shadow">
    <CardContent className="flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </CardContent>
  </Card>
);

const AdminGA4Analytics = () => {
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("ga4-analytics");
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (e: any) {
      setError(e.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Google Analytics</h1>
        <Card className="border-destructive/40">
          <CardContent className="p-6 text-center">
            <p className="text-destructive font-medium mb-2">Failed to load analytics</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const dailyChartData = data.dailyVisitors.map((r) => ({
    date: formatDate(r.dimensions[0]),
    users: parseInt(r.metrics[0]),
    sessions: parseInt(r.metrics[1]),
  }));

  const pageViewsChartData = data.pageViewsByDay.map((r) => ({
    date: formatDate(r.dimensions[0]),
    views: parseInt(r.metrics[0]),
  }));

  const countriesData = data.countries.map((r) => ({
    name: r.dimensions[0],
    value: parseInt(r.metrics[0]),
  }));

  const topPagesData = data.topPages.map((r) => ({
    page: r.dimensions[0].length > 25 ? r.dimensions[0].slice(0, 25) + "…" : r.dimensions[0],
    fullPage: r.dimensions[0],
    views: parseInt(r.metrics[0]),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Google Analytics</h1>
        <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Now" value={data.activeUsers} icon={Activity} color="bg-green-500/10 text-green-500" subtitle="Real-time" />
        <StatCard title="Visitors Today" value={data.todayVisitors} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard title="Page Views Today" value={data.todayPageViews} icon={Eye} color="bg-blue-500/10 text-blue-500" />
        <StatCard title="Sessions Today" value={data.todaySessions} icon={TrendingUp} color="bg-amber-500/10 text-amber-500" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Daily Visitors (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyChartData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Users" />
                <Area type="monotone" dataKey="sessions" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36% / 0.1)" name="Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Page Views (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pageViewsChartData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="views" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Top Countries</CardTitle></CardHeader>
          <CardContent>
            {countriesData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie data={countriesData.slice(0, 8)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {countriesData.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {countriesData.slice(0, 6).map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground">{c.name}</span>
                      </div>
                      <span className="font-medium text-muted-foreground">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Most Visited Pages</CardTitle></CardHeader>
          <CardContent>
            {topPagesData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="space-y-3">
                {topPagesData.slice(0, 8).map((p, i) => {
                  const maxViews = topPagesData[0]?.views || 1;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground truncate max-w-[200px]" title={p.fullPage}>{p.page}</span>
                        <span className="font-medium text-muted-foreground">{p.views}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${(p.views / maxViews) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminGA4Analytics;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Globe, FileText, Activity, TrendingUp, RefreshCw, Calendar, UserPlus, UserCheck, Repeat } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type GA4Data = {
  activeUsers: string;
  todayVisitors: string;
  todayPageViews: string;
  todaySessions: string;
  pageViewsByDay: { dimensions: string[]; metrics: string[] }[];
  countries: { dimensions: string[]; metrics: string[] }[];
  topPages: { dimensions: string[]; metrics: string[] }[];
  dailyVisitors: { dimensions: string[]; metrics: string[] }[];
  newVsReturning: { dimensions: string[]; metrics: string[] }[];
  userLifecycle: { dimensions: string[]; metrics: string[] }[];
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

const DATE_RANGES = [
  { label: "Last 7 days", value: "7", startDate: "7daysAgo" },
  { label: "Last 14 days", value: "14", startDate: "14daysAgo" },
  { label: "Last 30 days", value: "30", startDate: "30daysAgo" },
  { label: "Last 90 days", value: "90", startDate: "90daysAgo" },
  { label: "Last 6 months", value: "180", startDate: "180daysAgo" },
  { label: "Last 12 months", value: "365", startDate: "365daysAgo" },
  { label: "Maximum (16 months)", value: "max", startDate: "480daysAgo" },
];

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const m = parseInt(dateStr.slice(4, 6));
  const d = parseInt(dateStr.slice(6, 8));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}`;
};

const formatDateFull = (dateStr: string) => {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const y = dateStr.slice(0, 4);
  const m = parseInt(dateStr.slice(4, 6));
  const d = parseInt(dateStr.slice(6, 8));
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
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
  const [dateRange, setDateRange] = useState("7");

  const getStartDate = () => {
    const range = DATE_RANGES.find(r => r.value === dateRange);
    return range?.startDate || "7daysAgo";
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("ga4-analytics", {
        body: { startDate: getStartDate(), endDate: "today" },
      });
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (e: any) {
      setError(e.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange]);

  const selectedLabel = DATE_RANGES.find(r => r.value === dateRange)?.label || "Last 7 days";

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

  const useFullDate = parseInt(dateRange) > 30 || dateRange === "max";
  const dateFormatter = useFullDate ? formatDateFull : formatDate;

  // Daily visitors with new users
  const dailyChartData = data.dailyVisitors.map((r) => ({
    date: dateFormatter(r.dimensions[0]),
    users: parseInt(r.metrics[0]),
    sessions: parseInt(r.metrics[1]),
    newUsers: parseInt(r.metrics[2] || "0"),
    returningUsers: Math.max(0, parseInt(r.metrics[0]) - parseInt(r.metrics[2] || "0")),
  }));

  const pageViewsChartData = data.pageViewsByDay.map((r) => ({
    date: dateFormatter(r.dimensions[0]),
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

  // New vs Returning breakdown
  const newVsReturningData = data.newVsReturning.map((r) => ({
    type: r.dimensions[0] === "new" ? "New Users" : r.dimensions[0] === "returning" ? "Returning Users" : r.dimensions[0],
    users: parseInt(r.metrics[0]),
    sessions: parseInt(r.metrics[1]),
    engagedSessions: parseInt(r.metrics[2]),
    avgDuration: parseFloat(r.metrics[3]),
  }));

  const newUsersTotal = newVsReturningData.find(d => d.type === "New Users")?.users || 0;
  const returningUsersTotal = newVsReturningData.find(d => d.type === "Returning Users")?.users || 0;

  const newVsPieData = [
    { name: "New Users", value: newUsersTotal },
    { name: "Returning Users", value: returningUsersTotal },
  ].filter(d => d.value > 0);

  // User lifecycle: daily unique new visitors
  const lifecycleData = data.userLifecycle.map((r) => ({
    date: dateFormatter(r.dimensions[0]),
    rawDate: r.dimensions[0],
    newUsers: parseInt(r.metrics[0]),
    totalUsers: parseInt(r.metrics[1]),
    returningUsers: Math.max(0, parseInt(r.metrics[1]) - parseInt(r.metrics[0])),
    newUserPct: parseInt(r.metrics[1]) > 0 ? Math.round((parseInt(r.metrics[0]) / parseInt(r.metrics[1])) * 100) : 0,
  }));

  // Calculate totals
  const totalVisitors = dailyChartData.reduce((sum, d) => sum + d.users, 0);
  const totalSessions = dailyChartData.reduce((sum, d) => sum + d.sessions, 0);
  const totalPageViews = pageViewsChartData.reduce((sum, d) => sum + d.views, 0);
  const totalNewUsers = lifecycleData.reduce((sum, d) => sum + d.newUsers, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-foreground">Google Analytics</h1>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Active Now" value={data.activeUsers} icon={Activity} color="bg-green-500/10 text-green-500" subtitle="Real-time" />
        <StatCard title={`Visitors`} value={totalVisitors} icon={Users} color="bg-primary/10 text-primary" subtitle={`Today: ${data.todayVisitors}`} />
        <StatCard title={`New Users`} value={totalNewUsers} icon={UserPlus} color="bg-blue-500/10 text-blue-500" subtitle={`${selectedLabel}`} />
        <StatCard title={`Returning`} value={returningUsersTotal} icon={Repeat} color="bg-amber-500/10 text-amber-500" subtitle={`${selectedLabel}`} />
        <StatCard title={`Sessions`} value={totalSessions} icon={TrendingUp} color="bg-purple-500/10 text-purple-500" subtitle={`Today: ${data.todaySessions}`} />
      </div>

      {/* Charts Row 1: Daily Visitors + New vs Returning Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/40 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">New vs Returning Users ({selectedLabel})</CardTitle></CardHeader>
          <CardContent>
            {dailyChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">No visitor data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyChartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="newUsers" stackId="1" stroke="hsl(217 91% 60%)" fill="hsl(217 91% 60% / 0.3)" name="New Users" />
                  <Area type="monotone" dataKey="returningUsers" stackId="1" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36% / 0.15)" name="Returning Users" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4" /> User Breakdown</CardTitle></CardHeader>
          <CardContent>
            {newVsPieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={newVsPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      <Cell fill="hsl(217 91% 60%)" />
                      <Cell fill="hsl(142 76% 36%)" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full space-y-2">
                  {newVsReturningData.map((d, i) => (
                    <div key={d.type} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: i === 0 ? "hsl(217, 91%, 60%)" : "hsl(142, 76%, 36%)" }} />
                        <span className="text-foreground">{d.type}</span>
                      </div>
                      <span className="font-medium text-muted-foreground">{d.users}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unique New Users Day-wise Report */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Unique First-Time Visitors — Day-wise ({selectedLabel})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lifecycleData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={lifecycleData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                        <p className="font-medium mb-1">{label}</p>
                        <p className="text-blue-500">New Users: {d.newUsers}</p>
                        <p className="text-green-500">Returning: {d.returningUsers}</p>
                        <p className="text-muted-foreground">Total: {d.totalUsers}</p>
                        <p className="text-muted-foreground">New %: {d.newUserPct}%</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="newUsers" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} name="New Users" />
                  <Bar dataKey="returningUsers" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="Returning" />
                </BarChart>
              </ResponsiveContainer>

              {/* Day-wise table */}
              <div className="max-h-[300px] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">New Users</TableHead>
                      <TableHead className="text-right">Returning</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">New %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...lifecycleData].reverse().map((d) => (
                      <TableRow key={d.rawDate}>
                        <TableCell className="font-medium">{d.date}</TableCell>
                        <TableCell className="text-right text-blue-500 font-medium">{d.newUsers}</TableCell>
                        <TableCell className="text-right text-green-500 font-medium">{d.returningUsers}</TableCell>
                        <TableCell className="text-right">{d.totalUsers}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{d.newUserPct}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row 2: Page Views + Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Page Views ({selectedLabel})</CardTitle></CardHeader>
          <CardContent>
            {pageViewsChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">No page view data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pageViewsChartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> Top Countries ({selectedLabel})</CardTitle></CardHeader>
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
      </div>

      {/* Top Pages */}
      <Card className="border-border/40">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Most Visited Pages ({selectedLabel})</CardTitle></CardHeader>
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
  );
};

export default AdminGA4Analytics;

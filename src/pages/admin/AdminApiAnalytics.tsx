import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Activity, AlertTriangle, Clock, Gauge, RefreshCw, Heart, Shield, Zap,
  Bell, TrendingUp, Server, Wifi, WifiOff, CheckCircle, XCircle, Info
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface ApiLog {
  id: string;
  function_name: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  error_message: string | null;
  api_version: string;
  created_at: string;
  ip_address: string | null;
}

interface HealthStatus {
  status: string;
  version: string;
  supported_versions: string[];
  timestamp: string;
  response_time_ms: number;
  services: Record<string, { status: string; latency_ms: number; error?: string }>;
}

interface AlertThreshold {
  id: string;
  metric_name: string;
  threshold_value: number;
  window_minutes: number;
  is_active: boolean;
  last_triggered_at: string | null;
}

interface ApiAlert {
  id: string;
  alert_type: string;
  metric_name: string;
  current_value: number;
  threshold_value: number;
  details: any;
  resolved_at: string | null;
  created_at: string;
}

// Endpoint documentation
const ENDPOINTS = [
  { name: "companion-chat", method: "POST", description: "AI companion chat with streaming SSE response", rateLimit: "60/min per user", auth: "None (public)", version: "v1" },
  { name: "google-onetap", method: "POST", description: "Google One Tap sign-in verification & user creation", rateLimit: "5/15min", auth: "None (public)", version: "v1" },
  { name: "verify-email-otp", method: "POST", description: "Verify 6-digit email OTP and generate session token", rateLimit: "5/10min", auth: "None (public)", version: "v1" },
  { name: "bypass-otp", method: "POST", description: "Development bypass OTP with code 111111", rateLimit: "5/10min", auth: "None (public)", version: "v1" },
  { name: "rate-limiter", method: "POST", description: "Check and enforce per-action rate limits", rateLimit: "100/min", auth: "None (public)", version: "v1" },
  { name: "health-check", method: "POST", description: "Tests database, auth, and storage service health", rateLimit: "Unlimited", auth: "None (public)", version: "v1" },
  { name: "check-alerts", method: "POST", description: "Evaluate alert thresholds and create admin notifications", rateLimit: "Unlimited", auth: "None (internal)", version: "v1" },
  { name: "auth-email-hook", method: "POST", description: "Supabase auth email hook for custom email templates", rateLimit: "N/A (system)", auth: "Service role", version: "v1" },
  { name: "process-email-queue", method: "POST", description: "Process queued transactional and auth emails", rateLimit: "N/A (cron)", auth: "Service role", version: "v1" },
];

const CHART_COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const AdminApiAnalytics = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [stats, setStats] = useState({ total24h: 0, errorRate: 0, avgResponseTime: 0, activeFunctions: 0, totalErrors: 0, p95: 0 });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [errorsByFunction, setErrorsByFunction] = useState<any[]>([]);
  const [functionBreakdown, setFunctionBreakdown] = useState<any[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [responseTimeData, setResponseTimeData] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: recent },
      { data: last24h },
      { data: last7d },
      { data: thresholdData },
      { data: alertData },
    ] = await Promise.all([
      (supabase as any).from("api_request_logs").select("*").order("created_at", { ascending: false }).limit(100),
      (supabase as any).from("api_request_logs").select("*").gte("created_at", since24h),
      (supabase as any).from("api_request_logs").select("function_name, status_code, response_time_ms, created_at").gte("created_at", since7d),
      (supabase as any).from("api_alert_thresholds").select("*").order("metric_name"),
      (supabase as any).from("api_alerts").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    setLogs(recent || []);
    setThresholds(thresholdData || []);
    setAlerts(alertData || []);

    const all24h = last24h || [];
    const errors24h = all24h.filter((l: ApiLog) => l.status_code >= 400).length;
    const avgResp = all24h.length > 0 ? Math.round(all24h.reduce((s: number, l: ApiLog) => s + l.response_time_ms, 0) / all24h.length) : 0;
    const functions = new Set(all24h.map((l: ApiLog) => l.function_name));

    // P95 response time
    const sortedTimes = all24h.map((l: ApiLog) => l.response_time_ms).sort((a: number, b: number) => a - b);
    const p95 = sortedTimes.length > 0 ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] : 0;

    setStats({
      total24h: all24h.length,
      errorRate: all24h.length > 0 ? Math.round((errors24h / all24h.length) * 100 * 10) / 10 : 0,
      avgResponseTime: avgResp,
      activeFunctions: functions.size,
      totalErrors: errors24h,
      p95,
    });

    // Daily data
    const dayMap: Record<string, { date: string; requests: number; errors: number; avgTime: number; totalTime: number }> = {};
    (last7d || []).forEach((l: any) => {
      const day = new Date(l.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!dayMap[day]) dayMap[day] = { date: day, requests: 0, errors: 0, avgTime: 0, totalTime: 0 };
      dayMap[day].requests++;
      dayMap[day].totalTime += l.response_time_ms;
      if (l.status_code >= 400) dayMap[day].errors++;
    });
    Object.values(dayMap).forEach(d => { d.avgTime = d.requests > 0 ? Math.round(d.totalTime / d.requests) : 0; });
    setDailyData(Object.values(dayMap));

    // Errors by function
    const errMap: Record<string, number> = {};
    (last7d || []).filter((l: any) => l.status_code >= 400).forEach((l: any) => {
      errMap[l.function_name] = (errMap[l.function_name] || 0) + 1;
    });
    setErrorsByFunction(Object.entries(errMap).map(([name, count]) => ({ name, errors: count })));

    // Function breakdown pie chart
    const fnMap: Record<string, number> = {};
    (last7d || []).forEach((l: any) => {
      fnMap[l.function_name] = (fnMap[l.function_name] || 0) + 1;
    });
    setFunctionBreakdown(Object.entries(fnMap).map(([name, value]) => ({ name, value })));

    // Response time over time
    const rtMap: Record<string, { date: string; avg: number; p95: number; count: number; total: number; times: number[] }> = {};
    (last7d || []).forEach((l: any) => {
      const day = new Date(l.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!rtMap[day]) rtMap[day] = { date: day, avg: 0, p95: 0, count: 0, total: 0, times: [] };
      rtMap[day].count++;
      rtMap[day].total += l.response_time_ms;
      rtMap[day].times.push(l.response_time_ms);
    });
    Object.values(rtMap).forEach(d => {
      d.avg = Math.round(d.total / d.count);
      d.times.sort((a, b) => a - b);
      d.p95 = d.times[Math.floor(d.times.length * 0.95)] || 0;
    });
    setResponseTimeData(Object.values(rtMap).map(({ date, avg, p95 }) => ({ date, avg, p95 })));

    setLoading(false);
  }, []);

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-check");
      if (!error && data) setHealth(data as HealthStatus);
    } catch (_) {}
    setHealthLoading(false);
  }, []);

  const runAlertCheck = useCallback(async () => {
    try {
      await supabase.functions.invoke("check-alerts");
      await fetchData();
    } catch (_) {}
  }, [fetchData]);

  const toggleThreshold = useCallback(async (id: string, currentActive: boolean) => {
    await (supabase as any).from("api_alert_thresholds").update({ is_active: !currentActive, updated_at: new Date().toISOString() }).eq("id", id);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    checkHealth();
  }, [fetchData, checkHealth]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => { fetchData(); checkHealth(); }, 30000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchData, checkHealth]);

  const statusBadge = (code: number) => {
    if (code < 300) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{code}</Badge>;
    if (code < 500) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{code}</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{code}</Badge>;
  };

  const serviceIcon = (status: string) => {
    if (status === "up") return <CheckCircle className="h-4 w-4 text-green-400" />;
    if (status === "degraded") return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  const activeAlerts = alerts.filter(a => !a.resolved_at);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Analytics & Monitoring</h1>
          <p className="text-sm text-muted-foreground">Live monitoring, alerts, endpoint docs & scalability metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {autoRefresh ? <Wifi className="h-4 w-4 text-green-400 animate-pulse" /> : <WifiOff className="h-4 w-4" />}
            <span>Live</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchData(); checkHealth(); }}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Active Alerts Banner */}
      {activeAlerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-destructive animate-pulse" />
              <span className="font-semibold text-destructive">{activeAlerts.length} Active Alert{activeAlerts.length > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {activeAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} className="text-sm flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                  <span><strong>{alert.metric_name.replace(/_/g, " ")}</strong>: {alert.current_value} (threshold: {alert.threshold_value})</span>
                  <span className="text-xs">— {new Date(alert.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="scalability">Scalability</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {/* Health Status */}
          {health && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" /> System Health
                  <Badge className={health.status === "healthy" ? "bg-green-500/20 text-green-400" : health.status === "degraded" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}>
                    {health.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">v{health.version} · {health.response_time_ms}ms</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(health.services).map(([name, svc]) => (
                    <div key={name} className="rounded-lg border p-3 flex items-center gap-2">
                      {serviceIcon(svc.status)}
                      <div>
                        <div className="text-xs text-muted-foreground capitalize">{name}</div>
                        <div className="text-sm font-semibold">{svc.latency_ms}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Activity, label: "Requests (24h)", value: stats.total24h, color: "text-primary" },
              { icon: AlertTriangle, label: "Error Rate", value: `${stats.errorRate}%`, color: "text-yellow-500" },
              { icon: Clock, label: "Avg Response", value: `${stats.avgResponseTime}ms`, color: "text-blue-500" },
              { icon: Gauge, label: "Active Functions", value: stats.activeFunctions, color: "text-green-500" },
              { icon: XCircle, label: "Total Errors (24h)", value: stats.totalErrors, color: "text-destructive" },
              { icon: TrendingUp, label: "P95 Response", value: `${stats.p95}ms`, color: "text-purple-500" },
            ].map((stat, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <div>
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Requests & Errors (7d)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="rgba(239,68,68,0.1)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Response Time Trend (7d)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" unit="ms" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Avg" />
                    <Line type="monotone" dataKey="p95" stroke="#8b5cf6" strokeWidth={2} dot={false} name="P95" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Errors by Function (7d)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={errorsByFunction}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Traffic Distribution (7d)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={functionBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                      {functionBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Requests */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Requests</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{loading ? "Loading..." : "No logs yet"}</TableCell></TableRow>
                  ) : logs.slice(0, 25).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.function_name}</TableCell>
                      <TableCell>{statusBadge(log.status_code)}</TableCell>
                      <TableCell className="text-xs">{log.response_time_ms}ms</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.api_version}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</TableCell>
                      <TableCell className="text-xs text-destructive max-w-[150px] truncate">{log.error_message || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENDPOINTS TAB */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> API Endpoints Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Auth</TableHead>
                    <TableHead>Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ENDPOINTS.map(ep => (
                    <TableRow key={ep.name}>
                      <TableCell className="font-mono text-xs font-semibold">{ep.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{ep.method}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px]">{ep.description}</TableCell>
                      <TableCell className="text-xs"><Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{ep.rateLimit}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ep.auth}</TableCell>
                      <TableCell className="text-xs">{ep.version}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Per-endpoint stats */}
          <Card>
            <CardHeader><CardTitle className="text-base">Per-Endpoint Performance (24h)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ENDPOINTS.map(ep => {
                  const epLogs = logs.filter(l => l.function_name === ep.name);
                  const total = epLogs.length;
                  const errors = epLogs.filter(l => l.status_code >= 400).length;
                  const avgMs = total > 0 ? Math.round(epLogs.reduce((s, l) => s + l.response_time_ms, 0) / total) : 0;
                  return (
                    <div key={ep.name} className="rounded-lg border p-3 space-y-1">
                      <div className="font-mono text-xs font-semibold">{ep.name}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{total} req</span>
                        <span className={errors > 0 ? "text-destructive" : ""}>{errors} err</span>
                        <span>{avgMs}ms avg</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${total > 0 ? Math.min(100, (total / Math.max(...logs.map(l => logs.filter(ll => ll.function_name === l.function_name).length))) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALERTS TAB */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" /> Alert Thresholds
            </h2>
            <Button variant="outline" size="sm" onClick={runAlertCheck}>
              <Zap className="h-4 w-4 mr-2" /> Run Alert Check Now
            </Button>
          </div>

          {/* Thresholds Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {thresholds.map(t => (
              <Card key={t.id} className={!t.is_active ? "opacity-50" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold capitalize">{t.metric_name.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        Threshold: <strong>{t.threshold_value}</strong> · Window: {t.window_minutes}min
                      </p>
                      {t.last_triggered_at && (
                        <p className="text-xs text-destructive mt-1">
                          Last triggered: {new Date(t.last_triggered_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                        </p>
                      )}
                    </div>
                    <Switch checked={t.is_active} onCheckedChange={() => toggleThreshold(t.id, t.is_active)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alert History */}
          <Card>
            <CardHeader><CardTitle className="text-base">Alert History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No alerts triggered yet</TableCell></TableRow>
                  ) : alerts.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell className="text-xs font-semibold capitalize">{alert.metric_name.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-xs text-destructive font-bold">{alert.current_value}</TableCell>
                      <TableCell className="text-xs">{alert.threshold_value}</TableCell>
                      <TableCell>
                        {alert.resolved_at
                          ? <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>
                          : <Badge className="bg-red-500/20 text-red-400 animate-pulse">Active</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCALABILITY TAB */}
        <TabsContent value="scalability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Scalability Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-400" /> Implemented</h3>
                  {[
                    "Composite DB indexes on all high-traffic tables",
                    "Partial indexes for active companions & online users",
                    "Presence heartbeat with 60s debounce",
                    "PWA service worker with aggressive caching",
                    "Code splitting & lazy loading for all routes",
                    "Realtime subscriptions with filtered channels",
                    "Edge function request logging & monitoring",
                    "In-memory rate limiting per isolate",
                    "Alert thresholds with admin notifications",
                    "Health check across DB, Auth, Storage",
                    "API versioning via X-API-Version header",
                    "Connection pooling via Supabase infrastructure",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Info className="h-4 w-4 text-blue-400" /> Capacity Estimates</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Concurrent Users", value: "10,000+", detail: "Edge functions auto-scale per region" },
                      { label: "Realtime Connections", value: "~10K", detail: "Supabase Realtime with filtered channels" },
                      { label: "DB Connections", value: "Pooled", detail: "Supabase PgBouncer handles connection pooling" },
                      { label: "Edge Function Cold Start", value: "~50ms", detail: "Deno isolates with warm pools" },
                      { label: "Chat Throughput", value: "60 msg/min/user", detail: "Rate limited per user per action" },
                      { label: "API Rate Limit", value: "Per-action", detail: "login: 5/15m, chat: 60/m, general: 100/m" },
                      { label: "PWA Cache Strategy", value: "StaleWhileRevalidate", detail: "Offline support for static assets" },
                      { label: "Bundle Size", value: "Optimized", detail: "Tree-shaking + no source maps in prod" },
                    ].map((item, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold">{item.label}</span>
                          <Badge variant="outline" className="text-xs">{item.value}</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {health && Object.entries(health.services).map(([name, svc]) => (
              <Card key={name}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    {serviceIcon(svc.status)}
                    <div>
                      <p className="text-sm font-semibold capitalize">{name}</p>
                      <p className="text-lg font-bold">{svc.latency_ms}ms</p>
                      <p className="text-[10px] text-muted-foreground">{svc.status === "up" ? "Healthy" : svc.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminApiAnalytics;

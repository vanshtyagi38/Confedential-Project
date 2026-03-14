import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Clock, Gauge, RefreshCw, Heart } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

const AdminApiAnalytics = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [stats, setStats] = useState({ total24h: 0, errorRate: 0, avgResponseTime: 0, activeFunctions: 0 });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [errorsByFunction, setErrorsByFunction] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: recent }, { data: last24h }, { data: last7d }] = await Promise.all([
      (supabase as any).from("api_request_logs").select("*").order("created_at", { ascending: false }).limit(50),
      (supabase as any).from("api_request_logs").select("*").gte("created_at", since24h),
      (supabase as any).from("api_request_logs").select("function_name, status_code, response_time_ms, created_at").gte("created_at", since7d),
    ]);

    setLogs(recent || []);

    const all24h = last24h || [];
    const errors24h = all24h.filter((l: ApiLog) => l.status_code >= 400).length;
    const avgResp = all24h.length > 0 ? Math.round(all24h.reduce((s: number, l: ApiLog) => s + l.response_time_ms, 0) / all24h.length) : 0;
    const functions = new Set(all24h.map((l: ApiLog) => l.function_name));

    setStats({
      total24h: all24h.length,
      errorRate: all24h.length > 0 ? Math.round((errors24h / all24h.length) * 100 * 10) / 10 : 0,
      avgResponseTime: avgResp,
      activeFunctions: functions.size,
    });

    // Daily data for chart
    const dayMap: Record<string, { date: string; requests: number; errors: number }> = {};
    (last7d || []).forEach((l: any) => {
      const day = new Date(l.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!dayMap[day]) dayMap[day] = { date: day, requests: 0, errors: 0 };
      dayMap[day].requests++;
      if (l.status_code >= 400) dayMap[day].errors++;
    });
    setDailyData(Object.values(dayMap));

    // Errors by function
    const errMap: Record<string, number> = {};
    (last7d || []).filter((l: any) => l.status_code >= 400).forEach((l: any) => {
      errMap[l.function_name] = (errMap[l.function_name] || 0) + 1;
    });
    setErrorsByFunction(Object.entries(errMap).map(([name, count]) => ({ name, errors: count })));

    setLoading(false);
  };

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-check");
      if (!error && data) setHealth(data as HealthStatus);
    } catch (_) {}
    setHealthLoading(false);
  };

  useEffect(() => { fetchData(); checkHealth(); }, []);

  const statusBadge = (code: number) => {
    if (code < 300) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{code}</Badge>;
    if (code < 500) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{code}</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{code}</Badge>;
  };

  const serviceStatusColor = (status: string) => {
    if (status === "up") return "text-green-400";
    if (status === "degraded") return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Analytics</h1>
          <p className="text-sm text-muted-foreground">Monitor edge function performance, errors, and health status</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchData(); checkHealth(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Health Status */}
      {health && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4" /> System Health
              <Badge className={health.status === "healthy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {health.status}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">v{health.version} · {health.response_time_ms}ms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(health.services).map(([name, svc]) => (
                <div key={name} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground capitalize">{name}</div>
                  <div className={`text-sm font-semibold ${serviceStatusColor(svc.status)}`}>
                    {svc.status.toUpperCase()} · {svc.latency_ms}ms
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total24h}</p>
                <p className="text-xs text-muted-foreground">Requests (24h)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.errorRate}%</p>
                <p className="text-xs text-muted-foreground">Error Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
                <p className="text-xs text-muted-foreground">Avg Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gauge className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeFunctions}</p>
                <p className="text-xs text-muted-foreground">Active Functions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Requests (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Errors by Function</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={errorsByFunction}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Requests</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Function</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {loading ? "Loading..." : "No API logs yet. Logs will appear as edge functions are invoked."}
                  </TableCell>
                </TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.function_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{log.method}</Badge></TableCell>
                  <TableCell>{statusBadge(log.status_code)}</TableCell>
                  <TableCell className="text-xs">{log.response_time_ms}ms</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.api_version}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </TableCell>
                  <TableCell className="text-xs text-red-400 max-w-[200px] truncate">{log.error_message || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApiAnalytics;

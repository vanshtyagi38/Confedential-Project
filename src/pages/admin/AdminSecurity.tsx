import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Info, ShieldAlert } from "lucide-react";

type SecurityEvent = {
  id: string;
  event_type: string;
  ip_address: string | null;
  details: any;
  severity: string;
  created_at: string;
};

const severityColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400",
  warning: "bg-yellow-500/10 text-yellow-400",
  critical: "bg-red-500/10 text-red-400",
};

const severityIcons: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: ShieldAlert,
};

const AdminSecurity = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, warnings: 0, critical: 0 });

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from("security_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      const list = data || [];
      setEvents(list);
      setStats({
        total: list.length,
        warnings: list.filter((e: SecurityEvent) => e.severity === "warning").length,
        critical: list.filter((e: SecurityEvent) => e.severity === "critical").length,
      });
    };
    load();

    // Real-time security events
    const channel = supabase
      .channel("security-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "security_events" }, (payload) => {
        setEvents((prev) => [payload.new as SecurityEvent, ...prev].slice(0, 200));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Security Monitor</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/40">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-yellow-400">{stats.warnings}</p>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.critical}</p>
            <p className="text-sm text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle>Security Events (Real-time)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => {
                const Icon = severityIcons[e.severity] || Info;
                return (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Badge className={severityColors[e.severity] || ""}>
                        <Icon className="h-3 w-3 mr-1" />
                        {e.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{e.event_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.ip_address || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {JSON.stringify(e.details)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    No security events — all clear
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurity;

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ChevronLeft, ChevronRight, CreditCard, TrendingUp, CheckCircle, UserPlus, Repeat, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Transaction = {
  id: string;
  user_id: string;
  type: string;
  minutes: number;
  amount: number | null;
  description: string | null;
  created_at: string | null;
};

const PAGE_SIZE = 20;

const PIE_COLORS = ["hsl(217 91% 60%)", "hsl(142 76% 36%)"];

const DATE_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

const AdminPayments = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const [{ data: txns }, { data: profiles }] = await Promise.all([
        (supabase as any).from("wallet_transactions").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("user_profiles").select("user_id, display_name, created_at"),
      ]);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { map[p.user_id] = p.display_name || "Unknown"; });
      setNameMap(map);
      setTransactions(txns || []);
    };
    load();
  }, []);

  // Filter transactions by date
  const filteredByDate = useMemo(() => {
    if (dateFilter === "all") return transactions;
    const days = parseInt(dateFilter);
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    return transactions.filter(t => t.created_at && t.created_at >= cutoff);
  }, [transactions, dateFilter]);

  // Payment analytics: credit transactions with amount > 0
  const paidTransactions = useMemo(() =>
    filteredByDate.filter(t => t.type === "credit" && (t.amount || 0) > 0),
    [filteredByDate]
  );

  // All-time paid transactions for first-payment detection
  const allPaidTransactions = useMemo(() =>
    transactions.filter(t => t.type === "credit" && (t.amount || 0) > 0),
    [transactions]
  );

  // Determine each user's first payment date (all-time)
  const userFirstPayment = useMemo(() => {
    const map: Record<string, string> = {};
    // Sort ascending to find first
    const sorted = [...allPaidTransactions].sort((a, b) =>
      (a.created_at || "").localeCompare(b.created_at || "")
    );
    sorted.forEach(t => {
      if (!map[t.user_id] && t.created_at) {
        map[t.user_id] = t.created_at;
      }
    });
    return map;
  }, [allPaidTransactions]);

  // Classify each paid transaction in the filtered range as "new" or "repeat"
  const classifiedPayments = useMemo(() => {
    return paidTransactions.map(t => {
      const firstPayDate = userFirstPayment[t.user_id];
      const isFirstPayment = firstPayDate === t.created_at;
      return { ...t, isFirstPayment };
    });
  }, [paidTransactions, userFirstPayment]);

  const newPayments = classifiedPayments.filter(t => t.isFirstPayment);
  const repeatPayments = classifiedPayments.filter(t => !t.isFirstPayment);

  const newPaymentRevenue = newPayments.reduce((s, t) => s + Number(t.amount || 0), 0);
  const repeatPaymentRevenue = repeatPayments.reduce((s, t) => s + Number(t.amount || 0), 0);

  // Unique paying users
  const uniqueNewPayers = new Set(newPayments.map(t => t.user_id)).size;
  const uniqueRepeatPayers = new Set(repeatPayments.map(t => t.user_id)).size;

  // Pie data
  const paymentTypePieData = [
    { name: "First-Time Payments", value: newPayments.length },
    { name: "Repeat Payments", value: repeatPayments.length },
  ].filter(d => d.value > 0);

  const revenuePieData = [
    { name: "New User Revenue", value: newPaymentRevenue },
    { name: "Repeat Revenue", value: repeatPaymentRevenue },
  ].filter(d => d.value > 0);

  // Daily breakdown chart
  const dailyPaymentData = useMemo(() => {
    const dayMap: Record<string, { newPay: number; repeatPay: number; newRev: number; repeatRev: number }> = {};
    classifiedPayments.forEach(t => {
      if (!t.created_at) return;
      const day = t.created_at.split("T")[0];
      if (!dayMap[day]) dayMap[day] = { newPay: 0, repeatPay: 0, newRev: 0, repeatRev: 0 };
      if (t.isFirstPayment) {
        dayMap[day].newPay++;
        dayMap[day].newRev += Number(t.amount || 0);
      } else {
        dayMap[day].repeatPay++;
        dayMap[day].repeatRev += Number(t.amount || 0);
      }
    });
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => {
        const dt = new Date(date);
        return {
          date: dt.toLocaleDateString("en", { month: "short", day: "numeric" }),
          ...d,
        };
      });
  }, [classifiedPayments]);

  // Existing totals
  const totalRevenue = paidTransactions.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalTxns = filteredByDate.length;
  const creditTxns = paidTransactions.length;

  const filtered = search
    ? filteredByDate.filter(t => t.user_id.includes(search) || nameMap[t.user_id]?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
    : filteredByDate;

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const downloadCSV = () => {
    const header = "ID,User,Type,Minutes,Amount,Description,Date\n";
    const rows = transactions.map(t =>
      `${t.id},${nameMap[t.user_id] || t.user_id},${t.type},${t.minutes},${t.amount || 0},"${t.description || ""}",${t.created_at}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const selectedLabel = DATE_FILTERS.find(f => f.value === dateFilter)?.label || "All Time";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-foreground">Payments & Revenue</h1>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={v => { setDateFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTERS.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={downloadCSV} className="rounded-xl gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500"><CreditCard className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">₹{totalRevenue}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500"><UserPlus className="h-6 w-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground">New User Payments</p>
              <p className="text-2xl font-bold">{newPayments.length}</p>
              <p className="text-xs text-muted-foreground">₹{newPaymentRevenue} · {uniqueNewPayers} users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500"><Repeat className="h-6 w-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Repeat Payments</p>
              <p className="text-2xl font-bold">{repeatPayments.length}</p>
              <p className="text-xs text-muted-foreground">₹{repeatPaymentRevenue} · {uniqueRepeatPayers} users</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><TrendingUp className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Total Transactions</p><p className="text-2xl font-bold">{totalTxns}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500"><CheckCircle className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Successful Credits</p><p className="text-2xl font-bold">{creditTxns}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Charts: New vs Repeat Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/40 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">New vs Repeat Payments — Daily ({selectedLabel})</CardTitle></CardHeader>
          <CardContent>
            {dailyPaymentData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">No payment data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dailyPaymentData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
                        <p className="font-medium mb-1">{label}</p>
                        <p className="text-blue-500">New: {d.newPay} (₹{d.newRev})</p>
                        <p className="text-green-500">Repeat: {d.repeatPay} (₹{d.repeatRev})</p>
                      </div>
                    );
                  }} />
                  <Legend />
                  <Bar dataKey="newPay" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} name="New User Payments" />
                  <Bar dataKey="repeatPay" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} name="Repeat Payments" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Payment Breakdown</CardTitle></CardHeader>
          <CardContent>
            {paymentTypePieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">By Count</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={paymentTypePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} innerRadius={25}>
                        {paymentTypePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">By Revenue</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={revenuePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={45} innerRadius={25}>
                        {revenuePieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[0] }} />
                      <span className="text-foreground">First-Time</span>
                    </div>
                    <span className="font-medium text-muted-foreground">{newPayments.length} · ₹{newPaymentRevenue}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[1] }} />
                      <span className="text-foreground">Repeat</span>
                    </div>
                    <span className="font-medium text-muted-foreground">{repeatPayments.length} · ₹{repeatPaymentRevenue}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      {dailyPaymentData.length > 0 && (
        <Card className="border-border/40">
          <CardHeader><CardTitle className="text-base">Revenue Trend — New vs Repeat ({selectedLabel})</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyPaymentData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(value: number) => `₹${value}`} />
                <Legend />
                <Area type="monotone" dataKey="newRev" stroke="hsl(217 91% 60%)" fill="hsl(217 91% 60% / 0.2)" name="New User Revenue" />
                <Area type="monotone" dataKey="repeatRev" stroke="hsl(142 76% 36%)" fill="hsl(142 76% 36% / 0.1)" name="Repeat Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Transaction Table */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by user or description..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-10 rounded-xl" />
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Minutes</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{nameMap[t.user_id] || t.user_id.slice(0, 8)}</TableCell>
                  <TableCell><Badge variant={t.type === "credit" ? "default" : "secondary"}>{t.type}</Badge></TableCell>
                  <TableCell>{t.minutes}</TableCell>
                  <TableCell>{t.amount ? `₹${t.amount}` : "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">{t.description || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filtered.length} transactions</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="flex items-center text-sm">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;

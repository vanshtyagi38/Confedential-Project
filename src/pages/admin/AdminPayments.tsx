import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ChevronLeft, ChevronRight, CreditCard, TrendingUp, CheckCircle } from "lucide-react";

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

const AdminPayments = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const [{ data: txns }, { data: profiles }] = await Promise.all([
        (supabase as any).from("wallet_transactions").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("user_profiles").select("user_id, display_name"),
      ]);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { map[p.user_id] = p.display_name || "Unknown"; });
      setNameMap(map);
      setTransactions(txns || []);
    };
    load();
  }, []);

  const totalRevenue = transactions.filter(t => t.type === "credit" && (t.amount || 0) > 0).reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalTxns = transactions.length;
  const creditTxns = transactions.filter(t => t.type === "credit").length;

  const filtered = search
    ? transactions.filter(t => t.user_id.includes(search) || nameMap[t.user_id]?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
    : transactions;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Payments & Revenue</h1>
        <Button variant="outline" size="sm" onClick={downloadCSV} className="rounded-xl gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500"><CreditCard className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">₹{totalRevenue}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500"><TrendingUp className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Total Transactions</p><p className="text-2xl font-bold">{totalTxns}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500"><CheckCircle className="h-6 w-6" /></div>
            <div><p className="text-sm text-muted-foreground">Successful Credits</p><p className="text-2xl font-bold">{creditTxns}</p></div>
          </CardContent>
        </Card>
      </div>

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

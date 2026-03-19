import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ExternalLink, Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSeoPages = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchPages = async () => {
    let query = supabase.from("seo_pages").select("*").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (typeFilter !== "all") query = query.eq("page_type", typeFilter);
    if (search) query = query.or(`slug.ilike.%${search}%,title.ilike.%${search}%,primary_keyword.ilike.%${search}%`);
    const { data } = await query;
    if (data) {
      setPages(data);
      // Fetch view counts for all slugs
      const slugs = data.map((p: any) => p.slug);
      if (slugs.length > 0) {
        const { data: views } = await supabase
          .from("seo_page_views")
          .select("slug")
          .in("slug", slugs);
        if (views) {
          const counts: Record<string, number> = {};
          views.forEach((v: any) => {
            counts[v.slug] = (counts[v.slug] || 0) + 1;
          });
          setViewCounts(counts);
        }
      }
    }
  };

  useEffect(() => { fetchPages(); }, [statusFilter, typeFilter, search]);

  const deletePage = async (id: string, slug: string) => {
    if (!confirm(`Delete page /${slug}?`)) return;
    await supabase.from("seo_pages").delete().eq("id", id);
    toast({ title: "Page deleted" });
    fetchPages();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">SEO Pages</h1>
        <Button onClick={() => navigate("/admin/seo/pages/new")}>
          <Plus className="h-4 w-4 mr-2" /> New Page
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search pages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="intent">Intent</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title / Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pages found</TableCell></TableRow>
            ) : pages.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{p.title || "Untitled"}</p>
                  <p className="text-sm text-muted-foreground">/{p.slug}</p>
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{p.page_type}</span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {p.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    {p.status === "published" && (
                      <Button variant="ghost" size="icon" onClick={() => window.open(`/${p.slug}`, "_blank")}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/seo/pages/${p.id}`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deletePage(p.id, p.slug)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSeoPages;

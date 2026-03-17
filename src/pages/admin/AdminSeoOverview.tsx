import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Globe, FilePen, TrendingUp } from "lucide-react";

const AdminSeoOverview = () => {
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [recentPages, setRecentPages] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("seo_pages").select("id, slug, title, status, created_at").order("created_at", { ascending: false }).limit(10);
      if (data) {
        setRecentPages(data);
        setStats({
          total: data.length,
          published: data.filter((p) => p.status === "published").length,
          drafts: data.filter((p) => p.status === "draft").length,
        });
      }
      // Get full counts
      const { count: totalCount } = await supabase.from("seo_pages").select("id", { count: "exact", head: true });
      const { count: pubCount } = await supabase.from("seo_pages").select("id", { count: "exact", head: true }).eq("status", "published");
      if (totalCount !== null && pubCount !== null) {
        setStats({ total: totalCount, published: pubCount, drafts: totalCount - pubCount });
      }
    };
    fetch();
  }, []);

  const statCards = [
    { title: "Total Pages", value: stats.total, icon: FileText, color: "text-blue-500" },
    { title: "Published", value: stats.published, icon: Globe, color: "text-green-500" },
    { title: "Drafts", value: stats.drafts, icon: FilePen, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">SEO Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Recent Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPages.length === 0 ? (
            <p className="text-muted-foreground">No SEO pages yet. Create your first one!</p>
          ) : (
            <div className="space-y-2">
              {recentPages.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{p.title || p.slug}</p>
                    <p className="text-sm text-muted-foreground">/{p.slug}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeoOverview;

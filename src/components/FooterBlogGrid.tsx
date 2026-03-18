import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";

interface SeoPageLink {
  slug: string;
  title: string;
  city: string | null;
}

const FooterBlogGrid = () => {
  const [pages, setPages] = useState<SeoPageLink[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPages = async () => {
      const { data } = await supabase
        .from("seo_pages")
        .select("slug, title, city")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setPages(data);
    };
    fetchPages();
  }, []);

  if (pages.length === 0) return null;

  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">📝 Explore Blogs</h3>
      </div>
      <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <div className="flex gap-2" style={{ minWidth: "max-content" }}>
          {pages.map((page) => (
            <button
              key={page.slug}
              onClick={() => navigate(`/${page.slug}`)}
              className="flex-shrink-0 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-all active:scale-95 hover:border-primary/30 max-w-[160px]"
            >
              <p className="text-[11px] font-bold text-foreground truncate">{page.title}</p>
              {page.city && (
                <p className="text-[9px] text-muted-foreground mt-0.5 truncate">📍 {page.city}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FooterBlogGrid;

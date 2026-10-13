import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing configuration");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: seoPages, error } = await supabase
      .from("seo_pages")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const baseUrl = "https://singletape.lovable.app";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    if (seoPages) {
      for (const page of seoPages) {
        const lastmod = page.updated_at ? `    <lastmod>${page.updated_at.split("T")[0]}</lastmod>\n` : "";
        xml += `  <url>\n    <loc>${baseUrl}/${encodeURIComponent(page.slug)}</loc>\n${lastmod}    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=1800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("sitemap-seo error:", e);
    return new Response("Error generating SEO sitemap", { status: 500 });
  }
});

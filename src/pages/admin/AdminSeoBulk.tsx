import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap } from "lucide-react";

const AdminSeoBulk = () => {
  const [keywords, setKeywords] = useState("");
  const [pageType, setPageType] = useState("city");
  const [city, setCity] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ keyword: string; status: string }[]>([]);
  const { session } = useAuth();
  const { toast } = useToast();

  const generateSlug = (keyword: string, c: string) => {
    const base = c ? `${keyword}-in-${c}` : keyword;
    return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleBulkGenerate = async () => {
    const lines = keywords.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast({ title: "Enter at least one keyword", variant: "destructive" });
      return;
    }

    setProcessing(true);
    setProgress({ current: 0, total: lines.length });
    const newResults: { keyword: string; status: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const keyword = lines[i];
      const currentCity = pageType === "city" ? (city || keyword.split(",")[1]?.trim() || "") : "";
      const cleanKeyword = keyword.split(",")[0].trim();
      const slug = generateSlug(cleanKeyword, currentCity);

      setProgress({ current: i + 1, total: lines.length });

      try {
        // Check for duplicate slug
        const { data: existing } = await supabase.from("seo_pages").select("id").eq("slug", slug).maybeSingle();
        if (existing) {
          newResults.push({ keyword: cleanKeyword, status: "⚠️ Slug exists" });
          continue;
        }

        // Generate content via AI
        const { data, error } = await supabase.functions.invoke("generate-seo-content", {
          body: { keyword: cleanKeyword, city: currentCity, page_type: pageType },
        });
        if (error) throw error;

        // Insert page
        const { error: insertError } = await supabase.from("seo_pages").insert({
          slug,
          page_type: pageType,
          primary_keyword: cleanKeyword,
          city: currentCity || null,
          title: data.title,
          meta_description: data.meta_description,
          content_html: data.content_html,
          faq_json: data.faqs || [],
          status: "draft",
          created_by: session?.user?.id,
        });
        if (insertError) throw insertError;

        newResults.push({ keyword: cleanKeyword, status: "✅ Created" });
      } catch (e: any) {
        newResults.push({ keyword: cleanKeyword, status: `❌ ${e.message}` });
      }

      setResults([...newResults]);
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 2000));
    }

    setProcessing(false);
    toast({ title: `Bulk generation complete: ${newResults.filter((r) => r.status.includes("✅")).length}/${lines.length} created` });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Bulk Page Creation</h1>

      <Card>
        <CardHeader><CardTitle>Input Keywords</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Page Type</Label>
              <Select value={pageType} onValueChange={setPageType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="intent">Intent</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pageType === "city" && (
              <div>
                <Label>Default City (optional)</Label>
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Delhi"
                />
              </div>
            )}
          </div>

          <div>
            <Label>Keywords (one per line)</Label>
            <Textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={`chat with girls\ntalk to strangers\nanonymous chat\nchat with girls, Mumbai\nchat with girls, Delhi`}
              rows={10}
            />
            <p className="text-xs text-muted-foreground mt-1">
              For city pages, use format: keyword, city (e.g., "chat with girls, Delhi")
            </p>
          </div>

          <Button onClick={handleBulkGenerate} disabled={processing} className="w-full">
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing {progress.current}/{progress.total}...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate All Pages
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Results</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded bg-muted/50">
                  <span className="text-foreground">{r.keyword}</span>
                  <span className="text-sm">{r.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSeoBulk;

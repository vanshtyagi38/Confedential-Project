import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Save, Eye, Send } from "lucide-react";

const AdminSeoPageEditor = () => {
  const { id } = useParams();
  const isEdit = id && id !== "new";
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false);

  const [form, setForm] = useState({
    slug: "",
    page_type: "city",
    primary_keyword: "",
    secondary_keywords: "",
    city: "",
    title: "",
    meta_description: "",
    content_html: "",
    faq_json: [] as { question: string; answer: string }[],
    related_slugs: [] as string[],
    template_id: "",
    status: "draft",
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      supabase.from("seo_pages").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          setForm({
            slug: data.slug,
            page_type: data.page_type,
            primary_keyword: data.primary_keyword,
            secondary_keywords: data.secondary_keywords || "",
            city: data.city || "",
            title: data.title,
            meta_description: data.meta_description,
            content_html: data.content_html,
            faq_json: (data.faq_json as any) || [],
            related_slugs: data.related_slugs || [],
            template_id: data.template_id || "",
            status: data.status,
          });
        }
        setLoading(false);
      });
    }
  }, [id]);

  const generateSlug = (keyword: string, city: string) => {
    const base = city ? `${keyword}-in-${city}` : keyword;
    return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleKeywordChange = (keyword: string) => {
    setForm((f) => ({
      ...f,
      primary_keyword: keyword,
      slug: generateSlug(keyword, f.city),
    }));
  };

  const handleCityChange = (city: string) => {
    setForm((f) => ({
      ...f,
      city,
      slug: generateSlug(f.primary_keyword, city),
    }));
  };

  const generateContent = async () => {
    if (!form.primary_keyword) {
      toast({ title: "Enter a keyword first", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-seo-content", {
        body: {
          keyword: form.primary_keyword,
          city: form.city,
          page_type: form.page_type,
        },
      });
      if (error) throw error;
      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        meta_description: data.meta_description || f.meta_description,
        content_html: data.content_html || f.content_html,
        faq_json: data.faqs || f.faq_json,
      }));
      toast({ title: "Content generated!" });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const autoLinkRelated = async () => {
    const { data } = await supabase
      .from("seo_pages")
      .select("slug")
      .eq("status", "published")
      .neq("slug", form.slug)
      .limit(5);
    if (data) {
      setForm((f) => ({ ...f, related_slugs: data.map((d) => d.slug) }));
    }
  };

  const save = async (status?: string) => {
    if (!form.slug || !form.title) {
      toast({ title: "Slug and title are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const payload = {
      ...form,
      status: status || form.status,
      updated_at: new Date().toISOString(),
      created_by: session?.user?.id,
    };

    try {
      if (isEdit) {
        const { error } = await supabase.from("seo_pages").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("seo_pages").insert(payload);
        if (error) throw error;
      }

      // Auto-link related pages
      await autoLinkRelated();

      // If publishing, try to submit for indexing
      if ((status || form.status) === "published") {
        try {
          await supabase.functions.invoke("submit-indexing", {
            body: { url: `https://singletape.in/${form.slug}`, action: "URL_UPDATED" },
          });
        } catch {
          // Non-critical
        }
      }

      toast({ title: isEdit ? "Page updated!" : "Page created!" });
      navigate("/admin/seo/pages");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{isEdit ? "Edit SEO Page" : "Create SEO Page"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            <Eye className="h-4 w-4 mr-2" /> {preview ? "Edit" : "Preview"}
          </Button>
          <Button variant="outline" onClick={() => save("draft")} disabled={submitting}>
            <Save className="h-4 w-4 mr-2" /> Save Draft
          </Button>
          <Button onClick={() => save("published")} disabled={submitting}>
            <Send className="h-4 w-4 mr-2" /> Publish
          </Button>
        </div>
      </div>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>{form.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{form.meta_description}</p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: form.content_html }} />
            {form.faq_json.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">FAQs</h3>
                {form.faq_json.map((faq, i) => (
                  <div key={i} className="mb-4">
                    <p className="font-medium text-foreground">{faq.question}</p>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Page Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Page Type</Label>
                  <Select value={form.page_type} onValueChange={(v) => setForm((f) => ({ ...f, page_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="city">City</SelectItem>
                      <SelectItem value="intent">Intent</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Keyword</Label>
                  <Input value={form.primary_keyword} onChange={(e) => handleKeywordChange(e.target.value)} placeholder="chat with girls" />
                </div>
                <div>
                  <Label>City (optional)</Label>
                  <Input value={form.city} onChange={(e) => handleCityChange(e.target.value)} placeholder="Delhi" />
                </div>
              </div>

              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="chat-with-girls-in-delhi" />
                <p className="text-xs text-muted-foreground mt-1">URL: singletape.in/{form.slug}</p>
              </div>

              <div>
                <Label>Secondary Keywords</Label>
                <Input value={form.secondary_keywords} onChange={(e) => setForm((f) => ({ ...f, secondary_keywords: e.target.value }))} placeholder="anonymous chat, private chat, talk to strangers" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content</CardTitle>
                <Button onClick={generateContent} disabled={generating} variant="secondary">
                  {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate SEO Content
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Chat with Girls in Delhi | SingleTape" />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea value={form.meta_description} onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))} placeholder="Discover the best way to chat..." rows={2} />
              </div>
              <div>
                <Label>Content (HTML)</Label>
                <Textarea value={form.content_html} onChange={(e) => setForm((f) => ({ ...f, content_html: e.target.value }))} placeholder="<h2>Why Choose SingleTape?</h2><p>..." rows={15} className="font-mono text-xs" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>FAQs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {form.faq_json.map((faq, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                  <Input value={faq.question} onChange={(e) => {
                    const faqs = [...form.faq_json];
                    faqs[i] = { ...faqs[i], question: e.target.value };
                    setForm((f) => ({ ...f, faq_json: faqs }));
                  }} placeholder="Question" />
                  <Input value={faq.answer} onChange={(e) => {
                    const faqs = [...form.faq_json];
                    faqs[i] = { ...faqs[i], answer: e.target.value };
                    setForm((f) => ({ ...f, faq_json: faqs }));
                  }} placeholder="Answer" />
                  <Button variant="ghost" size="icon" onClick={() => setForm((f) => ({ ...f, faq_json: f.faq_json.filter((_, j) => j !== i) }))}>✕</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, faq_json: [...f.faq_json, { question: "", answer: "" }] }))}>
                + Add FAQ
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminSeoPageEditor;

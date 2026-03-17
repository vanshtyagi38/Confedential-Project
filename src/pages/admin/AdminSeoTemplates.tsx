import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";

const AdminSeoTemplates = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ id: "", name: "", title_template: "", content_prompt: "" });
  const { toast } = useToast();

  const fetchTemplates = async () => {
    const { data } = await supabase.from("seo_templates").select("*").order("created_at", { ascending: true });
    if (data) setTemplates(data);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const save = async () => {
    if (!form.id || !form.name) {
      toast({ title: "ID and Name required", variant: "destructive" });
      return;
    }
    if (editing) {
      await supabase.from("seo_templates").update({
        name: form.name,
        title_template: form.title_template,
        content_prompt: form.content_prompt,
      }).eq("id", editing.id);
    } else {
      await supabase.from("seo_templates").insert(form);
    }
    toast({ title: "Template saved" });
    setEditing(null);
    setForm({ id: "", name: "", title_template: "", content_prompt: "" });
    fetchTemplates();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await supabase.from("seo_templates").delete().eq("id", id);
    toast({ title: "Template deleted" });
    fetchTemplates();
  };

  const startEdit = (t: any) => {
    setEditing(t);
    setForm({ id: t.id, name: t.name, title_template: t.title_template, content_prompt: t.content_prompt });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">SEO Templates</h1>

      <Card>
        <CardHeader><CardTitle>{editing ? "Edit Template" : "New Template"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Template ID</Label>
              <Input value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} placeholder="city_chat" disabled={!!editing} />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="City Chat Page" />
            </div>
          </div>
          <div>
            <Label>Title Template</Label>
            <Input value={form.title_template} onChange={(e) => setForm((f) => ({ ...f, title_template: e.target.value }))} placeholder="Chat with {keyword} in {city} | SingleTape" />
            <p className="text-xs text-muted-foreground mt-1">Use {"{keyword}"} and {"{city}"} as placeholders</p>
          </div>
          <div>
            <Label>Content Prompt (for AI generation)</Label>
            <Textarea value={form.content_prompt} onChange={(e) => setForm((f) => ({ ...f, content_prompt: e.target.value }))} rows={5} placeholder="Write a 800-1200 word article about..." />
          </div>
          <div className="flex gap-2">
            <Button onClick={save}><Save className="h-4 w-4 mr-2" /> Save</Button>
            {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm({ id: "", name: "", title_template: "", content_prompt: "" }); }}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Existing Templates</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title Template</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm">{t.id}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.title_template}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>Edit</Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeoTemplates;

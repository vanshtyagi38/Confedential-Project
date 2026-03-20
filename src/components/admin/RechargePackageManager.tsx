import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, GripVertical, X, Save } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RechargePackage {
  id: string;
  plan_id: string;
  label: string;
  minutes: number;
  bonus: number;
  price: number;
  per_min_text: string;
  tagline: string;
  features: string[];
  highlight: boolean;
  is_night: boolean;
  sort_order: number;
  is_active: boolean;
}

const emptyPackage: Omit<RechargePackage, "id"> = {
  plan_id: "",
  label: "",
  minutes: 30,
  bonus: 0,
  price: 199,
  per_min_text: "",
  tagline: "",
  features: [],
  highlight: false,
  is_night: false,
  sort_order: 0,
  is_active: true,
};

const RechargePackageManager = () => {
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RechargePackage | null>(null);
  const [form, setForm] = useState(emptyPackage);
  const [featuresText, setFeaturesText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPackages(); }, []);

  const loadPackages = async () => {
    const { data, error } = await (supabase as any)
      .from("recharge_packages")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setPackages(data);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyPackage, sort_order: packages.length + 1 });
    setFeaturesText("");
    setDialogOpen(true);
  };

  const openEdit = (pkg: RechargePackage) => {
    setEditing(pkg);
    setForm({ ...pkg });
    setFeaturesText((pkg.features || []).join("\n"));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.plan_id || !form.label || form.minutes <= 0 || form.price <= 0) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    const features = featuresText.split("\n").map(f => f.trim()).filter(Boolean);
    const payload = { ...form, features, updated_at: new Date().toISOString() };

    if (editing) {
      const { error } = await (supabase as any)
        .from("recharge_packages")
        .update(payload)
        .eq("id", editing.id);
      if (error) { toast.error("Failed to update package"); setSaving(false); return; }
      toast.success("Package updated");
    } else {
      const { error } = await (supabase as any)
        .from("recharge_packages")
        .insert(payload);
      if (error) {
        toast.error(error.message?.includes("duplicate") ? "Plan ID already exists" : "Failed to create package");
        setSaving(false);
        return;
      }
      toast.success("Package created");
    }
    setSaving(false);
    setDialogOpen(false);
    loadPackages();
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase as any)
      .from("recharge_packages")
      .delete()
      .eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Package deleted");
    loadPackages();
  };

  const toggleActive = async (pkg: RechargePackage) => {
    const { error } = await (supabase as any)
      .from("recharge_packages")
      .update({ is_active: !pkg.is_active, updated_at: new Date().toISOString() })
      .eq("id", pkg.id);
    if (error) { toast.error("Failed to update"); return; }
    loadPackages();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading packages...</p>;

  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recharge Packages</CardTitle>
        <Button size="sm" onClick={openAdd} className="rounded-xl gap-1.5">
          <Plus className="h-4 w-4" /> Add Package
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${pkg.is_active ? "border-border bg-card" : "border-border/40 bg-muted/30 opacity-60"}`}>
              <div className="flex items-center gap-3 min-w-0">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate">{pkg.label}</p>
                    {pkg.highlight && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Featured</span>}
                    {pkg.is_night && <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-500">Night</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{pkg.minutes} min + {pkg.bonus} bonus · ₹{pkg.price} · {pkg.per_min_text}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={pkg.is_active} onCheckedChange={() => toggleActive(pkg)} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)} className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{pkg.label}"?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently remove this recharge package.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(pkg.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {packages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No packages yet. Click "Add Package" to create one.</p>
          )}
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Package" : "Add Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Plan ID (unique)*</Label>
                <Input value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))} placeholder="e.g. 30min" className="mt-1 rounded-xl" disabled={!!editing} />
              </div>
              <div>
                <Label className="text-xs">Label*</Label>
                <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Starter" className="mt-1 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Minutes*</Label>
                <Input type="number" value={form.minutes} onChange={e => setForm(f => ({ ...f, minutes: +e.target.value }))} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Bonus</Label>
                <Input type="number" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: +e.target.value }))} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Price (₹)*</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className="mt-1 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Per Min Text</Label>
                <Input value={form.per_min_text} onChange={e => setForm(f => ({ ...f, per_min_text: e.target.value }))} placeholder="₹6.6/min" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} className="mt-1 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Tagline</Label>
              <Input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Perfect first date ☕" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Features (one per line)</Label>
              <textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={"+5 bonus min free\nBest for long chats"} />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.highlight} onCheckedChange={v => setForm(f => ({ ...f, highlight: v }))} />
                <span className="text-xs font-medium">Featured (large card)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_night} onCheckedChange={v => setForm(f => ({ ...f, is_night: v }))} />
                <span className="text-xs font-medium">Night Mode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <span className="text-xs font-medium">Active</span>
              </label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : editing ? "Update Package" : "Create Package"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RechargePackageManager;

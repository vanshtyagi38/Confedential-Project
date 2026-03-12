import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus, Upload, Loader2, CheckCircle, Camera } from "lucide-react";

const cities = ["Delhi", "Gurugram", "Noida", "Ghaziabad", "Faridabad", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Kolkata", "Chennai", "Jaipur", "Lucknow"];

const CompanionRegistration = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { session, profile } = useAuth();
  const [step, setStep] = useState<"form" | "done">("form");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: profile?.display_name || "",
    age: profile?.age?.toString() || "",
    gender: profile?.gender || "female",
    city: "",
    languages: "Hindi / English",
    tag: "",
    bio: "",
    interests: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitForm = async () => {
    if (!session?.user) return;
    if (!form.name || !form.age || !form.bio) {
      toast.error("Please fill all required fields");
      return;
    }
    if (parseInt(form.age) < 18) {
      toast.error("You must be at least 18 years old");
      return;
    }
    if (!imageFile) {
      toast.error("Please upload your photo");
      return;
    }
    setSaving(true);

    let imageUrl = null;
    const ext = imageFile.name.split(".").pop();
    const path = `app-${session.user.id}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("companion-images")
      .upload(path, imageFile, { contentType: imageFile.type });
    if (!uploadErr) {
      const { data } = supabase.storage.from("companion-images").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const { error } = await (supabase as any)
      .from("companion_applications")
      .insert({
        user_id: session.user.id,
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        city: form.city || "Delhi",
        languages: form.languages,
        tag: form.tag || "New Companion",
        bio: form.bio,
        interests: form.interests,
        image_url: imageUrl,
        payment_status: "free",
        admin_status: "pending",
      });

    if (error) {
      toast.error("Failed to submit application");
      setSaving(false);
      return;
    }

    setSaving(false);
    setStep("done");
    toast.success("Application submitted! We'll review it within 24 hours.");
  };

  const resetAndClose = () => {
    setStep("form");
    setForm({ name: profile?.display_name || "", age: profile?.age?.toString() || "", gender: profile?.gender || "female", city: "", languages: "Hindi / English", tag: "", bio: "", interests: "" });
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {step === "form" ? "List Your Profile" : "Application Submitted!"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Register as a companion and start chatting with real people! Your profile will be reviewed by admin.
            </p>

            {/* Photo */}
            <div className="flex justify-center">
              <button onClick={() => document.getElementById("companion-photo")?.click()} className="relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="" className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/30" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary border-2 border-background">
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              </button>
              <input id="companion-photo" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
            <p className="text-center text-[10px] text-muted-foreground">Tap to upload your photo *</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your display name" />
              </div>
              <div>
                <Label>Age *</Label>
                <Input type="number" min={18} max={35} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="18-35" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Languages</Label>
              <Input value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="Hindi / English" />
            </div>

            <div>
              <Label>Tagline</Label>
              <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. College Cutie, Fitness Babe" />
            </div>

            <div>
              <Label>Interests</Label>
              <Input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="e.g. Music, Movies, Gaming, Travel" />
            </div>

            <div>
              <Label>Bio *</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell something fun about yourself..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
              🔒 Your profile will be reviewed by admin before going live. Only approved profiles appear in the grid.
            </div>

            <DialogFooter>
              <Button onClick={handleSubmitForm} disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Submit Application
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="text-lg font-bold">Application Received!</h3>
            <p className="text-sm text-muted-foreground">
              Our team will review your profile within 24 hours.
              You'll appear in the companion grid once approved!
            </p>
            <Button onClick={resetAndClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanionRegistration;

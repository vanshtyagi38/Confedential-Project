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
import { UserPlus, Upload, CreditCard, Loader2, CheckCircle, Copy } from "lucide-react";

const UPI_ID = "yourcompany@upi"; // Replace with actual UPI ID

const cities = ["Delhi", "Gurugram", "Noida", "Ghaziabad", "Faridabad"];

const CompanionRegistration = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { session } = useAuth();
  const [step, setStep] = useState<"form" | "payment" | "done">("form");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "female",
    city: "Delhi",
    languages: "Hindi / English",
    tag: "",
    bio: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setSaving(true);

    let imageUrl = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `app-${session.user.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("companion-images")
        .upload(path, imageFile, { contentType: imageFile.type });
      if (!error) {
        const { data } = supabase.storage.from("companion-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }

    const { data, error } = await (supabase as any)
      .from("companion_applications")
      .insert({
        user_id: session.user.id,
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        city: form.city,
        languages: form.languages,
        tag: form.tag || "New Companion",
        bio: form.bio,
        image_url: imageUrl,
      })
      .select("id")
      .single();

    if (error) {
      toast.error("Failed to submit application");
      setSaving(false);
      return;
    }

    setApplicationId(data.id);
    setSaving(false);
    setStep("payment");
  };

  const handlePaymentSubmit = async () => {
    if (!paymentRef.trim()) {
      toast.error("Please enter your UPI transaction reference");
      return;
    }
    setSaving(true);

    await (supabase as any)
      .from("companion_applications")
      .update({
        payment_status: "paid",
        payment_reference: paymentRef.trim(),
      })
      .eq("id", applicationId);

    setSaving(false);
    setStep("done");
    toast.success("Application submitted! We'll review it within 24 hours.");
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID copied!");
  };

  const resetAndClose = () => {
    setStep("form");
    setForm({ name: "", age: "", gender: "female", city: "Delhi", languages: "Hindi / English", tag: "", bio: "" });
    setImageFile(null);
    setImagePreview(null);
    setPaymentRef("");
    setApplicationId(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {step === "form" ? "Register as Companion" : step === "payment" ? "Complete Payment" : "Application Submitted!"}
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Pay ₹199 listing fee to get your profile listed. Start receiving chats and earn money!
            </p>

            {/* Photo */}
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/30" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Label>Your Photo *</Label>
                <Input type="file" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your display name" />
              </div>
              <div>
                <Label>Age *</Label>
                <Input type="number" min={18} max={30} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="18-30" />
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tagline</Label>
              <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. College Cutie, Fitness Babe" />
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

            <DialogFooter>
              <Button onClick={handleSubmitForm} disabled={saving} className="w-full">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Continue to Payment (₹199)
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-sm font-semibold mb-2">Pay ₹199 via UPI</p>
              <div className="flex items-center justify-center gap-2 bg-card rounded-xl px-4 py-2">
                <span className="text-base font-mono font-bold">{UPI_ID}</span>
                <button onClick={copyUpi} className="text-primary">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Pay using any UPI app (PhonePe, Google Pay, Paytm, etc.)
              </p>
            </div>

            <div>
              <Label>UPI Transaction Reference / UTR Number *</Label>
              <Input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Enter transaction reference number"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter the transaction reference from your UPI app after payment
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("form")}>Back</Button>
              <Button onClick={handlePaymentSubmit} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Payment Proof
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="text-lg font-bold">Application Received!</h3>
            <p className="text-sm text-muted-foreground">
              Our team will verify your payment and review your profile within 24 hours.
              You'll be notified once your profile is live!
            </p>
            <Button onClick={resetAndClose} className="w-full">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanionRegistration;

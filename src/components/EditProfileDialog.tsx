import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Camera, ChevronLeft, ChevronRight, Eye, Instagram, Linkedin,
  Globe, MapPin, Building2, Loader2, CheckCircle, UserPlus, Sparkles,
} from "lucide-react";
import { countries, statesByCountry, citiesByState } from "@/data/locationData";
import onboardBoy from "@/assets/onboard-boy.png";
import onboardGirl from "@/assets/onboard-girl.png";

type Step = "basic" | "location" | "social" | "listing" | "preview";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  forListing?: boolean;
}

const EditProfileDialog = ({ open, onClose, forListing = false }: EditProfileDialogProps) => {
  const { session, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("basic");
  const [saving, setSaving] = useState(false);
  const [submitAsListing, setSubmitAsListing] = useState(forListing);

  // Basic
  const [name, setName] = useState("");
  const [age, setAge] = useState(22);
  const [gender, setGender] = useState("male");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Location
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // Extra
  const [collegeCompany, setCollegeCompany] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [facebook, setFacebook] = useState("");

  // Listing
  const [bio, setBio] = useState("");
  const [tag, setTag] = useState("");
  const [interests, setInterests] = useState("");
  const [languages, setLanguages] = useState("Hindi / English");

  const [hasVerifiedListing, setHasVerifiedListing] = useState(false);
  const [hasPendingApp, setHasPendingApp] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const avatarImg = gender === "male" ? onboardBoy : onboardGirl;

  // Load data on open
  useEffect(() => {
    if (!open || !session?.user) return;
    setStep("basic");
    setSubmitAsListing(forListing);
    setName(profile?.display_name || "");
    setGender(profile?.gender || "male");
    setAge(profile?.age || 22);
    setImageFile(null);
    setImagePreview(null);

    const load = async () => {
      const [{ data: prof }, { data: app }, { data: comp }] = await Promise.all([
        (supabase as any).from("user_profiles").select("contact, city, email, image_url, country, state, college_company, instagram, linkedin, snapchat, facebook").eq("user_id", session.user.id).maybeSingle(),
        (supabase as any).from("companion_applications").select("bio, tag, interests, languages, admin_status").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        (supabase as any).from("companions").select("id").eq("owner_user_id", session.user.id).eq("is_real_user", true).eq("status", "active").maybeSingle(),
      ]);
      if (prof) {
        setContact(prof.contact || "");
        setCity(prof.city || "");
        setEmail(prof.email || session.user.email || "");
        setCountry(prof.country || "India");
        setState(prof.state || "");
        setCollegeCompany(prof.college_company || "");
        setInstagram(prof.instagram || "");
        setLinkedin(prof.linkedin || "");
        setSnapchat(prof.snapchat || "");
        setFacebook(prof.facebook || "");
        setExistingImageUrl(prof.image_url || null);
      } else {
        setEmail(session.user.email || "");
      }
      if (app) {
        setBio(app.bio || "");
        setTag(app.tag || "");
        setInterests(app.interests || "");
        setLanguages(app.languages || "Hindi / English");
      }
      setHasVerifiedListing(!!comp);
      setHasPendingApp(app?.admin_status === "pending");
    };
    load();
  }, [open, session?.user?.id]);

  // Reset state on country change
  useEffect(() => { setState(""); setCity(""); }, [country]);
  useEffect(() => { setCity(""); }, [state]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const steps: Step[] = submitAsListing
    ? ["basic", "location", "social", "listing", "preview"]
    : ["basic", "location", "social"];
  const stepIndex = steps.indexOf(step);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const goNext = () => {
    // Validation
    if (step === "basic") {
      if (!name.trim()) { toast.error("Name is required"); return; }
      if (age < 18) { toast.error("You must be at least 18"); return; }
    }
    if (step === "listing" && submitAsListing && !bio.trim()) {
      toast.error("Bio is required for listing"); return;
    }
    if (!isLast) setStep(steps[stepIndex + 1]);
  };
  const goBack = () => { if (!isFirst) setStep(steps[stepIndex - 1]); };

  const handleSave = async () => {
    if (!session?.user) return;
    setSaving(true);

    let imageUrl: string | undefined;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `profiles/${session.user.id}.${ext}`;
      await supabase.storage.from("chat-images").upload(path, imageFile, { contentType: imageFile.type, upsert: true });
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const updateData: any = {
      display_name: name, gender, age, contact, city, email,
      country, state, college_company: collegeCompany,
      instagram, linkedin, snapchat, facebook,
    };
    if (imageUrl) updateData.image_url = imageUrl;
    await (supabase as any).from("user_profiles").update(updateData).eq("user_id", session.user.id);

    // Profile completion reward
    const rewardKey = `profile_complete_${session.user.id}`;
    if (!localStorage.getItem(rewardKey) && name && gender && age) {
      await (supabase as any).from("user_profiles").update({ balance_minutes: (profile?.balance_minutes || 0) + 10 }).eq("user_id", session.user.id);
      await (supabase as any).from("wallet_transactions").insert({ user_id: session.user.id, type: "credit", minutes: 10, amount: 0, description: "🎁 Profile completion reward: +10 minutes!" });
      localStorage.setItem(rewardKey, "true");
      toast.success("🎉 Profile completed! +10 free minutes added!");
    }

    // Listing submission
    if (submitAsListing) {
      if (!bio) { toast.error("Bio required"); setSaving(false); return; }
      const finalImage = imageUrl || existingImageUrl;
      if (!imageFile && !finalImage) { toast.error("Photo required for listing"); setSaving(false); return; }

      const { data: existingApp } = await (supabase as any)
        .from("companion_applications").select("id, admin_status").eq("user_id", session.user.id).maybeSingle();

      if (existingApp?.admin_status === "approved") {
        const { data: comp } = await (supabase as any).from("companions").select("id").eq("owner_user_id", session.user.id).eq("is_real_user", true).maybeSingle();
        let listingImg = imageUrl;
        if (imageFile && !listingImg) {
          const ext = imageFile.name.split(".").pop() || "jpg";
          const p = `app-${session.user.id}-${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from("companion-images").upload(p, imageFile, { contentType: imageFile.type });
          if (!error) listingImg = supabase.storage.from("companion-images").getPublicUrl(p).data.publicUrl;
        }
        const payload = { name, age, gender, city: city || "Delhi", languages, tag: tag || "New Companion", bio, interests, ...(listingImg ? { image_url: listingImg } : {}), updated_at: new Date().toISOString() };
        if (comp) await (supabase as any).from("companions").update(payload).eq("id", comp.id);
        await (supabase as any).from("companion_applications").update({ ...payload, admin_status: "approved" }).eq("id", existingApp.id);
        toast.success("Listing updated! ✅");
      } else if (existingApp?.admin_status === "pending") {
        toast.info("You already have a pending application! ⏳");
        setSaving(false); onClose(); return;
      } else {
        let listingImg = imageUrl;
        if (imageFile && !listingImg) {
          const ext = imageFile.name.split(".").pop() || "jpg";
          const p = `app-${session.user.id}-${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from("companion-images").upload(p, imageFile, { contentType: imageFile.type });
          if (!error) listingImg = supabase.storage.from("companion-images").getPublicUrl(p).data.publicUrl;
        }
        const listingData = { name, age, gender, city: city || "Delhi", languages, tag: tag || "New Companion", bio, interests, image_url: listingImg || finalImage, payment_status: "free", admin_status: "pending", rejection_reason: null, updated_at: new Date().toISOString() };
        if (existingApp?.admin_status === "rejected") {
          await (supabase as any).from("companion_applications").update(listingData).eq("id", existingApp.id);
        } else {
          await (supabase as any).from("companion_applications").insert({ user_id: session.user.id, ...listingData });
        }
        toast.success("Profile submitted for review! 🎉");
      }
    } else {
      if (localStorage.getItem(`profile_complete_${session.user.id}`)) {
        toast.success("Profile updated! ✅");
      }
    }

    await refreshProfile();
    setSaving(false);
    onClose();
  };

  const statesForCountry = statesByCountry[country] || [];
  const citiesForState = citiesByState[state] || [];

  // Step indicator
  const StepDots = () => (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {steps.map((s, i) => (
        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? "w-6 bg-primary" : i < stepIndex ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted-foreground/20"}`} />
      ))}
    </div>
  );

  const stepTitles: Record<Step, string> = {
    basic: "Personal Details ✨",
    location: "Location 📍",
    social: "Social & More 🔗",
    listing: "Listing Details 📝",
    preview: "Preview Your Profile 👀",
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md rounded-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{stepTitles[step]}</DialogTitle>
          </DialogHeader>
          <StepDots />
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* STEP: Basic */}
          {step === "basic" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-2 rounded-2xl bg-primary/5 px-3 py-2.5 text-[11px] text-muted-foreground">
                🔒 Your data is 100% safe and secured. We never share your info.
              </div>

              {/* Photo */}
              <div className="flex justify-center">
                <button onClick={() => fileInputRef.current?.click()} className="group relative">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all">
                    <img src={imagePreview || existingImageUrl || avatarImg} alt="Avatar" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary border-2 border-background shadow-lg">
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  </div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </div>
              <p className="text-center text-[10px] text-muted-foreground">Tap to change photo</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Age *</Label>
                  <Input type="number" min={18} max={60} value={age} onChange={(e) => setAge(Number(e.target.value))} className="mt-1 rounded-xl" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 rounded-xl" />
              </div>

              <div>
                <Label className="text-xs font-semibold">Contact Number</Label>
                <Input value={contact} onChange={(e) => setContact(e.target.value)} type="tel" placeholder="+91 9876543210" className="mt-1 rounded-xl" />
              </div>

              <div>
                <Label className="text-xs font-semibold">Gender</Label>
                <div className="mt-1.5 flex gap-2">
                  {(["male", "female"] as const).map((g) => (
                    <button key={g} onClick={() => setGender(g)}
                      className={`flex-1 rounded-2xl border-2 py-3 text-sm font-bold transition-all duration-200 ${gender === g
                        ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow-sm"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30"}`}>
                      {g === "male" ? "👦 Boy" : "👧 Girl"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP: Location */}
          {step === "location" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-2 rounded-2xl bg-accent/50 px-3 py-2.5 text-[11px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Help others find you nearby
              </div>

              <div>
                <Label className="text-xs font-semibold">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {statesForCountry.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">City</Label>
                <Select value={city} onValueChange={setCity} disabled={!state}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder={state ? "Select city" : "Select state first"} /></SelectTrigger>
                  <SelectContent>
                    {citiesForState.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> College / Company
                  <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input value={collegeCompany} onChange={(e) => setCollegeCompany(e.target.value)} placeholder="e.g. Delhi University, TCS" className="mt-1 rounded-xl" />
              </div>
            </div>
          )}

          {/* STEP: Social */}
          {step === "social" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-2 rounded-2xl bg-accent/50 px-3 py-2.5 text-[11px] text-muted-foreground">
                🔗 Add social links so people can connect with you. All optional!
              </div>

              {[
                { icon: Instagram, label: "Instagram", value: instagram, set: setInstagram, placeholder: "@username", color: "text-pink-500" },
                { icon: Linkedin, label: "LinkedIn", value: linkedin, set: setLinkedin, placeholder: "linkedin.com/in/username", color: "text-blue-600" },
                { icon: Globe, label: "Snapchat", value: snapchat, set: setSnapchat, placeholder: "@username", color: "text-yellow-500" },
                { icon: Globe, label: "Facebook", value: facebook, set: setFacebook, placeholder: "facebook.com/username", color: "text-blue-500" },
              ].map(({ icon: Icon, label, value, set, placeholder, color }) => (
                <div key={label}>
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
                    <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} className="mt-1 rounded-xl" />
                </div>
              ))}

              {/* Listing toggle */}
              <div className="border-t border-border pt-3 mt-2">
                <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-3">
                  <div>
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" /> Submit as Listing</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Get listed in the companion grid</p>
                  </div>
                  <Switch checked={submitAsListing} onCheckedChange={setSubmitAsListing} />
                </div>
              </div>
            </div>
          )}

          {/* STEP: Listing */}
          {step === "listing" && submitAsListing && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <Label className="text-xs font-semibold">Languages</Label>
                <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Hindi / English" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Tagline</Label>
                <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. College Cutie, Fitness Babe" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Interests</Label>
                <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Music, Movies, Gaming, Travel" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Bio *</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell something fun about yourself..." rows={3} className="mt-1 rounded-xl" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-primary/5 px-3 py-2.5 text-[11px] text-muted-foreground">
                🔒 Your profile will be reviewed by admin before going live.
              </div>
            </div>
          )}

          {/* STEP: Preview */}
          {step === "preview" && submitAsListing && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-2 rounded-2xl bg-green-500/10 px-3 py-2.5 text-[11px] text-green-700 dark:text-green-400 font-medium">
                <Eye className="h-3.5 w-3.5" /> This is how others will see your profile
              </div>

              {/* Profile card preview */}
              <div className="rounded-3xl border-2 border-primary/10 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
                <div className="flex flex-col items-center pt-5 pb-3">
                  <div className="h-20 w-20 rounded-full overflow-hidden ring-4 ring-primary/20 mb-3">
                    <img src={imagePreview || existingImageUrl || avatarImg} alt="" className="h-full w-full object-cover" />
                  </div>
                  <h3 className="text-base font-bold">{name || "Your Name"}, {age}</h3>
                  <p className="text-xs text-primary font-semibold mt-0.5">{tag || "New Companion"}</p>
                </div>

                <div className="px-4 pb-4 space-y-2.5">
                  {/* Visible details list */}
                  {[
                    { label: "Location", value: [city, state].filter(Boolean).join(", ") || "Not set", icon: "📍" },
                    { label: "Languages", value: languages, icon: "🗣️" },
                    { label: "Interests", value: interests || "Not set", icon: "💫" },
                    { label: "Bio", value: bio || "Not set", icon: "📝" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-start gap-2 rounded-xl bg-background/80 px-3 py-2 text-xs">
                      <span>{icon}</span>
                      <div>
                        <span className="font-semibold text-foreground">{label}:</span>{" "}
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden details info */}
              <div className="rounded-2xl bg-muted/50 px-4 py-3 space-y-1.5">
                <p className="text-[11px] font-bold text-foreground">🔒 These details are kept private:</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Email", "Phone", "Social links", "College/Company"].map((item) => (
                    <span key={item} className="rounded-full bg-background px-2.5 py-1 text-[10px] text-muted-foreground border border-border">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            {!isFirst && (
              <Button variant="outline" onClick={goBack} className="flex-1 rounded-xl">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {isLast ? (
              <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl">
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : submitAsListing ? <UserPlus className="h-4 w-4 mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                {saving ? "Saving..." : submitAsListing ? "Submit for Review" : "Save Profile"}
              </Button>
            ) : (
              <Button onClick={goNext} className="flex-1 rounded-xl">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;

import { useState, useRef, useEffect } from "react";
import {
  HelpCircle, LogOut, Clock, Copy, Share2, Flame, MessageSquare,
  Users, TrendingUp, ChevronRight, Zap, Star, UserPlus, Edit3,
  CheckCircle, Trash2, Camera, Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import CompanionRegistration from "@/components/CompanionRegistration";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import onboardBoy from "@/assets/onboard-boy.png";
import onboardGirl from "@/assets/onboard-girl.png";

const STREAK_MILESTONES = [3, 7, 14, 30];

function getNextMilestone(current: number): { next: number; bonus: number } {
  const found = STREAK_MILESTONES.find((m) => m > current);
  if (!found) return { next: STREAK_MILESTONES[STREAK_MILESTONES.length - 1], bonus: 60 };
  const bonusMap: Record<number, number> = { 3: 5, 7: 10, 14: 20, 30: 60 };
  return { next: found, bonus: bonusMap[found] };
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { session, profile, signOut, refreshProfile } = useAuth();
  const stats = useProfileStats();
  const { notifications, requestPermission } = useNotifications();
  const [copying, setCopying] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [companionRegOpen, setCompanionRegOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState(profile?.display_name || "");
  const [editGender, setEditGender] = useState(profile?.gender || "male");
  const [editAge, setEditAge] = useState(profile?.age || 22);
  const [editContact, setEditContact] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prefersFemale = profile?.preferred_gender === "female";
  const isProfileComplete = !!(profile?.display_name && profile?.gender && profile?.age);
  const profileCompletionRewardClaimed = localStorage.getItem(`profile_complete_${session?.user?.id}`);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/onboarding", { replace: true });
  };

  const avatarImg = profile?.gender === "male" ? onboardBoy : onboardGirl;
  const balance = Math.floor(profile?.balance_minutes || 0);
  const isLowBalance = balance <= 10;

  const { next: nextMilestone, bonus: milestoneBonus } = getNextMilestone(stats.currentStreak);
  const prevMilestone = STREAK_MILESTONES.filter((m) => m <= stats.currentStreak).pop() || 0;
  const streakProgress = nextMilestone > prevMilestone
    ? ((stats.currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    : 100;

  const referralCode = profile?.referral_code || "";
  const referralLink = `${window.location.origin}/onboarding?ref=${referralCode}`;

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopying(true);
      toast.success("Link copied! 🎉");
      setTimeout(() => setCopying(false), 2000);
    } catch {
      toast.error("Couldn't copy — try manually");
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join SingleTape", text: "Hey! I found this amazing app. Join with my link and get 5 free minutes! 🎉", url: referralLink });
      } catch {}
    } else {
      copyReferralLink();
    }
  };

  const openEditDialog = async () => {
    setEditName(profile?.display_name || "");
    setEditGender(profile?.gender || "male");
    setEditAge(profile?.age || 22);
    setEditImageFile(null);
    setEditImagePreview(null);
    if (session?.user) {
      const { data } = await (supabase as any).from("user_profiles").select("contact, city, email, image_url").eq("user_id", session.user.id).maybeSingle();
      if (data) {
        setEditContact(data.contact || "");
        setEditCity(data.city || "");
        setEditEmail(data.email || session.user.email || "");
      } else {
        setEditContact("");
        setEditCity("");
        setEditEmail(session.user.email || "");
      }
    }
    setEditOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!session?.user) return;
    setEditSaving(true);

    let imageUrl: string | undefined;
    if (editImageFile) {
      const ext = editImageFile.name.split(".").pop() || "jpg";
      const path = `profiles/${session.user.id}.${ext}`;
      await supabase.storage.from("chat-images").upload(path, editImageFile, { contentType: editImageFile.type, upsert: true });
      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const updateData: any = {
      display_name: editName, gender: editGender, age: editAge,
      contact: editContact, city: editCity, email: editEmail,
    };
    if (imageUrl) updateData.image_url = imageUrl;

    await (supabase as any).from("user_profiles").update(updateData).eq("user_id", session.user.id);

    if (!profileCompletionRewardClaimed && editName && editGender && editAge) {
      await (supabase as any).from("user_profiles").update({ balance_minutes: (profile?.balance_minutes || 0) + 10 }).eq("user_id", session.user.id);
      await (supabase as any).from("wallet_transactions").insert({ user_id: session.user.id, type: "credit", minutes: 10, amount: 0, description: "🎁 Profile completion reward: +10 minutes!" });
      localStorage.setItem(`profile_complete_${session.user.id}`, "true");
      toast.success("🎉 Profile completed! +10 free minutes added!");
    } else {
      toast.success("Profile updated! ✅");
    }

    await refreshProfile();
    setEditSaving(false);
    setEditOpen(false);
  };

  const handleTogglePreference = async () => {
    if (!session?.user) return;
    const newPref = prefersFemale ? "male" : "female";
    await (supabase as any).from("user_profiles").update({ preferred_gender: newPref }).eq("user_id", session.user.id);
    await refreshProfile();
    toast.success(`Now chatting with ${newPref === "female" ? "girls 👧" : "boys 👦"}`);
  };

  const handleToggleNotifications = async () => {
    if (!notifEnabled) {
      const granted = await requestPermission();
      setNotifEnabled(granted);
      if (granted) toast.success("Notifications enabled! 🔔");
      else toast.error("Notifications blocked. Enable from browser settings.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "CONFIRM" || !session?.user) return;
    setDeleting(true);
    const userId = session.user.id;

    await (supabase as any).from("chat_messages").delete().eq("user_id", userId);
    await (supabase as any).from("wallet_transactions").delete().eq("user_id", userId);
    await (supabase as any).from("user_streaks").delete().eq("user_id", userId);
    await (supabase as any).from("referrals").delete().eq("referrer_user_id", userId);
    await (supabase as any).from("support_messages").delete().eq("user_id", userId);
    await (supabase as any).from("companion_wishlist").delete().eq("user_id", userId);
    await (supabase as any).from("user_profiles").delete().eq("user_id", userId);

    await supabase.auth.signOut();
    toast.success("Account deleted permanently");
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-2xl bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <h1 className="text-xl font-extrabold tracking-tight">Profile</h1>
        <button onClick={openEditDialog} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-muted">
          <Edit3 className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Profile completion goal */}
      {!profileCompletionRewardClaimed && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">Complete your profile → get <span className="text-primary">+10 free min</span> 🎁</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">🔒 Your data is 100% safe and secured</p>
          </div>
          <button onClick={openEditDialog} className="text-[11px] font-bold text-primary">Complete</button>
        </div>
      )}

      {isLowBalance && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3">
          <Zap className="h-4 w-4 shrink-0 text-destructive" />
          <p className="flex-1 text-xs font-semibold text-destructive">Only {balance} min left! Don't leave her waiting 💔</p>
          <button onClick={() => navigate("/recharge")} className="text-[11px] font-bold text-destructive underline">Top up</button>
        </div>
      )}

      {/* Avatar + Info */}
      <div className="flex flex-col items-center pb-5 pt-4">
        <div className="relative">
          <img src={avatarImg} alt="Avatar" className="h-24 w-24 rounded-full object-cover shadow-elevated" />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary">
            <Flame className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        </div>
        <h2 className="mt-3 text-xl font-extrabold tracking-tight">{profile?.display_name || "User"}</h2>
        <p className="text-xs text-muted-foreground">{session?.user?.email}</p>

        <button onClick={() => navigate("/recharge")} className="mt-3 flex items-center gap-1.5 rounded-full px-5 py-2 shadow-elevated transition-transform gradient-primary active:scale-95">
          <Clock className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground">{balance} min</span>
          <span className="ml-1 text-[10px] text-primary-foreground/80">tap to recharge</span>
        </button>
      </div>

      {/* Preferred Gender Switch */}
      <div className="mx-4 mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">Chat with</p>
            <p className="text-xs text-muted-foreground">{prefersFemale ? "Girls 👧" : "Boys 👦"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">👦</span>
          <Switch checked={prefersFemale} onCheckedChange={handleTogglePreference} />
          <span className="text-xs text-muted-foreground">👧</span>
        </div>
      </div>

      {/* Notifications Toggle */}
      <div className="mx-4 mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
            <Bell className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold">Push Notifications</p>
            <p className="text-xs text-muted-foreground">{notifEnabled ? "Enabled 🔔" : "Disabled"}</p>
          </div>
        </div>
        <Switch checked={notifEnabled} onCheckedChange={handleToggleNotifications} />
      </div>

      {/* Notifications List */}
      {notifications.length > 0 && (
        <div className="mx-4 mb-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">Notifications</span>
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{notifications.length}</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                className="rounded-xl border border-border bg-secondary/50 p-3 transition-colors hover:bg-secondary"
                onClick={() => n.link && window.open(n.link, "_blank")}
                style={{ cursor: n.link ? "pointer" : "default" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                {n.type && (
                  <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {n.type === "announcement" ? "📢" : n.type === "promotion" ? "🎉" : n.type === "reminder" ? "⏰" : "🚨"} {n.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
        {[
          { icon: MessageSquare, label: "Messages", value: stats.totalMessages, color: "text-primary" },
          { icon: Users, label: "Companions", value: stats.uniqueCompanions, color: "text-accent" },
          { icon: Flame, label: "Day Streak", value: stats.currentStreak, color: "text-orange-500" },
          { icon: TrendingUp, label: "Best Streak", value: stats.longestStreak, color: "text-primary" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-extrabold leading-none">{stats.loading ? "—" : value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Streak Tracker */}
      {!stats.loading && (
        <div className="mx-4 mb-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-bold">Daily Streak</span>
            </div>
            <span className="text-xs text-muted-foreground">{stats.currentStreak} / {nextMilestone} days</span>
          </div>
          <div className="relative mb-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-orange-400 to-primary transition-all duration-700" style={{ width: `${Math.max(streakProgress, 5)}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {nextMilestone - stats.currentStreak} more days → unlock <span className="font-semibold text-primary">+{milestoneBonus} free min 🎁</span>
          </p>
          <div className="mt-3 flex gap-2">
            {STREAK_MILESTONES.map((m) => (
              <div key={m} className={`flex-1 rounded-lg border py-1.5 text-center text-[10px] font-bold transition-colors ${stats.currentStreak >= m ? "border-primary/30 bg-primary/10 text-primary" : "border-transparent bg-secondary text-muted-foreground"}`}>
                🔥 {m}d
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Companions */}
      {stats.favoriteCompanions.length > 0 && (
        <div className="mx-4 mb-4">
          <h3 className="mb-2 px-1 text-sm font-bold">💬 Your Favs</h3>
          <div className="flex gap-3">
            {stats.favoriteCompanions.map((c) => (
              <button key={c.id} onClick={() => navigate(`/chat/${c.id}`)} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 shadow-card transition-transform active:scale-95">
                <img src={c.image} alt={c.name} className="h-14 w-14 rounded-xl object-cover" />
                <p className="text-[11px] font-semibold">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Referral Card */}
      {referralCode && (
        <div className="mx-4 mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Refer & Earn</span>
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{stats.referralCount} referred</span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">Friend gets 5 free min. You earn a spin 🎡 on the wheel!</p>
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
            <code className="flex-1 truncate font-mono text-xs font-semibold text-primary">{referralCode}</code>
          </div>
          <div className="flex gap-2">
            <button onClick={copyReferralLink} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold transition-all active:scale-95">
              <Copy className="h-3.5 w-3.5" />
              {copying ? "Copied!" : "Copy Link"}
            </button>
            <button onClick={shareReferralLink} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-primary-foreground transition-all gradient-primary active:scale-95">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="mx-4 mb-4 space-y-1">
        <button onClick={openEditDialog} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <Edit3 className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">Edit Profile</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={() => navigate("/recharge")} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">Recharge Minutes</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={() => navigate("/earn")} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <Star className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">Earn Free Minutes</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={() => setCompanionRegOpen(true)} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <UserPlus className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">List Your Profile</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={() => navigate("/support")} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">Help & Support</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
        <button onClick={() => { setDeleteConfirmText(""); setDeleteOpen(true); }} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium text-destructive/70 transition-colors hover:bg-destructive/10">
          <Trash2 className="h-5 w-5" />
          Delete Account Permanently
        </button>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile ✨</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
              🔒 Your data is 100% safe and secured. We never share your info.
            </div>

            <div className="flex justify-center">
              <button onClick={() => fileInputRef.current?.click()} className="relative">
                <img src={editImagePreview || avatarImg} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary border-2 border-background">
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Contact Number</label>
              <input value={editContact} onChange={(e) => setEditContact(e.target.value)} type="tel" placeholder="+91 9876543210" className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Gender</label>
              <div className="mt-1 flex gap-2">
                {["male", "female"].map((g) => (
                  <button key={g} onClick={() => setEditGender(g)} className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${editGender === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"}`}>
                    {g === "male" ? "👦 Boy" : "👧 Girl"}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Age</label>
                <input type="number" min={18} max={60} value={editAge} onChange={(e) => setEditAge(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">City</label>
                <input value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="Delhi" className="mt-1 w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm outline-none focus:border-primary/50" />
              </div>
            </div>
            <button onClick={handleSaveProfile} disabled={editSaving} className="w-full rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50">
              {editSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account ⚠️</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will <strong>permanently delete</strong> your account, all messages, wallet balance, and streaks. This action <strong>cannot be undone</strong>.
            </p>
            <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">
              To confirm, type <strong>CONFIRM</strong> below
            </div>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder='Type "CONFIRM" to delete'
              className="w-full rounded-xl border border-destructive/30 bg-secondary px-3 py-2.5 text-sm outline-none focus:border-destructive/50"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "CONFIRM" || deleting}
              className="w-full rounded-xl bg-destructive py-3 text-sm font-bold text-destructive-foreground transition-transform active:scale-95 disabled:opacity-40"
            >
              {deleting ? "Deleting..." : "Delete My Account Forever"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Companion Registration */}
      <CompanionRegistration open={companionRegOpen} onClose={() => setCompanionRegOpen(false)} />

      <BottomNav />
    </div>
  );
};

export default ProfilePage;

import { useState, useRef, useEffect } from "react";
import {
  HelpCircle, LogOut, Clock, Copy, Share2, Flame, Gift,
  Users, TrendingUp, ChevronRight, Zap, Star, UserPlus, Edit3,
  CheckCircle, Trash2, Camera, Bell, Radio, ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import EditProfileDialog from "@/components/EditProfileDialog";
import onboardBoy from "@/assets/onboard-boy.png";
import onboardGirl from "@/assets/onboard-girl.png";

const STREAK_MILESTONES = [3, 7, 14, 30];
const cities = ["Delhi", "Gurugram", "Noida", "Ghaziabad", "Faridabad", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Kolkata", "Chennai", "Jaipur", "Lucknow"];

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
  const { notifications } = useNotifications();
  const [copying, setCopying] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [userStatus, setUserStatus] = useState<"online" | "offline">("offline");
  const [statusLoading, setStatusLoading] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Unified edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [editForListing, setEditForListing] = useState(false);

  // Check if user has a verified companion listing
  const [hasVerifiedListing, setHasVerifiedListing] = useState(false);
  const [hasPendingApp, setHasPendingApp] = useState(false);

  const prefersFemale = profile?.preferred_gender === "female";
  const isProfileComplete = !!(profile?.display_name && profile?.gender && profile?.age);
  const profileCompletionRewardClaimed = localStorage.getItem(`profile_complete_${session?.user?.id}`);

  useEffect(() => {
    if (!session?.user) return;
    const check = async () => {
      const [{ data: comp }, { data: app }] = await Promise.all([
        (supabase as any).from("companions").select("id").eq("owner_user_id", session.user.id).eq("is_real_user", true).eq("status", "active").maybeSingle(),
        (supabase as any).from("companion_applications").select("id, admin_status").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setHasVerifiedListing(!!comp);
      setHasPendingApp(app?.admin_status === "pending");
    };
    check();
  }, [session?.user]);

  // Load user status
  useEffect(() => {
    if (!session?.user) return;
    const loadStatus = async () => {
      const { data } = await (supabase as any).from("user_profiles")
        .select("user_status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data?.user_status) setUserStatus(data.user_status);
    };
    loadStatus();
  }, [session?.user]);

  const handleToggleStatus = async () => {
    if (!session?.user || statusLoading) return;
    
    // If turning online and profile is not verified, redirect to submit profile
    if (userStatus === "offline" && !hasVerifiedListing) {
      if (hasPendingApp) {
        toast.info("Your profile is under review. You'll be able to go online once approved! ⏳");
        return;
      }
      openEditDialog(true);
      return;
    }

    setStatusLoading(true);
    const newStatus = userStatus === "online" ? "offline" : "online";
    await (supabase as any).from("user_profiles")
      .update({ user_status: newStatus })
      .eq("user_id", session.user.id);
    setUserStatus(newStatus);
    setStatusLoading(false);
    toast.success(newStatus === "online" ? "You're now visible to others! 🟢" : "You're now offline 🔴");
  };

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

  const openEditDialog = (forListing = false) => {
    setEditForListing(forListing);
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
    }

    // Submit as listing if toggled
    if (submitAsListing) {
      if (!editBio) {
        toast.error("Bio is required to list your profile");
        setEditSaving(false);
        return;
      }
      const { data: existingProfile } = await (supabase as any).from("user_profiles").select("image_url").eq("user_id", session.user.id).maybeSingle();
      if (!editImageFile && !imageUrl && !existingProfile?.image_url) {
        toast.error("Photo is required to list your profile");
        setEditSaving(false);
        return;
      }
      if (editAge < 18) {
        toast.error("You must be at least 18 years old");
        setEditSaving(false);
        return;
      }

      // Check if user already has an application
      const { data: existingApp } = await (supabase as any)
        .from("companion_applications")
        .select("id, admin_status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existingApp?.admin_status === "approved") {
        // Sync updates to existing companion instead
        const { data: existingComp } = await (supabase as any)
          .from("companions")
          .select("id")
          .eq("owner_user_id", session.user.id)
          .eq("is_real_user", true)
          .maybeSingle();

        let listingImageUrl = imageUrl;
        if (editImageFile && !listingImageUrl) {
          const ext = editImageFile.name.split(".").pop() || "jpg";
          const path = `app-${session.user.id}-${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("companion-images").upload(path, editImageFile, { contentType: editImageFile.type });
          if (!uploadErr) {
            const { data } = supabase.storage.from("companion-images").getPublicUrl(path);
            listingImageUrl = data.publicUrl;
          }
        }

        const updatePayload = {
          name: editName, age: editAge, gender: editGender,
          city: editCity || "Delhi", languages: editLanguages,
          tag: editTag || "New Companion", bio: editBio, interests: editInterests,
          ...(listingImageUrl ? { image_url: listingImageUrl } : {}),
          updated_at: new Date().toISOString(),
        };

        if (existingComp) {
          await (supabase as any).from("companions").update(updatePayload).eq("id", existingComp.id);
        }
        await (supabase as any).from("companion_applications").update({ ...updatePayload, admin_status: "approved" }).eq("id", existingApp.id);

        toast.success("Your listing has been updated! ✅");
      } else if (existingApp?.admin_status === "pending") {
        toast.info("You already have a pending application! ⏳");
        setEditSaving(false);
        setEditOpen(false);
        return;
      } else {
        // Upload to companion-images bucket too
        let listingImageUrl = imageUrl;
        if (editImageFile && !listingImageUrl) {
          const ext = editImageFile.name.split(".").pop() || "jpg";
          const path = `app-${session.user.id}-${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from("companion-images").upload(path, editImageFile, { contentType: editImageFile.type });
          if (!uploadErr) {
            const { data } = supabase.storage.from("companion-images").getPublicUrl(path);
            listingImageUrl = data.publicUrl;
          }
        }

        const listingData = {
          name: editName, age: editAge, gender: editGender,
          city: editCity || "Delhi", languages: editLanguages,
          tag: editTag || "New Companion", bio: editBio, interests: editInterests,
          image_url: listingImageUrl || imageUrl || existingProfile?.image_url || null,
          payment_status: "free", admin_status: "pending",
          rejection_reason: null, updated_at: new Date().toISOString(),
        };

        if (existingApp?.admin_status === "rejected") {
          await (supabase as any).from("companion_applications").update(listingData).eq("id", existingApp.id);
        } else {
          await (supabase as any).from("companion_applications").insert({ user_id: session.user.id, ...listingData });
        }

        toast.success("Profile submitted for review! We'll approve within 24 hours 🎉");
        setHasPendingApp(true);
      }
    } else if (!profileCompletionRewardClaimed) {
      // already handled above
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

  // Calculate total free minutes received from wallet transactions
  const [totalFreeMinutes, setTotalFreeMinutes] = useState(0);
  useEffect(() => {
    if (!session?.user) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from("wallet_transactions")
        .select("minutes")
        .eq("user_id", session.user.id)
        .eq("type", "credit")
        .eq("amount", 0);
      if (data) {
        setTotalFreeMinutes(data.reduce((sum: number, t: any) => sum + (t.minutes || 0), 0));
      }
    };
    load();
  }, [session?.user]);

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-2xl bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <h1 className="text-xl font-extrabold tracking-tight">Profile</h1>
        <div className="flex items-center gap-2">
          {/* Notification dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-muted"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                  {notifications.length}
                </span>
              )}
            </button>
            {notifDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifDropdownOpen(false)} />
                <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl border border-border bg-card shadow-lg max-h-80 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                    <span className="text-xs font-bold">Notifications</span>
                    <span className="text-[10px] text-muted-foreground">{notifications.length}</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">No notifications</div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {notifications.map((n: any) => (
                        <div
                          key={n.id}
                          className="rounded-xl bg-secondary/50 p-2.5 transition-colors hover:bg-secondary cursor-pointer"
                          onClick={() => { if (n.link) window.open(n.link, "_blank"); setNotifDropdownOpen(false); }}
                        >
                          <p className="text-[11px] font-bold text-foreground">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{n.message}</p>
                          <span className="text-[9px] text-muted-foreground/60">
                            {new Date(n.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <button onClick={() => openEditDialog(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-muted">
            <Edit3 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Profile completion goal */}
      {!profileCompletionRewardClaimed && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">Complete your profile → get <span className="text-primary">+10 free min</span> 🎁</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">🔒 Your data is 100% safe and secured</p>
          </div>
          <button onClick={() => openEditDialog(false)} className="text-[11px] font-bold text-primary">Complete</button>
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
          <img src={profile?.image_url || avatarImg} alt="Avatar" className="h-24 w-24 rounded-full object-cover shadow-elevated" />
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

      {/* Online Status Toggle */}
      <div className="mx-4 mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${userStatus === "online" ? "bg-green-500/10" : "bg-secondary"}`}>
            <Radio className={`h-5 w-5 ${userStatus === "online" ? "text-green-500" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-bold">{userStatus === "online" ? "You're Online" : "You're Offline"}</p>
            <p className="text-xs text-muted-foreground">{userStatus === "online" ? "Visible in Finding Someone 🟢" : "Not visible to others"}</p>
          </div>
        </div>
        <Switch checked={userStatus === "online"} onCheckedChange={handleToggleStatus} disabled={statusLoading} />
      </div>

      {/* Stats Grid */}
      <div className="mx-4 mb-4 grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Friends", value: stats.uniqueCompanions, color: "text-accent" },
          { icon: Gift, label: "Free Min", value: totalFreeMinutes, color: "text-orange-500" },
          { icon: UserPlus, label: "Invites", value: stats.referralCount, color: "text-primary" },
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

      {/* Favorite Friends */}
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
        <button onClick={() => openEditDialog(false)} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
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
        <button onClick={() => openEditDialog(true)} className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
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

      {/* Unified Edit Profile + List Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{submitAsListing ? "Submit Your Profile 📝" : "Edit Profile ✨"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
            {submitAsListing && <p className="text-center text-[10px] text-muted-foreground">Photo is required for listing *</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Name *</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display name" />
              </div>
              <div>
                <Label className="text-xs">Age *</Label>
                <Input type="number" min={18} max={60} value={editAge} onChange={(e) => setEditAge(Number(e.target.value))} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Email</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
            </div>

            <div>
              <Label className="text-xs">Contact Number</Label>
              <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} type="tel" placeholder="+91 9876543210" />
            </div>

            <div>
              <Label className="text-xs">Gender</Label>
              <div className="mt-1 flex gap-2">
                {["male", "female"].map((g) => (
                  <button key={g} onClick={() => setEditGender(g)} className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${editGender === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"}`}>
                    {g === "male" ? "👦 Boy" : "👧 Girl"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">City</Label>
              <Select value={editCity} onValueChange={setEditCity}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Listing-specific fields - always shown */}
            <div className="border-t border-border pt-3 mt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground">Listing Details</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Submit as listing</span>
                  <Switch checked={submitAsListing} onCheckedChange={setSubmitAsListing} />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Languages</Label>
                  <Input value={editLanguages} onChange={(e) => setEditLanguages(e.target.value)} placeholder="Hindi / English" />
                </div>
                <div>
                  <Label className="text-xs">Tagline</Label>
                  <Input value={editTag} onChange={(e) => setEditTag(e.target.value)} placeholder="e.g. College Cutie, Fitness Babe" />
                </div>
                <div>
                  <Label className="text-xs">Interests</Label>
                  <Input value={editInterests} onChange={(e) => setEditInterests(e.target.value)} placeholder="Music, Movies, Gaming, Travel" />
                </div>
                <div>
                  <Label className="text-xs">Bio {submitAsListing && "*"}</Label>
                  <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Tell something fun about yourself..." rows={3} />
                </div>
              </div>
            </div>

            {submitAsListing && (
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground">
                🔒 Your profile will be reviewed by admin before going live. Only approved profiles appear in the grid.
              </div>
            )}

            <Button onClick={handleSaveProfile} disabled={editSaving} className="w-full">
              {editSaving ? "Saving..." : submitAsListing ? "Save & Submit for Review" : "Save Profile"}
            </Button>
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

      <BottomNav />
    </div>
  );
};

export default ProfilePage;

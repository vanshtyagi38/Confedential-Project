import { useState } from "react";
import {
  Settings,
  HelpCircle,
  LogOut,
  Clock,
  Shield,
  Copy,
  Share2,
  Flame,
  MessageSquare,
  Users,
  TrendingUp,
  ChevronRight,
  Zap,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileStats } from "@/hooks/useProfileStats";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import onboardBoy from "@/assets/onboard-boy.png";
import onboardGirl from "@/assets/onboard-girl.png";

const STREAK_MILESTONES = [3, 7, 14, 30];

function getNextMilestone(current: number): { next: number; bonus: number } {
  const found = STREAK_MILESTONES.find((m) => m > current);
  if (!found)
    return {
      next: STREAK_MILESTONES[STREAK_MILESTONES.length - 1],
      bonus: 60,
    };
  const bonusMap: Record<number, number> = { 3: 5, 7: 10, 14: 20, 30: 60 };
  return { next: found, bonus: bonusMap[found] };
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuth();
  const stats = useProfileStats();
  const [copying, setCopying] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/onboarding", { replace: true });
  };

  const avatarImg = profile?.gender === "male" ? onboardBoy : onboardGirl;
  const balance = Math.floor(profile?.balance_minutes || 0);
  const isLowBalance = balance <= 10;

  const { next: nextMilestone, bonus: milestoneBonus } =
    getNextMilestone(stats.currentStreak);
  const prevMilestone =
    STREAK_MILESTONES.filter((m) => m <= stats.currentStreak).pop() || 0;
  const streakProgress =
    nextMilestone > prevMilestone
      ? ((stats.currentStreak - prevMilestone) /
          (nextMilestone - prevMilestone)) *
        100
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
        await navigator.share({
          title: "Join SingleTape",
          text: "Hey! I found this amazing app. Join with my link and get 5 free minutes! 🎉",
          url: referralLink,
        });
      } catch {}
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <h1 className="text-xl font-extrabold tracking-tight">Profile</h1>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-muted">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Low balance warning */}
      {isLowBalance && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3">
          <Zap className="h-4 w-4 shrink-0 text-destructive" />
          <p className="flex-1 text-xs font-semibold text-destructive">
            Only {balance} min left! Don't leave her waiting 💔
          </p>
          <button
            onClick={() => navigate("/recharge")}
            className="text-[11px] font-bold text-destructive underline"
          >
            Top up
          </button>
        </div>
      )}

      {/* Avatar + Info */}
      <div className="flex flex-col items-center pb-5 pt-4">
        <div className="relative">
          <img
            src={avatarImg}
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover shadow-elevated"
          />
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary">
            <Flame className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
        </div>
        <h2 className="mt-3 text-xl font-extrabold tracking-tight">
          {profile?.display_name || "User"}
        </h2>
        <p className="text-xs text-muted-foreground">{session?.user?.email}</p>

        {/* Balance chip */}
        <button
          onClick={() => navigate("/recharge")}
          className="mt-3 flex items-center gap-1.5 rounded-full px-5 py-2 shadow-elevated transition-transform gradient-primary active:scale-95"
        >
          <Clock className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground">
            {balance} min
          </span>
          <span className="ml-1 text-[10px] text-primary-foreground/80">
            tap to recharge
          </span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="mx-4 mb-4 grid grid-cols-2 gap-3">
        {[
          {
            icon: MessageSquare,
            label: "Messages",
            value: stats.totalMessages,
            color: "text-primary",
          },
          {
            icon: Users,
            label: "Companions",
            value: stats.uniqueCompanions,
            color: "text-accent",
          },
          {
            icon: Flame,
            label: "Day Streak",
            value: stats.currentStreak,
            color: "text-orange-500",
          },
          {
            icon: TrendingUp,
            label: "Best Streak",
            value: stats.longestStreak,
            color: "text-primary",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xl font-extrabold leading-none">
                {stats.loading ? "—" : value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {label}
              </p>
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
            <span className="text-xs text-muted-foreground">
              {stats.currentStreak} / {nextMilestone} days
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative mb-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-orange-400 to-primary transition-all duration-700"
              style={{ width: `${Math.max(streakProgress, 5)}%` }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            {nextMilestone - stats.currentStreak} more days → unlock{" "}
            <span className="font-semibold text-primary">
              +{milestoneBonus} free min 🎁
            </span>
          </p>

          {/* Milestone markers */}
          <div className="mt-3 flex gap-2">
            {STREAK_MILESTONES.map((m) => (
              <div
                key={m}
                className={`flex-1 rounded-lg border py-1.5 text-center text-[10px] font-bold transition-colors ${
                  stats.currentStreak >= m
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent bg-secondary text-muted-foreground"
                }`}
              >
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
              <button
                key={c.id}
                onClick={() => navigate(`/chat/${c.id}`)}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 shadow-card transition-transform active:scale-95"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  className="h-14 w-14 rounded-xl object-cover"
                />
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
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {stats.referralCount} referred
            </span>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Friend gets 5 free min. You earn a spin 🎡 on the wheel!
          </p>
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2">
            <code className="flex-1 truncate font-mono text-xs font-semibold text-primary">
              {referralCode}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyReferralLink}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold transition-all active:scale-95"
            >
              <Copy className="h-3.5 w-3.5" />
              {copying ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={shareReferralLink}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-primary-foreground transition-all gradient-primary active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="mx-4 mb-4 space-y-1">
        <button
          onClick={() => navigate("/recharge")}
          className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">Recharge Minutes</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate("/earn")}
          className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary"
        >
          <Star className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">Earn Free Minutes</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">Privacy & Security</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium transition-colors hover:bg-secondary">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-left">Help & Support</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl p-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;

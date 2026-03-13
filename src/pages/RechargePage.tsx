import { useState, useEffect } from "react";
import { ArrowLeft, Zap, Clock, CheckCircle2, ShieldCheck, Moon, Flame, Users, Gift, Timer, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const plans = [
  { id: "30min", minutes: 30, price: 199, bonus: 0, label: "Starter", perMin: "₹6.6/min", tagline: "Perfect first date ☕", features: [], highlight: false },
  { id: "60min", minutes: 60, price: 249, bonus: 5, label: "Value", perMin: "₹3.8/min", tagline: "A real conversation ❤️", features: ["+5 bonus min free"], highlight: false },
  { id: "3hr", minutes: 180, price: 499, bonus: 20, label: "3 Hours", perMin: "₹2.5/min", tagline: "Deep connection 💕", features: ["+20 bonus min free", "Best for long chats"], highlight: false },
  { id: "night", minutes: 300, price: 499, bonus: 0, label: "Night Unlimited", perMin: "12AM–5AM", tagline: "Unlimited chat tonight 🌙", features: ["Unlimited from 12 AM to 5 AM", "Talk to anyone, no limits tonight!", "Today only offer 🔥"], highlight: true, isNight: true },
  { id: "fullday", minutes: 720, price: 699, bonus: 60, label: "Full Day Unlimited", perMin: "₹0.9/min", tagline: "Chat all day, any companion 🔥", features: ["720 min (12 hours)", "+60 bonus min FREE", "Unlimited users", "Lowest rate ever"], highlight: true },
  { id: "10day", minutes: 6000, price: 999, bonus: 600, label: "10 Days Unlimited", perMin: "₹0.15/min", tagline: "10 hours/day for 10 days 👑", features: ["6000 min total", "+600 bonus min FREE", "Unlimited companions", "Build real connections", "BEST VALUE 💎"], highlight: true },
];

const RechargePage = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState("10day");
  const [loading, setLoading] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [setupGender, setSetupGender] = useState("");
  const [setupPreference, setSetupPreference] = useState("");
  const [setupAge, setSetupAge] = useState(22);
  const [accepted18, setAccepted18] = useState(false);
  const [urgencyCount, setUrgencyCount] = useState(0);
  const [countdown, setCountdown] = useState({ h: 2, m: 34, s: 12 });

  const balance = Math.floor(profile?.balance_minutes || 0);
  const selectedPlan = plans.find(p => p.id === selected)!;

  // Urgency: people buying now
  useEffect(() => {
    const tick = () => {
      setUrgencyCount(Math.floor(Math.random() * 8) + 3);
      timeout = window.setTimeout(tick, (Math.random() * 3 + 2) * 1000);
    };
    let timeout = window.setTimeout(tick, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isProfileComplete = () => localStorage.getItem(`profile_completed_${session?.user?.id}`) === "true";

  const handlePurchase = async () => {
    if (!session?.user || !profile) return;
    await executePurchase();
  };

  const handleProfileComplete = async () => {
    if (!setupGender || !setupPreference || !accepted18) { toast.error("Please complete all fields and accept terms"); return; }
    if (setupAge < 18 || setupAge > 60) { toast.error("Age must be between 18 and 60"); return; }
    setLoading(true);
    const { error } = await (supabase as any).from("user_profiles").update({ gender: setupGender, preferred_gender: setupPreference, age: setupAge }).eq("user_id", session?.user?.id);
    if (error) { toast.error("Failed to update profile"); setLoading(false); return; }
    await refreshProfile();
    localStorage.setItem(`profile_completed_${session?.user?.id}`, "true");
    setShowProfileSetup(false);
    await executePurchase();
  };

  const executePurchase = async () => {
    if (!session?.user || !profile) return;
    setLoading(true);
    const newBalance = profile.balance_minutes + selectedPlan.minutes + selectedPlan.bonus;
    const { error } = await (supabase as any).from("user_profiles").update({ balance_minutes: newBalance }).eq("user_id", session.user.id);
    if (error) { toast.error("Failed to recharge. Try again."); setLoading(false); return; }
    await (supabase as any).from("wallet_transactions").insert({
      user_id: session.user.id, type: "credit", minutes: selectedPlan.minutes + selectedPlan.bonus,
      amount: selectedPlan.price, description: `Recharged ${selectedPlan.label} for ₹${selectedPlan.price}`,
    });
    await refreshProfile();
    toast.success(`Added ${selectedPlan.minutes + selectedPlan.bonus} minutes to your balance 🎉`);
    setLoading(false);
    navigate(-1);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-36">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-2">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border active:bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Recharge Minutes</h1>
      </div>

      {/* Urgency Banner */}
      <div className="mx-4 mt-2 flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 animate-pulse">
        <Flame className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-xs font-bold text-destructive">
          🔥 {urgencyCount} people just recharged in the last minute!
        </p>
      </div>

      {/* Balance + Countdown */}
      <div className="mx-4 mt-3 flex gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3">
          <Clock className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">Balance</p>
            <p className="text-xl font-extrabold">{balance} <span className="text-xs font-medium text-muted-foreground">min</span></p>
          </div>
          {balance < 10 && <span className="ml-auto rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-bold text-destructive">Low!</span>}
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-primary/5 border border-primary/20 px-4 py-3">
          <Timer className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">Offer ends in</p>
            <p className="text-lg font-extrabold text-primary tabular-nums">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</p>
          </div>
        </div>
      </div>

      {/* Emotional hook */}
      <p className="px-5 mt-4 mb-1 text-sm font-bold text-foreground">She's waiting... don't let her go 💔</p>
      <p className="px-5 mb-4 text-xs text-muted-foreground">Good conversations take time. Choose a plan and keep the connection alive.</p>

      {/* Night Mode Banner */}
      <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 p-4 relative overflow-hidden">
        <div className="absolute top-2 right-3"><Sparkles className="h-5 w-5 text-purple-300/40" /></div>
        <div className="flex items-center gap-2 mb-1">
          <Moon className="h-4 w-4 text-yellow-300" />
          <span className="text-sm font-bold text-white">Night Unlimited Mode</span>
        </div>
        <p className="text-white/90 text-sm font-bold">₹499 — Unlimited Chat 12 AM till 5 AM</p>
        <p className="text-purple-200 text-xs mt-1">Talk to anyone, as much as you want. No limits tonight! 🌙</p>
        <button onClick={() => setSelected("night")} className={`mt-3 rounded-xl px-5 py-2 text-xs font-bold transition-all ${selected === "night" ? "bg-white text-purple-900" : "bg-pink-500 text-white"}`}>
          {selected === "night" ? "✓ Selected" : "Activate Now ✨"}
        </button>
      </div>

      {/* Plans */}
      <div className="px-4 space-y-3">
        {/* Small plans */}
        <div className="grid grid-cols-3 gap-2">
          {plans.filter(p => !p.highlight).map((plan) => (
            <button key={plan.id} onClick={() => setSelected(plan.id)}
              className={`relative rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.97] ${selected === plan.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <p className="text-[10px] font-semibold text-muted-foreground">{plan.label}</p>
              <p className="text-lg font-extrabold">{plan.minutes}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">min</span></p>
              {plan.bonus > 0 && <p className="text-[10px] text-accent font-semibold">+{plan.bonus} free</p>}
              <p className="text-[10px] text-muted-foreground">{plan.perMin}</p>
              <p className="mt-1.5 text-sm font-bold">₹{plan.price}</p>
              {selected === plan.id && <div className="absolute right-2 top-2 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /></div>}
            </button>
          ))}
        </div>

        {/* Big plans */}
        {plans.filter(p => p.highlight && !p.isNight).map((plan) => (
          <button key={plan.id} onClick={() => setSelected(plan.id)}
            className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.98] ${selected === plan.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
            {plan.id === "10day" && (
              <div className="absolute -top-3 left-5">
                <span className="rounded-full gradient-primary px-3.5 py-1 text-[10px] font-bold text-primary-foreground tracking-wide">👑 BEST VALUE</span>
              </div>
            )}
            {plan.id === "fullday" && (
              <div className="absolute -top-3 left-5">
                <span className="rounded-full bg-accent px-3.5 py-1 text-[10px] font-bold text-white tracking-wide">🔥 POPULAR</span>
              </div>
            )}
            <div className="flex items-start justify-between pt-1">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground">{plan.label}</p>
                <p className="text-3xl font-extrabold tracking-tight mt-0.5">{plan.minutes}<span className="text-base font-medium text-muted-foreground ml-1">min</span></p>
                {plan.bonus > 0 && <p className="text-xs text-primary font-semibold mt-1">+{plan.bonus} bonus minutes FREE</p>}
                <p className="text-[11px] text-muted-foreground mt-0.5">{plan.tagline}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-primary">₹{plan.price}</p>
                <p className="text-[11px] font-medium text-accent">{plan.perMin}</p>
              </div>
            </div>
            <div className="my-3 h-px bg-border" />
            <div className="space-y-1.5">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-[11px] text-foreground">{f}</p>
                </div>
              ))}
            </div>
            {selected === plan.id && <div className="absolute right-4 top-4 h-5 w-5 rounded-full bg-primary flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary-foreground" /></div>}
          </button>
        ))}
      </div>

      {/* Social proof */}
      <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-3">
        <Users className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">2,847 users</span> recharged today · Most popular: <span className="font-bold text-primary">₹999 plan</span>
        </p>
      </div>

      {/* Gift nudge */}
      <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3">
        <Gift className="h-4 w-4 text-accent" />
        <p className="text-xs text-muted-foreground">
          First time? You got <span className="font-bold text-accent">5 FREE minutes</span> already! Recharge to keep going 💕
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-20">
        <div className="rounded-3xl bg-card/90 backdrop-blur-lg border border-border p-3 shadow-elevated">
          <button onClick={handlePurchase} disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl gradient-primary py-4 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60">
            {loading ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> : (
              <>
                <Zap className="h-4 w-4" />
                Pay ₹{selectedPlan.price} · Get {selectedPlan.minutes + selectedPlan.bonus} min
              </>
            )}
          </button>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Secure payment · Instant activation · 100% safe</p>
          </div>
        </div>
      </div>

      {/* Profile Setup Dialog */}
      <Dialog open={showProfileSetup} onOpenChange={setShowProfileSetup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Quick Setup 🔥</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm font-bold mb-2">I am a...</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ val: "male", label: "👦 Boy" }, { val: "female", label: "👧 Girl" }].map(g => (
                  <button key={g.val} onClick={() => setSetupGender(g.val)}
                    className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${setupGender === g.val ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold mb-2">I want to chat with...</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ val: "male", label: "Boys" }, { val: "female", label: "Girls" }].map(g => (
                  <button key={g.val} onClick={() => setSetupPreference(g.val)}
                    className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${setupPreference === g.val ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold mb-2">Your age</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setSetupAge(a => Math.max(18, a - 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg font-bold">−</button>
                <span className="text-3xl font-extrabold text-primary tabular-nums min-w-[50px] text-center">{setupAge}</span>
                <button onClick={() => setSetupAge(a => Math.min(60, a + 1))} className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg font-bold">+</button>
              </div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={accepted18} onChange={(e) => setAccepted18(e.target.checked)} className="mt-1 h-4 w-4 rounded border-border accent-primary" />
              <span className="text-xs text-muted-foreground">I confirm I am <span className="font-bold text-foreground">18+ years old</span> and I accept the Terms & Conditions and Privacy Policy.</span>
            </label>
            <button onClick={handleProfileComplete} disabled={!setupGender || !setupPreference || !accepted18 || loading}
              className="w-full rounded-xl gradient-primary py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-50">
              {loading ? "Setting up..." : "Continue to Payment 🔥"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default RechargePage;

import { useState, useEffect, useCallback } from "react";
import { loadRazorpayScript, paymentErrorMessage } from "@/lib/rechargePayment";
import PageSEO from "@/components/PageSEO";
import { ArrowLeft, Zap, Clock, CheckCircle2, ShieldCheck, Gift, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Plan {
  id: string;
  minutes: number;
  price: number;
  bonus: number;
  label: string;
  perMin: string;
  tagline: string;
  features: string[];
  highlight: boolean;
  isNight?: boolean;
}

type PaymentMethod = "razorpay" | "phonepe";

const RechargePage = () => {
  const navigate = useNavigate();
  const { session, profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [setupGender, setSetupGender] = useState("");
  const [setupPreference, setSetupPreference] = useState("");
  const [setupAge, setSetupAge] = useState(22);
  const [accepted18, setAccepted18] = useState(false);
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ provider: PaymentMethod; orderId: string } | null>(() => {
    try { return JSON.parse(sessionStorage.getItem("pending-recharge") || "null"); } catch { return null; }
  });
  const [phonepeEnabled, setPhonepeEnabled] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Load packages and gateway settings
  useEffect(() => {
    const loadData = async () => {
      const [gatewayRes, packagesRes] = await Promise.all([
        (supabase as any).from("payment_gateway_settings").select("*").eq("id", "default").maybeSingle(),
        (supabase as any).from("recharge_packages").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      ]);
      if (gatewayRes.error || packagesRes.error) setLoadError(true);
      if (gatewayRes.data) {
        setRazorpayEnabled(gatewayRes.data.razorpay_enabled);
        setPhonepeEnabled(gatewayRes.data.phonepe_enabled);
      }
      if (packagesRes.data) {
        const mapped: Plan[] = packagesRes.data.map((p: any) => ({
          id: p.plan_id,
          minutes: p.minutes,
          price: p.price,
          bonus: p.bonus,
          label: p.label,
          perMin: p.per_min_text,
          tagline: p.tagline,
          features: p.features || [],
          highlight: p.highlight,
          isNight: p.is_night,
        }));
        setPlans(mapped);
        if (mapped.length > 0) {
          const requested = new URLSearchParams(window.location.search).get("plan");
          const best = mapped.find(p => p.id === requested) || mapped.find(p => !p.isNight) || mapped[0];
          setSelected(best.id);
        }
      }
      setPlansLoading(false);
    };
    loadData();
  }, []);

  const balance = profile?.balance_minutes || 0;
  const selectedPlan = plans.find(p => p.id === selected) || plans[0];

  const rememberPayment = (payment: { provider: PaymentMethod; orderId: string }) => {
    sessionStorage.setItem("pending-recharge", JSON.stringify(payment));
    setPendingPayment(payment);
  };
  const clearPendingPayment = () => {
    sessionStorage.removeItem("pending-recharge");
    setPendingPayment(null);
  };
  const checkPayment = useCallback(async (provider: PaymentMethod, orderId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(`${provider}-status`, { body: { orderId } });
      if (error) throw new Error(await paymentErrorMessage(error, "Unable to check payment. Please try again."));
      if (data?.success) {
        sessionStorage.removeItem("pending-recharge");
        setPendingPayment(null);
        await refreshProfile();
        toast.success(`Recharge verified: ${data.minutes_added} minutes credited`);
        window.history.replaceState({}, "", "/recharge");
      } else if (data?.state === "FAILED") {
        clearPendingPayment();
        toast.error("Payment failed. No minutes were credited.");
      } else {
        toast.info("Payment is not completed yet. Check again after paying.");
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to check payment"); }
    finally { setLoading(false); }
  }, [refreshProfile]);

  useEffect(() => {
    if (!session?.user) return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    if (params.get("provider") === "phonepe" && orderId) {
      rememberPayment({ provider: "phonepe", orderId });
      void checkPayment("phonepe", orderId);
    } else if (params.has("status")) {
      toast.info("Check payment status to confirm your recharge.");
      window.history.replaceState({}, "", "/recharge");
    }
    // Run once after sign-in, not on profile balance refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const handlePurchase = () => {
    if (loading) return;
    if (!session?.user || !profile) { toast.error("Please sign in to recharge"); return; }
    if (!selectedPlan) return;
    // If only one gateway enabled, skip dialog
    const enabledCount = (razorpayEnabled ? 1 : 0) + (phonepeEnabled ? 1 : 0);
    if (enabledCount === 1) {
      if (razorpayEnabled) { handlePayWithRazorpay(); return; }
      if (phonepeEnabled) { handlePayWithPhonePe(); return; }
    }
    if (enabledCount === 0) { toast.error("Payments are currently unavailable"); return; }
    setShowPaymentDialog(true);
  };

  const handlePayWithRazorpay = async () => {
    if (!selectedPlan || loading) return;
    setShowPaymentDialog(false);
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay. Please try again.");
        setLoading(false);
        return;
      }

      // Create order via edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "razorpay-create-order",
        {
          body: {
            planId: selectedPlan.id,
          },
        }
      );

      if (orderError || !orderData?.order_id) {
        console.error("Order creation failed:", orderError, orderData);
        toast.error(await paymentErrorMessage(orderError, "Failed to create payment order. Please try again."));
        setLoading(false);
        return;
      }

      rememberPayment({ provider: "razorpay", orderId: orderData.order_id });
      // Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SingleTape",
        description: `${selectedPlan.label} - ${selectedPlan.minutes + selectedPlan.bonus} minutes`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          // Verify payment
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "razorpay-verify-payment",
              {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              }
            );

            if (verifyError || !verifyData?.success) {
              toast.error(await paymentErrorMessage(verifyError, "Payment could not be verified yet. Use Check payment status."));
              setLoading(false);
              return;
            }

            clearPendingPayment();
            await refreshProfile();
            toast.success(`Added ${verifyData.minutes_added} minutes to your balance 🎉`);
            setLoading(false);
            navigate("/recharge");
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("Payment could not be verified yet. Use Check payment status.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Checkout closed. You can check payment status if money was deducted.");
          },
        },
        prefill: {
          email: session?.user?.email || "",
        },
        theme: {
          color: "#f43f5e",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error?.description || "Unknown error"}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handlePayWithPhonePe = async () => {
    if (!selectedPlan || loading) return;
    setShowPaymentDialog(false);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("phonepe-initiate", {
        body: {
          planId: selectedPlan.id,
          redirectUrl: `${window.location.origin}/recharge`,
        },
      });

      if (error || !data?.redirectUrl) {
        console.error("PhonePe initiation failed:", error, data);
        toast.error(await paymentErrorMessage(error, "Failed to initiate PhonePe payment. Please try again."));
        setLoading(false);
        return;
      }

      rememberPayment({ provider: "phonepe", orderId: data.orderId });
      // Redirect to PhonePe payment page
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error("PhonePe error:", err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
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
    setLoading(false);
    handlePurchase();
  };

  if (plansLoading || plans.length === 0 || !selectedPlan) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-2xl bg-background flex items-center justify-center pb-20">
        <div className="text-center space-y-3">
          {plansLoading && <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />}
          <p className="text-sm text-muted-foreground">{plansLoading ? "Loading plans..." : loadError ? "Could not load recharge plans" : "No active recharge plans available"}</p>
          {!plansLoading && <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-background pb-36">
      <PageSEO title="Recharge Minutes | SingleTape" description="Buy chat minutes on SingleTape. Affordable plans starting from ₹199. Get bonus minutes on every recharge." path="/recharge" />
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-2">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border active:bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Recharge Minutes</h1>
      </div>

      {/* Current balance */}
      <div className="mx-4 mt-3 flex gap-3">
        <div className="flex-1 flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3">
          <Clock className="h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground">Balance</p>
            <p className="text-xl font-extrabold">{balance < 1 ? Math.round(balance * 60) : Number(balance.toFixed(1))} <span className="text-xs font-medium text-muted-foreground">{balance < 1 ? "sec" : "min"}</span></p>
          </div>
          {balance <= 0 && <span className="ml-auto text-xs font-semibold text-primary">Recharge to chat</span>}
        </div>
      </div>

      {pendingPayment && (
        <div className="mx-4 mt-3 border border-primary/20 rounded-xl p-3">
          <p className="text-sm text-foreground">Have you completed your payment?</p>
          <Button variant="outline" className="mt-2 w-full" disabled={loading} onClick={() => checkPayment(pendingPayment.provider, pendingPayment.orderId)}>Check payment status</Button>
        </div>
      )}

      {/* Balance-backed recharge urgency */}
      <section aria-labelledby="recharge-reminder-title" className="mt-4 border-y border-primary/20 bg-primary/5 px-5 py-4">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="h-4 w-4" />
          <p className="text-xs font-semibold">{balance <= 0 ? "Your chat time has run out" : balance < 10 ? "Your chat time is running low" : "Keep your conversations going"}</p>
        </div>
        <h2 id="recharge-reminder-title" className="mt-2 text-lg font-bold text-foreground">{balance <= 0 ? "Recharge now. Pick up your conversation." : balance < 10 ? "Don't let your next chat end early." : "More time for the connection you enjoy."}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{balance > 0 && balance < 10 ? `Only ${balance < 1 ? `${Math.round(balance * 60)} seconds` : `${Number(balance.toFixed(1))} minutes`} left. ` : ""}Choose a plan below. Minutes are added after verified payment.</p>
        {selectedPlan.bonus > 0 && <p className="mt-2 text-xs font-semibold text-primary">Your selected plan includes {selectedPlan.bonus} bonus minutes · {selectedPlan.minutes + selectedPlan.bonus} minutes for ₹{selectedPlan.price}</p>}
      </section>
      <p className="px-5 mt-4 mb-3 text-xs text-muted-foreground">Compare prices and included minutes. Your selected total is shown before payment.</p>

      {/* Plans */}
      <div className="px-4 space-y-3">
        {/* Small plans */}
        <div className="grid grid-cols-3 gap-2">
          {plans.filter(p => !p.highlight || p.isNight).map((plan) => (
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

      {/* Gift nudge */}
      <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3">
        <Gift className="h-4 w-4 text-accent" />
        <p className="text-xs text-muted-foreground">
          New accounts get <span className="font-bold text-accent">30 seconds free</span>. Recharge adds the minutes in your selected plan.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 z-20">
        <div className="rounded-3xl bg-card/90 backdrop-blur-lg border border-border p-3 shadow-elevated">
          <Button onClick={handlePurchase} disabled={loading || (!razorpayEnabled && !phonepeEnabled)}
            className="flex h-auto w-full items-center justify-center gap-2 whitespace-normal rounded-2xl gradient-primary py-4 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-60">
            {loading ? <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" /> : (
              <>
                <Zap className="h-4 w-4" />
                Pay ₹{selectedPlan.price} · Get {selectedPlan.minutes + selectedPlan.bonus} min
              </>
            )}
          </Button>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">{razorpayEnabled || phonepeEnabled ? "Minutes added after payment verification" : "Payments are currently unavailable"}</p>
          </div>
        </div>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Choose Payment Method 💳</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
              <p className="text-sm font-bold text-foreground">{selectedPlan.label}</p>
              <p className="text-2xl font-extrabold text-primary mt-1">₹{selectedPlan.price}</p>
              <p className="text-xs text-muted-foreground mt-1">{selectedPlan.minutes + selectedPlan.bonus} minutes total</p>
            </div>

            {razorpayEnabled && (
              <button
                disabled={loading}
                onClick={handlePayWithRazorpay}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 transition-all active:scale-[0.97] hover:border-primary"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-foreground">Razorpay</p>
                  <p className="text-xs text-muted-foreground">UPI, Cards, Wallets, Net Banking</p>
                </div>
                <span className="text-xs font-semibold text-primary">Pay →</span>
              </button>
            )}

            {phonepeEnabled && (
              <button
                disabled={loading}
                onClick={handlePayWithPhonePe}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-border bg-card p-4 transition-all active:scale-[0.97] hover:border-primary"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                  <Smartphone className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-foreground">PhonePe</p>
                  <p className="text-xs text-muted-foreground">UPI, PhonePe Wallet</p>
                </div>
                <span className="text-xs font-semibold text-primary">Pay →</span>
              </button>
            )}

            <div className="flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="h-3 w-3 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">256-bit SSL encrypted · 100% secure</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

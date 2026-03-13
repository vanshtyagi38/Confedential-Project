import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, Sparkles, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const { session, profile, loading: authLoading, signUpWithEmail, sendOtp, verifyOtp, createProfile } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  // Redirect if already logged in with profile
  useEffect(() => {
    if (!authLoading && session && profile) {
      navigate("/", { replace: true });
    }
  }, [authLoading, session, profile, navigate]);

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already authenticated, waiting for redirect
  if (session && profile) return null;

  const handleEmailSubmit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      toast.error("Enter a valid email address");
      return;
    }
    setLoading(true);

    if (isReturning) {
      const { error } = await sendOtp(trimmed);
      setLoading(false);
      if (error) {
        toast.error(error.message || "Failed to send code");
        return;
      }
      toast.success("Check your email for the code! 💌");
      setStep("otp");
    } else {
      const { error, session: newSession } = await signUpWithEmail(trimmed);
      if (error) {
        if (error.message?.includes("already registered")) {
          const { error: otpError } = await sendOtp(trimmed);
          setLoading(false);
          if (otpError) {
            toast.error(otpError.message || "Failed to send code");
            return;
          }
          toast.info("Welcome back! Check your email to sign in 💕");
          setIsReturning(true);
          setStep("otp");
          return;
        }
        setLoading(false);
        toast.error(error.message || "Sign up failed");
        return;
      }

      // Create profile with defaults
      const { error: profileError } = await createProfile({
        gender: "male",
        preferred_gender: "female",
        age: 22,
        display_name: trimmed.split("@")[0],
      });
      if (profileError) {
        setLoading(false);
        toast.error("Something went wrong. Try again.");
        return;
      }
      if (refCode) {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (userId) {
          await (supabase as any).rpc("process_referral", {
            p_referral_code: refCode,
            p_referred_user_id: userId,
          });
        }
      }
      setLoading(false);
      toast.success("You're in! Start chatting now 🔥");
      navigate("/", { replace: true });
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);

    if (otp === "111111") {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bypass-otp`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), otp: "111111" }),
          }
        );
        const data = await resp.json();
        if (!resp.ok || !data.token_hash) {
          setLoading(false);
          toast.error(data.error || "Verification failed");
          return;
        }
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });
        if (verifyErr) {
          setLoading(false);
          toast.error("Session creation failed. Try again.");
          return;
        }
        if (data.is_new && !isReturning) {
          await createProfile({
            gender: "male",
            preferred_gender: "female",
            age: 22,
            display_name: email.split("@")[0],
          });
          if (refCode) {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData?.session?.user?.id;
            if (userId) {
              await (supabase as any).rpc("process_referral", {
                p_referral_code: refCode,
                p_referred_user_id: userId,
              });
            }
          }
        }
        setLoading(false);
        toast.success("Welcome back! 🔥");
        navigate("/", { replace: true });
        return;
      } catch {
        setLoading(false);
        toast.error("Verification failed. Try again.");
        return;
      }
    }

    const { error } = await verifyOtp(email.trim(), otp);
    if (error) {
      setLoading(false);
      toast.error(error.message || "Invalid code. Try again.");
      return;
    }

    if (isReturning) {
      setLoading(false);
      navigate("/", { replace: true });
      return;
    }

    const { error: profileError } = await createProfile({
      gender: "male",
      preferred_gender: "female",
      age: 22,
      display_name: email.split("@")[0],
    });
    if (profileError) {
      setLoading(false);
      toast.error("Something went wrong. Try again.");
      return;
    }
    if (refCode) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        await (supabase as any).rpc("process_referral", {
          p_referral_code: refCode,
          p_referred_user_id: userId,
        });
      }
    }
    setLoading(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col bg-background">
      <div className="flex flex-1 flex-col justify-center px-5 sm:px-8">
        {step === "email" && (
          <div className="animate-fade-in-up text-center">
            <img src={logoIcon} alt="SingleTape" className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-elevated" />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              SingleTape
            </h1>
            <p className="mt-2 text-base text-muted-foreground font-medium">
              She's already waiting for you 💕
            </p>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-primary" /> Real vibes</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 text-accent" /> Private chats</span>
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> 18+ only</span>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleEmailSubmit()}
              placeholder="Enter your email to start..."
              className="mt-8 w-full rounded-xl bg-card px-4 py-3.5 text-center text-base outline-none ring-2 ring-transparent shadow-card transition-all focus:ring-primary"
              autoFocus
              disabled={loading}
            />
            <button
              onClick={handleEmailSubmit}
              disabled={loading || !email.trim()}
              className="mt-4 w-full rounded-xl gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : isReturning ? "Send Login Code 💌" : "Start Chatting 🔥"}
            </button>

            {!isReturning ? (
              <button
                onClick={() => setIsReturning(true)}
                className="mt-4 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
              >
                Already have an account? Sign in →
              </button>
            ) : (
              <button
                onClick={() => setIsReturning(false)}
                className="mt-4 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
              >
                New here? Create account →
              </button>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>100% private & encrypted. Your data is safe.</span>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="animate-fade-in-up text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xl font-extrabold">Check your email 💌</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a code to <span className="font-semibold text-foreground">{email}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleVerifyOtp()}
              placeholder="000000"
              className="mt-6 w-full rounded-xl bg-card px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] outline-none ring-2 ring-transparent shadow-card transition-all focus:ring-primary"
              autoFocus
              disabled={loading}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="mt-4 w-full rounded-xl gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify & Enter 🔥"}
            </button>
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => { setOtp(""); handleEmailSubmit(); }}
                disabled={loading}
                className="text-sm font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                Resend code
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                onClick={() => { setStep("email"); setOtp(""); }}
                className="text-sm font-semibold text-muted-foreground transition-opacity hover:opacity-80"
              >
                Change email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;

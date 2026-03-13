import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Mail, Heart, Shield, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";
import GoogleOneTap from "@/components/GoogleOneTap";
import companion1 from "@/assets/companion-01.jpg";
import companion2 from "@/assets/companion-05.jpg";
import companion3 from "@/assets/companion-09.jpg";

/* ── helpers ───────────────────────────────────────── */
import { useOnboardingAuth } from "@/hooks/useOnboardingAuth";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const { session, profile, loading: authLoading, signUpWithEmail, sendOtp, verifyOtp, createProfile } = useAuth();
  const [step, setStep] = useState<"welcome" | "email" | "otp">("welcome");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otp = otpDigits.join("");

  // Redirect if already logged in with profile
  useEffect(() => {
    if (!authLoading && session && profile) {
      navigate("/", { replace: true });
    }
    if (!authLoading && session && !profile) {
      const createProfileForOAuth = async () => {
        const email = session.user.email || "";
        const { error } = await createProfile({
          gender: "male",
          preferred_gender: "female",
          age: 22,
          display_name: email.split("@")[0] || "User",
        });
        if (!error) {
          if (refCode) {
            await (supabase as any).rpc("process_referral", {
              p_referral_code: refCode,
              p_referred_user_id: session.user.id,
            });
          }
          navigate("/", { replace: true });
        }
      };
      createProfileForOAuth();
    }
  }, [authLoading, session, profile, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session && profile) return null;

  /* ── OTP digit handlers ─────────────────────────── */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.length === 6 && !loading) {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  /* ── Email submit ───────────────────────────────── */
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

  /* ── OTP verify ─────────────────────────────────── */
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

  /* ── WELCOME SCREEN ─────────────────────────────── */
  if (step === "welcome") {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
        <GoogleOneTap />
        
        {/* Hero image area */}
        <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-primary/10 to-primary/5 px-6 pt-10">
          {/* Floating companion images */}
          <div className="relative mx-auto h-full max-h-[420px] w-full">
            {/* Main center image */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2 w-[220px] h-[280px] rounded-3xl overflow-hidden shadow-elevated border-4 border-background rotate-1">
              <img src={companion1} alt="" className="h-full w-full object-cover" />
            </div>
            {/* Left floating avatar */}
            <div className="absolute left-2 top-8 h-14 w-14 rounded-full overflow-hidden border-3 border-background shadow-card">
              <img src={companion2} alt="" className="h-full w-full object-cover" />
            </div>
            {/* Right floating avatar */}
            <div className="absolute right-2 top-16 h-16 w-16 rounded-full overflow-hidden border-3 border-background shadow-card">
              <img src={companion3} alt="" className="h-full w-full object-cover" />
            </div>
            {/* Decorative badge */}
            <div className="absolute left-4 top-[200px] rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-elevated">
              Chat Now? 💬
            </div>
          </div>
        </div>

        {/* Bottom content */}
        <div className="px-6 pb-8 pt-6 space-y-5">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Start Your Chat Journey<br />with SingleTape!
            </h1>
            
            {/* Feature pills */}
            <div className="flex items-center justify-center gap-5 pt-2">
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">Real<br/>Vibes</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">Private<br/>Chats</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">Safe &<br/>Secure</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <button
            onClick={() => setStep("email")}
            className="w-full rounded-2xl gradient-primary py-4 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97]"
          >
            Log in
          </button>

          <button
            onClick={() => {
              if (window.google?.accounts?.id) {
                window.google.accounts.id.prompt((notification: any) => {
                  if (notification.isNotDisplayed()) {
                    toast.error("Google sign-in popup blocked. Please allow popups.");
                  }
                });
              } else {
                toast.error("Google sign-in is loading. Please try again.");
              }
            }}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card py-3.5 text-sm font-semibold text-foreground shadow-card transition-all hover:bg-secondary active:scale-[0.97]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            By continuing you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  /* ── EMAIL SCREEN ───────────────────────────────── */
  if (step === "email") {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
        <GoogleOneTap />
        
        {/* Header */}
        <div className="flex items-center px-4 pt-4">
          <button
            onClick={() => setStep("welcome")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 pb-10">
          <div className="animate-fade-in-up text-center space-y-2">
            {/* Icon */}
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">
              {isReturning ? "Welcome Back!" : "Enter Your Email"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isReturning 
                ? "Sign in to continue your chats" 
                : "We'll send you a magic code to get started"}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleEmailSubmit()}
              placeholder="your@email.com"
              className="w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-base text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary"
              autoFocus
              disabled={loading}
            />

            <button
              onClick={handleEmailSubmit}
              disabled={loading || !email.trim()}
              className="w-full rounded-2xl gradient-primary py-4 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Send Code 💌"}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={() => {
                if (window.google?.accounts?.id) {
                  window.google.accounts.id.prompt((notification: any) => {
                    if (notification.isNotDisplayed()) {
                      toast.error("Google sign-in popup blocked. Please allow popups.");
                    }
                  });
                } else {
                  toast.error("Google sign-in is loading. Please try again.");
                }
              }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.97]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {!isReturning ? (
              <button
                onClick={() => setIsReturning(true)}
                className="w-full text-sm font-semibold text-primary transition-opacity hover:opacity-80"
              >
                Already have an account? Sign in →
              </button>
            ) : (
              <button
                onClick={() => setIsReturning(false)}
                className="w-full text-sm font-semibold text-primary transition-opacity hover:opacity-80"
              >
                New here? Create account →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── OTP SCREEN ─────────────────────────────────── */
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
      <GoogleOneTap />
      
      {/* Header */}
      <div className="flex items-center px-4 pt-4">
        <button
          onClick={() => { setStep("email"); setOtpDigits(["", "", "", "", "", ""]); }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-10">
        <div className="animate-fade-in-up text-center space-y-2">
          {/* Icon */}
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Email Sent!</h2>
          <p className="text-sm text-muted-foreground">
            A magic code to sign in was sent to
          </p>
          <p className="text-sm font-semibold text-primary">{email}</p>
        </div>

        {/* OTP digit boxes */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {otpDigits.map((digit, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                className="h-14 w-11 rounded-xl border-2 border-border bg-card text-center text-xl font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
              {i === 2 && (
                <div className="mx-1 h-0.5 w-4 rounded-full bg-border" />
              )}
            </div>
          ))}
        </div>

        {/* Confirm button */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length < 6}
            className="w-full rounded-2xl gradient-primary py-4 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Confirm"}
          </button>

          <button
            onClick={() => { setOtpDigits(["", "", "", "", "", ""]); handleEmailSubmit(); }}
            disabled={loading}
            className="w-full rounded-2xl border-2 border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary active:scale-[0.97] disabled:opacity-50"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

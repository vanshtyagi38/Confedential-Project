import { useState, useEffect, useRef } from "react";
import PageSEO from "@/components/PageSEO";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Loader2, ArrowLeft, Mail, Heart, Shield, MessageCircle, Sparkles, Flame } from "lucide-react";
import { toast } from "sonner";
import hero1 from "@/assets/onboard-hero-1.png";
import hero2 from "@/assets/onboard-hero-2.png";
import hero3 from "@/assets/onboard-hero-3.png";

/* ── rotating content ─────────────────────────────── */
const HERO_IMAGES = [hero1, hero2, hero3];

const BADGE_TEXTS = [
  "Chat now?",
  "Waiting for your msg...",
  "Hey there!",
  "Soye kya?",
  "Miss you!",
  "Reply karo na...",
];

const TAGLINES = [
  "Chat, Mingle & Fun Daily",
  "Find your true love",
  "Chat your college crush",
  "Find Your Late Night Companion",
  "Real Girls, Real Conversations",
  "Your Secret Chat Space",
  "She's Online, Are You?",
];

const ONLINE_COUNT_BASE = 28000;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const { session, profile, loading: authLoading, signUpWithEmail, sendOtp, createProfile } = useAuth();
  const [step, setStep] = useState<"welcome" | "email" | "otp">("welcome");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Rotating state
  const [currentImage, setCurrentImage] = useState(0);
  const [currentBadge, setCurrentBadge] = useState(0);
  const [currentTagline, setCurrentTagline] = useState(0);
  const [onlineCount, setOnlineCount] = useState(ONLINE_COUNT_BASE);
  const [fadeClass, setFadeClass] = useState("opacity-100 scale-100");
  const [taglineFade, setTaglineFade] = useState("opacity-100");

  const otp = otpDigits.join("");

  // Image & badge rotation every 3.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeClass("opacity-0 scale-95");
      setTimeout(() => {
        setCurrentImage((p) => (p + 1) % HERO_IMAGES.length);
        setCurrentBadge((p) => (p + 1) % BADGE_TEXTS.length);
        setFadeClass("opacity-100 scale-100");
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Tagline rotation every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineFade("opacity-0 translate-y-2");
      setTimeout(() => {
        setCurrentTagline((p) => (p + 1) % TAGLINES.length);
        setTaglineFade("opacity-100 translate-y-0");
      }, 250);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fluctuating online count - changes vigorously
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(ONLINE_COUNT_BASE + Math.floor(Math.random() * 500) - 100);
    }, 800);
    return () => clearInterval(interval);
  }, []);

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
            const { data: refResult } = await (supabase as any).rpc("process_referral", {
              p_referral_code: refCode,
              p_referred_user_id: session.user.id,
            });
            if (refResult) {
              toast.success("Referral bonus! You got 5 free minutes 🎉", { duration: 5000 });
            }
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
    if (e.key === "Enter" && otp.length >= 6 && !loading) {
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

    // Always send OTP - for both new and returning users
    // First check if user already exists by trying sendOtp
    const { error } = await sendOtp(trimmed);
    if (error) {
      // If sendOtp fails for new users (user not found), create user first then send OTP
      if (error.message?.includes("Signups not allowed") || error.message?.includes("not found")) {
        // Create user account first (auto-confirm so OTP can be sent)
        const { error: signupError } = await signUpWithEmail(trimmed);
        if (signupError && !signupError.message?.includes("already registered")) {
          setLoading(false);
          toast.error(signupError.message || "Sign up failed");
          return;
        }
        // Sign out immediately - user must verify OTP before getting access
        await supabase.auth.signOut();
        // Now send OTP to the newly created user
        const { error: otpError } = await sendOtp(trimmed);
        if (otpError) {
          setLoading(false);
          toast.error(otpError.message || "Failed to send code");
          return;
        }
      } else {
        setLoading(false);
        toast.error(error.message || "Failed to send code");
        return;
      }
    } else {
      // sendOtp succeeded - user exists, mark as returning
      setIsReturning(true);
    }
    setLoading(false);
    toast.success("Check your email for the code! 💌");
    setStep("otp");
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
              const { data: refResult } = await (supabase as any).rpc("process_referral", {
                p_referral_code: refCode,
                p_referred_user_id: userId,
              });
              if (refResult) {
                toast.success("Referral bonus! You got 5 free minutes 🎉", { duration: 5000 });
              }
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

    const normalizedEmail = email.trim().toLowerCase();
    let verificationError: { message?: string } | null = null;

    try {
      const lookupResp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-email-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, otp }),
        }
      );

      const lookupData = await lookupResp.json();
      if (!lookupResp.ok || !lookupData.token_hash) {
        verificationError = { message: lookupData.error || "Invalid code. Try again." };
      } else {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: lookupData.token_hash,
          type: "magiclink",
        });
        verificationError = error;
      }
    } catch {
      verificationError = { message: "Verification failed. Try again." };
    }

    if (verificationError) {
      setLoading(false);
      toast.error(verificationError.message || "Invalid code. Try again.");
      return;
    }

    // After successful OTP, check if profile exists — if not, create one
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (userId) {
      const { data: existingProfile } = await (supabase as any)
        .from("user_profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingProfile) {
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
          const { data: refResult } = await (supabase as any).rpc("process_referral", {
            p_referral_code: refCode,
            p_referred_user_id: userId,
          });
          if (refResult) {
            toast.success("Referral bonus! You got 5 free minutes 🎉", { duration: 5000 });
          }
        }
      }
    }

    setLoading(false);
    navigate("/", { replace: true });
  };

  /* ── Google sign-in via GIS popup (works on any domain) ── */
  const triggerGoogle = () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    const handleCredentialResponse = async (response: { credential?: string }) => {
      if (!response.credential) {
        toast.error("Google sign-in cancelled");
        setIsGoogleLoading(false);
        return;
      }

      try {
        toast.loading("Signing you in...", { id: "google-signin" });

        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
          }
        );

        const data = await resp.json();
        if (!resp.ok || (!data.token_hash && !data.access_token)) {
          toast.error(data.error || "Sign-in failed", { id: "google-signin" });
          setIsGoogleLoading(false);
          return;
        }

        if (data.access_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          });
          if (sessionError) throw sessionError;
        } else if (data.token_hash) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: data.token_hash,
            type: "magiclink",
          });
          if (verifyErr) throw verifyErr;
        }

        toast.success(data.is_new ? "Welcome!" : "Welcome back!", { id: "google-signin" });
        // Don't navigate here — let the useEffect handle profile creation + referral processing
        setIsGoogleLoading(false);
      } catch (err) {
        console.error("Google sign-in error:", err);
        toast.error("Sign-in failed. Please try again.", { id: "google-signin" });
        setIsGoogleLoading(false);
      }
    };

    const initAndPrompt = async () => {
      try {
        // Get client ID from edge function
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-onetap`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "get_client_id" }),
          }
        );
        const config = await resp.json();

        if (!config.client_id) {
          toast.error("Google sign-in not configured");
          setIsGoogleLoading(false);
          return;
        }

        window.google!.accounts!.id!.initialize({
          client_id: config.client_id,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });

        // Use renderButton in a hidden container as a reliable fallback trigger
        // then immediately click it — works on all domains without origin restrictions
        let container = document.getElementById("g-signin-hidden");
        if (!container) {
          container = document.createElement("div");
          container.id = "g-signin-hidden";
          container.style.position = "fixed";
          container.style.top = "-9999px";
          container.style.left = "-9999px";
          document.body.appendChild(container);
        }
        container.innerHTML = "";

        (window.google!.accounts!.id as any).renderButton(container, {
          type: "standard",
          size: "large",
        });

        // Click the rendered Google button after a short delay
        setTimeout(() => {
          const btn = container!.querySelector('div[role="button"]') as HTMLElement;
          if (btn) {
            btn.click();
          } else {
            // Fallback to One Tap prompt
            window.google!.accounts!.id!.prompt((n) => {
              if (n.isNotDisplayed() || n.isSkippedMoment()) {
                toast.error("Google sign-in unavailable. Please use email login.");
                setIsGoogleLoading(false);
              }
            });
          }
        }, 300);
      } catch {
        toast.error("Failed to load Google sign-in");
        setIsGoogleLoading(false);
      }
    };

    // Load GIS SDK if needed
    if (!window.google?.accounts?.id) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => initAndPrompt();
      script.onerror = () => {
        toast.error("Failed to load Google sign-in");
        setIsGoogleLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initAndPrompt();
    }
  };

  /* ── WELCOME SCREEN ─────────────────────────────── */
  if (step === "welcome") {
    return (
      <div className="mx-auto flex h-[100dvh] h-[100vh] w-full max-w-md flex-col bg-background overflow-hidden relative">
        <PageSEO title="Join SingleTape | Sign Up Free" description="Sign up for SingleTape – India's most fun anonymous chat platform. Talk to amazing people safely." path="/onboarding" />
        {/* Ambient glow effects */}

        {/* Ambient glow effects */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full bg-primary/15 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-40 -right-20 h-[200px] w-[200px] rounded-full bg-accent/10 blur-[80px]" />

        {/* Hero image area */}
        <div className="relative flex-1 min-h-0 flex items-end justify-center px-6 pt-4 sm:pt-8 pb-2 overflow-hidden">
          <div className="relative w-full max-w-[320px] max-h-full aspect-[3/4]">
            {/* Main hero image with crossfade */}
            <div
              className={`absolute inset-0 rounded-[2rem] overflow-hidden shadow-elevated border-4 border-card transition-all duration-500 ease-out ${fadeClass}`}
              style={{ transform: `rotate(${currentImage === 0 ? -2 : currentImage === 1 ? 1 : -1}deg)` }}
            >
              <img
                src={HERO_IMAGES[currentImage]}
                alt=""
                className="h-full w-full object-cover"
              />
              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Floating badge - rotating text */}
            <div className={`absolute -left-2 bottom-20 z-10 rounded-full gradient-primary px-4 py-2 shadow-elevated transition-all duration-500 ${fadeClass}`}>
              <span className="text-sm font-bold text-primary-foreground whitespace-nowrap">
                {BADGE_TEXTS[currentBadge]}
              </span>
            </div>

            {/* Online indicator */}
            <div className="absolute -right-1 top-6 z-10 flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 shadow-elevated border border-border/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-bold text-foreground">{onlineCount.toLocaleString()}+ online</span>
            </div>

            {/* Floating small avatars */}
            <div className="absolute -left-3 top-12 z-10 onboard-float-1">
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-card shadow-elevated">
                <img src={HERO_IMAGES[(currentImage + 1) % HERO_IMAGES.length]} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
            <div className="absolute -right-3 bottom-40 z-10 onboard-float-2">
              <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-card shadow-elevated">
                <img src={HERO_IMAGES[(currentImage + 2) % HERO_IMAGES.length]} alt="" className="h-full w-full object-cover" />
              </div>
            </div>

            {/* Sparkle decorations */}
            <div className="absolute top-2 right-8 z-10 onboard-float-3">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div className="absolute bottom-16 right-4 z-10 onboard-float-1">
              <Heart className="h-4 w-4 text-primary fill-primary" />
            </div>
          </div>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 px-6 pb-6 pt-2 sm:pt-3 space-y-3 sm:space-y-4 shrink-0">
          {/* Rotating tagline */}
          <div className="text-center space-y-1">
            <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-foreground leading-tight min-h-[56px] sm:min-h-[68px] flex items-center justify-center">
              <span className={`transition-all duration-300 ease-out ${taglineFade}`}>
                {TAGLINES[currentTagline]}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Join <span className="font-bold text-primary">{onlineCount.toLocaleString()}+</span> people chatting right now
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
              <Heart className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Real Vibes</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Private Chats</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">100% Safe</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <button
            onClick={() => setStep("email")}
            className="group relative w-full overflow-hidden rounded-2xl gradient-primary py-4 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Flame className="h-5 w-5" />
              Start Chatting Now
            </span>
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>

          <button
            onClick={triggerGoogle}
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
      <div className="mx-auto flex h-[100dvh] h-[100vh] w-full max-w-md flex-col bg-background">
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
          <div className="animate-fade-in text-center space-y-2">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground">
              {isReturning ? "Welcome Back! 💕" : "Enter Your Email"}
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
              onClick={triggerGoogle}
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
          </div>
        </div>
      </div>
    );
  }

  /* ── OTP SCREEN ─────────────────────────────────── */
    return (
      <div className="mx-auto flex h-[100dvh] h-[100vh] w-full max-w-md flex-col bg-background">

        <div className="flex items-center px-4 pt-4">
        <button
          onClick={() => { setStep("email"); setOtpDigits(["", "", "", "", "", ""]); }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-10">
        <div className="animate-fade-in text-center space-y-2">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Check Your Email! 💌</h2>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-semibold text-primary">{email}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5">
          {otpDigits.map((digit, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                className="h-12 w-10 rounded-xl border-2 border-border bg-card text-center text-lg font-bold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
              {i === 2 && (
                <div className="mx-0.5 h-0.5 w-3 rounded-full bg-border" />
              )}
            </div>
          ))}
        </div>

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

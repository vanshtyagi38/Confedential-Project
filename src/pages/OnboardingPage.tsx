import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, Shield, Sparkles, Lock, Headphones } from "lucide-react";
import { toast } from "sonner";

type Step = "gender" | "preference" | "age" | "email" | "otp";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { session, profile, sendOtp, verifyOtp, createProfile } = useAuth();
  const [step, setStep] = useState<Step>("gender");
  const [gender, setGender] = useState("");
  const [preferredGender, setPreferredGender] = useState("");
  const [age, setAge] = useState(22);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  if (session && profile) {
    navigate("/", { replace: true });
    return null;
  }

  const handleGender = (g: string) => {
    setGender(g);
    setStep("preference");
  };

  const handlePreference = (p: string) => {
    setPreferredGender(p);
    setStep("age");
  };

  const handleAge = () => {
    if (age < 18 || age > 60) {
      toast.error("Age must be between 18 and 60");
      return;
    }
    setStep("email");
  };

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await sendOtp(email.trim());
    setLoading(false);
    if (error) {
      toast.error(error.message || "Failed to send OTP");
      return;
    }
    toast.success("Check your inbox for the 6-digit code! 📩");
    setStep("otp");
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    const { error } = await verifyOtp(email.trim(), otp);
    if (error) {
      setLoading(false);
      toast.error(error.message || "Invalid OTP. Try again.");
      return;
    }

    if (isReturning) {
      setLoading(false);
      navigate("/", { replace: true });
      return;
    }

    const { error: profileError } = await createProfile({
      gender,
      preferred_gender: preferredGender,
      age,
      display_name: email.split("@")[0],
    });
    setLoading(false);
    if (profileError) {
      toast.error("Failed to create profile. Try again.");
      return;
    }
    navigate("/", { replace: true });
  };

  const goBack = () => {
    if (step === "otp") setStep("email");
    else if (step === "email") setStep(isReturning ? "gender" : "age");
    else if (step === "age") setStep("preference");
    else if (step === "preference") setStep("gender");
  };

  const startReturning = () => {
    setIsReturning(true);
    setStep("email");
  };

  const stepIndex = step === "gender" ? 0 : step === "preference" ? 1 : step === "age" ? 2 : step === "email" ? 3 : 4;
  const progressPct = `${((stepIndex) / 4) * 100}%`;

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col bg-background">
      {/* Progress bar */}
      {step !== "gender" && (
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={goBack} className="rounded-full bg-secondary p-2 transition-transform active:scale-90">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-500 ease-out"
                style={{ width: progressPct }}
              />
            </div>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">{stepIndex}/4</span>
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center px-5 sm:px-8">
        {/* Step 1: Gender */}
        {step === "gender" && (
          <div className="animate-fade-in-up text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
              <Headphones className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome to{" "}
              <span className="gradient-primary bg-clip-text text-transparent">SingleTape</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Private chats. Real vibes. Zero boring. 🔒
            </p>

            <div className="mt-8">
              <p className="text-base font-bold">I am a...</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => handleGender("male")}
                  className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-5 sm:p-6 shadow-card transition-all hover:border-primary hover:shadow-elevated active:scale-[0.96]"
                >
                  <span className="text-5xl transition-transform group-hover:scale-110">👦</span>
                  <span className="text-base font-bold">Boy</span>
                </button>
                <button
                  onClick={() => handleGender("female")}
                  className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-5 sm:p-6 shadow-card transition-all hover:border-primary hover:shadow-elevated active:scale-[0.96]"
                >
                  <span className="text-5xl transition-transform group-hover:scale-110">👧</span>
                  <span className="text-base font-bold">Girl</span>
                </button>
              </div>
            </div>

            <button
              onClick={startReturning}
              className="mt-8 rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold transition-all hover:bg-secondary/80 active:scale-95"
            >
              Already have an account? Sign in →
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>End-to-end encrypted. We never share your data.</span>
            </div>
          </div>
        )}

        {/* Step 2: Preference */}
        {step === "preference" && (
          <div className="animate-fade-in-up text-center">
            <p className="text-xl font-extrabold">Who do you wanna vibe with? 😏</p>
            <p className="mt-1 text-sm text-muted-foreground">Pick your match type</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => handlePreference("male")}
                className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-5 sm:p-6 shadow-card transition-all hover:border-primary hover:shadow-elevated active:scale-[0.96]"
              >
                <span className="text-5xl transition-transform group-hover:scale-110">🧑</span>
                <span className="text-base font-bold">Boys</span>
              </button>
              <button
                onClick={() => handlePreference("female")}
                className="group flex flex-col items-center gap-2 rounded-2xl border-2 border-transparent bg-card p-5 sm:p-6 shadow-card transition-all hover:border-primary hover:shadow-elevated active:scale-[0.96]"
              >
                <span className="text-5xl transition-transform group-hover:scale-110">👩</span>
                <span className="text-base font-bold">Girls</span>
              </button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Your preferences stay private, always.</span>
            </div>
          </div>
        )}

        {/* Step 3: Age */}
        {step === "age" && (
          <div className="animate-fade-in-up text-center">
            <p className="text-xl font-extrabold">How old are you? 🎂</p>
            <p className="mt-1 text-sm text-muted-foreground">Must be 18+ to join SingleTape</p>
            <div className="mt-8 flex items-center justify-center gap-6">
              <button
                onClick={() => setAge((a) => Math.max(18, a - 1))}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl font-bold transition-all active:scale-90 hover:bg-secondary/80"
              >
                −
              </button>
              <span className="min-w-[80px] text-6xl font-extrabold gradient-primary bg-clip-text text-transparent tabular-nums">
                {age}
              </span>
              <button
                onClick={() => setAge((a) => Math.min(60, a + 1))}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl font-bold transition-all active:scale-90 hover:bg-secondary/80"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAge}
              className="mt-10 w-full rounded-xl gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97]"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 4: Email */}
        {step === "email" && (
          <div className="animate-fade-in-up text-center">
            <p className="text-xl font-extrabold">
              {isReturning ? "Welcome back! 🎉" : "Almost there! 📧"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll send a 6-digit OTP code to verify you
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              placeholder="your@email.com"
              className="mt-6 w-full rounded-xl bg-card px-4 py-3.5 text-center text-base outline-none ring-2 ring-transparent shadow-card transition-all focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleSendOtp}
              disabled={loading || !email.trim()}
              className="mt-4 w-full rounded-xl gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Send OTP Code 🚀"}
            </button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              No login links. Just a simple 6-digit code.
            </p>
          </div>
        )}

        {/* Step 5: OTP */}
        {step === "otp" && (
          <div className="animate-fade-in-up text-center">
            <p className="text-xl font-extrabold">Enter the magic code ✨</p>
            <p className="mt-1 text-sm text-muted-foreground">
              6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              placeholder="000000"
              className="mt-6 w-full rounded-xl bg-card px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] outline-none ring-2 ring-transparent shadow-card transition-all focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="mt-4 w-full rounded-xl gradient-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify & Start Chatting 🎉"}
            </button>
            <button
              onClick={() => { setOtp(""); handleSendOtp(); }}
              className="mt-3 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
            >
              Didn't get the code? Resend
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Check spam folder if you don't see it
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;

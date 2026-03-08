import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, Shield, Sparkles } from "lucide-react";
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

  // If already logged in with profile, go home
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
    toast.success("OTP sent to your email! 📩");
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

    // If returning user, profile already exists
    if (isReturning) {
      setLoading(false);
      navigate("/", { replace: true });
      return;
    }

    // Create profile for new user
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

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      {/* Header */}
      {step !== "gender" && (
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={goBack} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-secondary">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-500"
                style={{
                  width: step === "preference" ? "25%" : step === "age" ? "50%" : step === "email" ? "75%" : "100%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center px-6">
        {/* Step 1: Gender */}
        {step === "gender" && (
          <div className="animate-fade-in-up text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome to{" "}
              <span className="gradient-primary bg-clip-text text-transparent">SingleTape</span>
            </h1>
            <p className="mt-2 text-muted-foreground">Your chats are 100% private & encrypted 🔒</p>

            <p className="mt-8 text-lg font-bold">I am a...</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGender("male")}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-card p-6 shadow-card transition-all hover:border-primary active:scale-95"
              >
                <span className="text-5xl">👦</span>
                <span className="text-lg font-bold">Boy</span>
              </button>
              <button
                onClick={() => handleGender("female")}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-card p-6 shadow-card transition-all hover:border-primary active:scale-95"
              >
                <span className="text-5xl">👧</span>
                <span className="text-lg font-bold">Girl</span>
              </button>
            </div>

            <button
              onClick={startReturning}
              className="mt-8 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Already have an account? Sign in →
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Your data is safe. We never share your info.</span>
            </div>
          </div>
        )}

        {/* Step 2: Preference */}
        {step === "preference" && (
          <div className="animate-fade-in-up text-center">
            <p className="text-lg font-bold">Who do you wanna chat with? 😏</p>
            <p className="mt-1 text-sm text-muted-foreground">Pick your vibe</p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => handlePreference("male")}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-card p-6 shadow-card transition-all hover:border-primary active:scale-95"
              >
                <span className="text-5xl">🧑</span>
                <span className="text-lg font-bold">Boys</span>
              </button>
              <button
                onClick={() => handlePreference("female")}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-transparent bg-card p-6 shadow-card transition-all hover:border-primary active:scale-95"
              >
                <span className="text-5xl">👩</span>
                <span className="text-lg font-bold">Girls</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Age */}
        {step === "age" && (
          <div className="animate-fade-in-up text-center">
            <p className="text-lg font-bold">How old are you? 🎂</p>
            <p className="mt-1 text-sm text-muted-foreground">Must be 18+ to use BaatCheet</p>
            <div className="mt-8 flex items-center justify-center gap-6">
              <button
                onClick={() => setAge((a) => Math.max(18, a - 1))}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl font-bold transition-transform active:scale-90"
              >
                -
              </button>
              <span className="text-6xl font-extrabold gradient-primary bg-clip-text text-transparent">{age}</span>
              <button
                onClick={() => setAge((a) => Math.min(60, a + 1))}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-2xl font-bold transition-transform active:scale-90"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAge}
              className="mt-10 w-full rounded-xl gradient-primary py-3.5 text-base font-bold text-primary-foreground transition-transform active:scale-[0.97]"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 4: Email */}
        {step === "email" && (
          <div className="animate-fade-in-up text-center">
            <p className="text-lg font-bold">
              {isReturning ? "Welcome back! 🎉" : "Almost there! 📧"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll send a verification code to your email
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              placeholder="your@email.com"
              className="mt-6 w-full rounded-xl bg-card px-4 py-3.5 text-center text-base outline-none ring-2 ring-transparent transition-all focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleSendOtp}
              disabled={loading || !email.trim()}
              className="mt-4 w-full rounded-xl gradient-primary py-3.5 text-base font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Send OTP 🚀"}
            </button>
            <p className="mt-4 text-xs text-muted-foreground">
              🔒 We'll never spam you. Promise.
            </p>
          </div>
        )}

        {/* Step 5: OTP */}
        {step === "otp" && (
          <div className="animate-fade-in-up text-center">
            <p className="text-lg font-bold">Enter the magic code ✨</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sent to <span className="font-medium text-foreground">{email}</span>
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              placeholder="000000"
              className="mt-6 w-full rounded-xl bg-card px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] outline-none ring-2 ring-transparent transition-all focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="mt-4 w-full rounded-xl gradient-primary py-3.5 text-base font-bold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Verify & Go 🎉"}
            </button>
            <button
              onClick={() => { setOtp(""); handleSendOtp(); }}
              className="mt-3 text-sm font-medium text-primary"
            >
              Didn't get the code? Resend
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;

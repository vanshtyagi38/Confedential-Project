import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { session, profile, loading, createProfile, refreshProfile } = useAuth();
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (loading || hasHandledCallback.current) return;
    hasHandledCallback.current = true;

    const finalizeOAuthLogin = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const activeSession = session ?? sessionData.session;

      if (!activeSession) {
        toast.error("Sign-in failed. Please try again.");
        navigate("/onboarding", { replace: true });
        return;
      }

      if (!profile) {
        const email = activeSession.user.email ?? "";
        const { error } = await createProfile({
          gender: "male",
          preferred_gender: "female",
          age: 22,
          display_name: email.split("@")[0] || "User",
        });

        const errorMessage = String((error as { message?: string })?.message ?? error ?? "").toLowerCase();
        if (error && !errorMessage.includes("duplicate")) {
          toast.error("Couldn't complete sign-in. Please try again.");
          navigate("/onboarding", { replace: true });
          return;
        }
      }

      navigate("/dashboard", { replace: true });
    };

    finalizeOAuthLogin();
  }, [loading, session, profile, createProfile, navigate]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallbackPage;

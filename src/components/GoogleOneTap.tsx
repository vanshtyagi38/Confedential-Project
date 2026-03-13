import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleOneTap = () => {
  const { session, profile, createProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const initialized = useRef(false);

  useEffect(() => {
    // Don't show if already logged in
    if (session || !GOOGLE_CLIENT_ID) return;

    const loadScript = () => {
      if (document.getElementById("google-gsi-script")) return;
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initOneTap;
      document.head.appendChild(script);
    };

    const initOneTap = () => {
      if (initialized.current || !window.google) return;
      initialized.current = true;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
        context: "signin",
        itp_support: true,
      });

      // Show One Tap after a short delay for better UX
      setTimeout(() => {
        window.google?.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log("One Tap not displayed:", notification.getNotDisplayedReason());
          }
          if (notification.isSkippedMoment()) {
            console.log("One Tap skipped:", notification.getSkippedReason());
          }
        });
      }, 1500);
    };

    const handleCredentialResponse = async (response: any) => {
      if (!response.credential) {
        toast.error("Google sign-in failed");
        return;
      }

      try {
        toast.loading("Signing you in...", { id: "onetap" });

        // Send token to our edge function
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-onetap`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential }),
          }
        );

        const data = await resp.json();
        if (!resp.ok || !data.token_hash) {
          toast.error(data.error || "Sign-in failed", { id: "onetap" });
          return;
        }

        // Verify OTP with the token hash to create session
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (verifyErr) {
          toast.error("Session creation failed", { id: "onetap" });
          return;
        }

        // Create profile if new user
        if (data.is_new) {
          await createProfile({
            gender: "male",
            preferred_gender: "female",
            age: 22,
            display_name: data.name || data.email?.split("@")[0],
          });
        }

        await refreshProfile();
        toast.success("Welcome! 🔥", { id: "onetap" });
        navigate("/", { replace: true });
      } catch {
        toast.error("Something went wrong", { id: "onetap" });
      }
    };

    // Load GIS script
    if (window.google?.accounts) {
      initOneTap();
    } else {
      loadScript();
    }

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
      initialized.current = false;
    };
  }, [session]);

  return null; // This is a headless component
};

export default GoogleOneTap;

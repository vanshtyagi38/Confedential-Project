import { useEffect, useRef, useState } from "react";
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
    handleGoogleOneTap?: (response: any) => void;
  }
}

const GoogleOneTap = () => {
  const { session, createProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const initialized = useRef(false);
  const [clientId, setClientId] = useState<string | null>(null);

  // Fetch client ID from edge function
  useEffect(() => {
    if (session) return;
    const fetchClientId = async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-onetap`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "get_client_id" }),
          }
        );
        const data = await resp.json();
        if (data.client_id) setClientId(data.client_id);
      } catch {
        // silently fail
      }
    };
    fetchClientId();
  }, [session]);

  useEffect(() => {
    if (session || !clientId) return;

    const handleCredentialResponse = async (response: any) => {
      if (!response.credential) {
        toast.error("Google sign-in failed");
        return;
      }

      try {
        toast.loading("Signing you in...", { id: "onetap" });

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

        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: "magiclink",
        });

        if (verifyErr) {
          toast.error("Session creation failed", { id: "onetap" });
          return;
        }

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

    // Make callback globally available
    window.handleGoogleOneTap = handleCredentialResponse;

    const loadAndInit = () => {
      if (initialized.current) return;

      const initOneTap = () => {
        if (!window.google || initialized.current) return;
        initialized.current = true;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp: any) => window.handleGoogleOneTap?.(resp),
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          itp_support: true,
        });

        setTimeout(() => {
          window.google?.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed()) {
              console.log("One Tap not displayed:", notification.getNotDisplayedReason());
            }
          });
        }, 1500);
      };

      if (window.google?.accounts) {
        initOneTap();
      } else {
        if (!document.getElementById("google-gsi-script")) {
          const script = document.createElement("script");
          script.id = "google-gsi-script";
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = initOneTap;
          document.head.appendChild(script);
        }
      }
    };

    loadAndInit();

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
      initialized.current = false;
    };
  }, [session, clientId]);

  return null;
};

export default GoogleOneTap;

import { useEffect, useCallback } from "react";
import { resetAdminActivity, isAdminSessionExpired } from "@/lib/security";
import { toast } from "sonner";

export const useAdminSessionTimeout = (signOut: () => Promise<void>) => {
  const handleActivity = useCallback(() => {
    resetAdminActivity();
  }, []);

  useEffect(() => {
    // Track user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, handleActivity));

    // Check for timeout every 60 seconds
    const interval = setInterval(() => {
      if (isAdminSessionExpired()) {
        toast.error("Session expired due to inactivity");
        signOut();
      }
    }, 60_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearInterval(interval);
    };
  }, [handleActivity, signOut]);
};

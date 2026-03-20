import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

/**
 * Returns a function that checks if user is authenticated.
 * If not, redirects to onboarding and returns false.
 * If yes, returns true.
 */
export const useAuthGuard = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (!session || !profile) {
        navigate("/onboarding");
        return false;
      }
      callback?.();
      return true;
    },
    [session, profile, navigate]
  );

  const isAuthenticated = !!(session && profile);

  return { requireAuth, isAuthenticated };
};

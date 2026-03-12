import { supabase } from "@/integrations/supabase/client";

// Rate limiter for client-side actions
const clientRateLimits = new Map<string, { count: number; resetAt: number }>();

export const checkClientRateLimit = (action: string, maxAttempts: number, windowMs: number): boolean => {
  const now = Date.now();
  const entry = clientRateLimits.get(action);

  if (!entry || now > entry.resetAt) {
    clientRateLimits.set(action, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) return false;
  entry.count++;
  return true;
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Validate and sanitize display names
export const sanitizeName = (name: string): string => {
  return name.replace(/[<>{}()\[\]\\\/]/g, "").trim().slice(0, 50);
};

// Detect bot-like behavior
let actionTimestamps: number[] = [];
export const detectBotBehavior = (): boolean => {
  const now = Date.now();
  actionTimestamps.push(now);
  // Keep only last 10 actions
  actionTimestamps = actionTimestamps.slice(-10);

  if (actionTimestamps.length >= 10) {
    const timeDiff = actionTimestamps[9] - actionTimestamps[0];
    // 10 actions in under 2 seconds is suspicious
    if (timeDiff < 2000) return true;
  }
  return false;
};

// Admin session timeout (15 minutes of inactivity)
const ADMIN_TIMEOUT_MS = 15 * 60 * 1000;
let lastAdminActivity = Date.now();

export const resetAdminActivity = () => {
  lastAdminActivity = Date.now();
};

export const isAdminSessionExpired = (): boolean => {
  return Date.now() - lastAdminActivity > ADMIN_TIMEOUT_MS;
};

// Log security event
export const logSecurityEvent = async (
  eventType: string,
  details: Record<string, any>,
  severity: "info" | "warning" | "critical" = "info"
) => {
  try {
    await (supabase as any).from("security_events").insert({
      event_type: eventType,
      details,
      severity,
      ip_address: "client",
    });
  } catch {
    // Silent fail - don't break app for security logging
  }
};

// Fingerprint for bot detection (simplified)
export const getDeviceFingerprint = (): string => {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  return btoa(parts.join("|")).slice(0, 32);
};

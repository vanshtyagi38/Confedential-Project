import { FunctionsHttpError } from "@supabase/supabase-js";

export async function paymentErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return body.error || body.details || fallback;
    } catch { return fallback; }
  }
  return error instanceof Error ? error.message : fallback;
}

export function loadRazorpayScript(): Promise<boolean> {
  if ((window as Window & { Razorpay?: unknown }).Razorpay) return Promise.resolve(true);
  return new Promise(resolve => {
    let script = document.getElementById("razorpay-script") as HTMLScriptElement | null;
    const finish = (ok: boolean) => { clearTimeout(timer); if (!ok) script?.remove(); resolve(ok); };
    const timer = window.setTimeout(() => finish(false), 15000);
    if (!script) {
      script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.addEventListener("load", () => finish(true), { once: true });
      script.addEventListener("error", () => finish(false), { once: true });
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", () => finish(true), { once: true });
      script.addEventListener("error", () => finish(false), { once: true });
    }
  });
}
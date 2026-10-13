import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

export { z };
export class PaymentError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function secret(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new PaymentError(503, `${name.replace(/_/g, " ")} is not configured`);
  return value;
}
export const adminClient = () => createClient(secret("SUPABASE_URL"), secret("SUPABASE_SERVICE_ROLE_KEY"));
export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
export function endpoint(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try { return await handler(req); }
    catch (error) {
      const status = error instanceof PaymentError ? error.status : error instanceof z.ZodError || error instanceof SyntaxError ? 400 : 500;
      const details = error instanceof Error ? error.message : "Payment processing failed";
      console.error(`Recharge failed [${status}]: ${details}`);
      return json({ error: details, status }, status);
    }
  };
}
export async function userId(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new PaymentError(401, "Please sign in to recharge");
  const client = createClient(secret("SUPABASE_URL"), secret("SUPABASE_ANON_KEY"));
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new PaymentError(401, "Please sign in again to recharge");
  return data.user.id;
}
export async function activePlan(planId: string, provider: "razorpay" | "phonepe") {
  const client = adminClient();
  const { data: settings, error: settingsError } = await client.from("payment_gateway_settings").select("razorpay_enabled,phonepe_enabled").eq("id", "default").single();
  if (settingsError) throw new PaymentError(503, "Payment settings unavailable");
  if (!settings?.[`${provider}_enabled`]) throw new PaymentError(409, "This payment method is currently unavailable");
  const { data, error } = await client.from("recharge_packages").select("plan_id,price,minutes,bonus,label").eq("plan_id", planId).eq("is_active", true).single();
  if (error || !data) throw new PaymentError(400, "Selected recharge plan is no longer available");
  const amount = Math.round(Number(data.price) * 100);
  const minutes = Number(data.minutes) + Number(data.bonus || 0);
  if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isFinite(minutes) || minutes <= 0) throw new PaymentError(400, "Invalid recharge plan");
  return { ...data, amount, totalMinutes: minutes };
}
export async function providerJson(response: Response) {
  const text = await response.text();
  if (!response.ok) throw new PaymentError(response.status, `Payment provider [${response.status}]: ${text}`);
  try { return JSON.parse(text); } catch { throw new PaymentError(502, "Payment provider returned an invalid response"); }
}
export async function saveOrder(provider: string, orderId: string, owner: string, plan: { plan_id: string; amount: number; totalMinutes: number }) {
  const { error } = await adminClient().from("recharge_orders").insert({ provider, provider_order_id: orderId, user_id: owner, plan_id: plan.plan_id, amount_paise: plan.amount, minutes: plan.totalMinutes });
  if (error) throw new PaymentError(500, "Unable to save recharge order. No payment should be attempted.");
}
export async function findOrder(provider: string, orderId: string, owner?: string) {
  let query = adminClient().from("recharge_orders").select("*").eq("provider", provider).eq("provider_order_id", orderId);
  if (owner) query = query.eq("user_id", owner);
  const { data, error } = await query.single();
  if (error || !data) throw new PaymentError(404, "Recharge order not found");
  return data;
}
export async function creditOrder(provider: string, orderId: string, paymentId: string, amount: number) {
  const { data, error } = await adminClient().rpc("credit_verified_recharge", { p_provider: provider, p_order_id: orderId, p_payment_id: paymentId, p_amount_paise: amount });
  if (error) throw new PaymentError(500, `Unable to credit recharge: ${error.message}`);
  return data;
}
export const orderIdSchema = z.string().min(3).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export async function razorpay(path: string, init: RequestInit = {}) {
  return providerJson(await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `Basic ${btoa(`${secret("RAZORPAY_KEY_ID")}:${secret("RAZORPAY_KEY_SECRET")}`)}` } }));
}
const PHONEPE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
export async function phonepe(path: string, init: RequestInit = {}) {
  const token = await providerJson(await fetch(`${PHONEPE_URL}/v1/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: secret("PHONEPE_CLIENT_ID"), client_secret: secret("PHONEPE_CLIENT_SECRET"), client_version: "1", grant_type: "client_credentials" }) }));
  if (!token.access_token) throw new PaymentError(502, "PhonePe authorization failed");
  return providerJson(await fetch(`${PHONEPE_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${token.access_token}` } }));
}
export async function settlePhonePe(orderId: string, owner?: string) {
  const order = await findOrder("phonepe", orderId, owner);
  const result = await phonepe(`/checkout/v2/order/${encodeURIComponent(orderId)}/status`);
  const state = result.state || result.data?.state;
  if (state !== "COMPLETED") return { success: false, state: state || "PENDING" };
  const amount = Number(result.amount ?? result.data?.amount);
  if (amount !== Number(order.amount_paise)) throw new PaymentError(400, "Payment amount does not match recharge order");
  return { ...(await creditOrder("phonepe", orderId, orderId, amount)), state };
}
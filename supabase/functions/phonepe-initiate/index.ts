import { endpoint, json, userId, z, activePlan, phonepe, saveOrder, PaymentError } from "../_shared/recharge.ts";
Deno.serve(endpoint(async (req) => {
 const owner = await userId(req);
 const { planId, redirectUrl } = z.object({ planId: z.string().min(1).max(100), redirectUrl: z.string().url().max(2048) }).parse(await req.json());
 const url = new URL(redirectUrl);
 const origin = req.headers.get("Origin");
 if (url.origin !== origin || (url.protocol !== "https:" && url.hostname !== "localhost")) throw new PaymentError(400, "Invalid payment return address");
 const plan = await activePlan(planId,"phonepe");
 const orderId = `ST_${crypto.randomUUID().replace(/-/g, "").slice(0, 30)}`;
 await saveOrder("phonepe", orderId, owner, plan);
 url.pathname = "/recharge"; url.search = ""; url.searchParams.set("orderId",orderId); url.searchParams.set("provider","phonepe");
 const result = await phonepe("/checkout/v2/pay", { method: "POST", body: JSON.stringify({ merchantOrderId: orderId, amount: plan.amount, expireAfter: 1200, paymentFlow: { type: "PG_CHECKOUT", merchantUrls: { redirectUrl: url.toString() } } }) });
 const target = result.redirectUrl || result.data?.redirectUrl;
 if (!target) throw new PaymentError(502,"PhonePe did not provide a checkout address");
 return json({ redirectUrl: target, orderId });
}));

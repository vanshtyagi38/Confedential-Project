import { endpoint, json, userId, z, activePlan, razorpay, saveOrder, secret } from "../_shared/recharge.ts";
Deno.serve(endpoint(async (req) => {
 const owner = await userId(req);
 const { planId } = z.object({ planId: z.string().min(1).max(100) }).parse(await req.json());
 const plan = await activePlan(planId, "razorpay");
 const order = await razorpay("/orders", { method: "POST", body: JSON.stringify({ amount: plan.amount, currency: "INR", receipt: `rcpt_${owner.slice(0,8)}_${Date.now()}`, notes: { user_id: owner, plan_id: planId } }) });
 await saveOrder("razorpay", order.id, owner, plan);
 return json({ order_id: order.id, amount: order.amount, currency: order.currency, key_id: secret("RAZORPAY_KEY_ID"), minutes: plan.totalMinutes });
}));

import { endpoint, json, z, orderIdSchema, settlePhonePe } from "../_shared/recharge.ts";
Deno.serve(endpoint(async (req) => {
 const raw = z.object({ response: z.string().max(20000).optional() }).passthrough().parse(await req.json());
 const body = raw.response ? JSON.parse(atob(raw.response)) : raw;
 const orderId = orderIdSchema.parse(body.merchantOrderId || body.payload?.merchantOrderId || body.data?.merchantOrderId);
 // Callback fields never authorize credit: only the provider's authenticated status does.
 return json(await settlePhonePe(orderId));
}));

import { endpoint, json, z, orderIdSchema, settlePhonePe } from "../_shared/recharge.ts";
Deno.serve(endpoint(async (req) => {
 const body = await req.json();
 const orderId = orderIdSchema.parse(body.merchantOrderId || body.payload?.merchantOrderId || body.data?.merchantOrderId);
 // Callback fields never authorize credit: only the provider's authenticated status does.
 return json(await settlePhonePe(orderId));
}));

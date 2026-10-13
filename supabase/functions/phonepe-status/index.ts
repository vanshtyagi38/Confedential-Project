import { endpoint, json, userId, z, orderIdSchema, settlePhonePe } from "../_shared/recharge.ts";
Deno.serve(endpoint(async (req) => {
 const owner = await userId(req);
 const { orderId } = z.object({ orderId: orderIdSchema }).parse(await req.json());
 return json(await settlePhonePe(orderId,owner));
}));

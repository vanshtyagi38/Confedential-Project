import { endpoint, json, userId, z, findOrder, razorpay, creditOrder, secret, PaymentError, orderIdSchema } from "../_shared/recharge.ts";
Deno.serve(endpoint(async (req) => {
 const owner = await userId(req);
 const body = z.object({ razorpay_order_id: orderIdSchema, razorpay_payment_id: orderIdSchema, razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/) }).parse(await req.json());
 const order = await findOrder("razorpay", body.razorpay_order_id, owner);
 const encoder = new TextEncoder();
 const key = await crypto.subtle.importKey("raw", encoder.encode(secret("RAZORPAY_KEY_SECRET")), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
 const signature = Uint8Array.from(body.razorpay_signature.match(/.{2}/g) || [], s => parseInt(s,16));
 if (!await crypto.subtle.verify("HMAC", key, signature, encoder.encode(`${body.razorpay_order_id}|${body.razorpay_payment_id}`))) throw new PaymentError(400, "Payment signature verification failed");
 let payment = await razorpay(`/payments/${body.razorpay_payment_id}`);
 if (payment.order_id !== order.provider_order_id || Number(payment.amount) !== Number(order.amount_paise) || payment.currency !== "INR") throw new PaymentError(400, "Payment does not match recharge order");
 if (payment.status === "authorized") payment = await razorpay(`/payments/${body.razorpay_payment_id}/capture`, { method: "POST", body: JSON.stringify({ amount: order.amount_paise, currency: "INR" }) });
 if (payment.status !== "captured") throw new PaymentError(409, "Payment has not completed. Please check again shortly.");
 return json(await creditOrder("razorpay", order.provider_order_id, body.razorpay_payment_id, Number(payment.amount)));
}));

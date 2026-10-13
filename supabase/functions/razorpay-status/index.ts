import { endpoint, json, userId, z, orderIdSchema, findOrder, razorpay, creditOrder, PaymentError } from "../_shared/recharge.ts";
Deno.serve(endpoint(async (req) => {
  const owner = await userId(req);
  const { orderId } = z.object({ orderId: orderIdSchema }).parse(await req.json());
  const order = await findOrder("razorpay", orderId, owner);
  const result = await razorpay(`/orders/${orderId}/payments`);
  const payment = result.items?.find((p: { status: string }) => p.status === "captured");
  if (!payment) return json({ success: false, state: "PENDING" });
  if (payment.order_id !== orderId || payment.currency !== "INR" || Number(payment.amount) !== Number(order.amount_paise)) throw new PaymentError(400, "Payment does not match recharge order");
  return json(await creditOrder("razorpay", orderId, payment.id, Number(payment.amount)));
}));
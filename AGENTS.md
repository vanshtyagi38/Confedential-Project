# Project rules

- Discovery recharge offers must read active recharge packages instead of inventing prices or bonuses, so admin changes remain authoritative.
- Recharge entry offers keep signup and payment authorization in existing flows; presentation changes must not refactor authentication, billing, chat, or admin logic.
- Show package links with a plan query parameter and resolve it only against active packages, so a selected offer matches the recharge screen.
- Keep recharge authorization on existing Razorpay/PhonePe endpoints; snapshot server-resolved active plans in recharge_orders and use the service-only credit_verified_recharge function after provider verification so credits are atomic and idempotent.
- Treat payment return parameters as untrusted; verify stored, user-owned orders and offer payment-status recovery before claiming success so redirects cannot manufacture credits.
- Grant paid reels access from server-recorded credited recharge orders rather than client flags so successful recharge unlocks the presented benefit.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("verified recharge credit", () => {
  it("adds package minutes once, rejects mismatches, and rolls back failed credits", async () => {
    const db = new PGlite();
    try {
      await db.exec(`
        CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
        CREATE SCHEMA auth;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
        CREATE TABLE public.user_profiles(user_id uuid PRIMARY KEY,balance_minutes numeric);
        CREATE TABLE public.wallet_transactions(id uuid DEFAULT gen_random_uuid(),user_id uuid,type text,minutes numeric,amount numeric,description text);
      `);
      await db.exec(readFileSync("drizzle/migrations/0000_verified_recharge_orders.sql", "utf8"));
      const user = "00000000-0000-0000-0000-000000000001";
      await db.query("INSERT INTO user_profiles VALUES($1,0.5)", [user]);
      await db.query("INSERT INTO recharge_orders(user_id,provider,provider_order_id,plan_id,amount_paise,minutes) VALUES($1,'razorpay','order_test','60min',24900,65)", [user]);
      await expect(db.query("SELECT credit_verified_recharge('razorpay','order_test','pay_test',100)")).rejects.toThrow("Payment details do not match");
      const first = await db.query<{ result: { new_balance: number; already_credited: boolean } }>("SELECT credit_verified_recharge('razorpay','order_test','pay_test',24900) AS result");
      expect(first.rows[0].result.new_balance).toBe(65.5);
      const retry = await db.query<{ result: { already_credited: boolean } }>("SELECT credit_verified_recharge('razorpay','order_test','pay_test',24900) AS result");
      expect(retry.rows[0].result.already_credited).toBe(true);
      expect((await db.query<{ count: number }>("SELECT count(*)::int AS count FROM wallet_transactions")).rows[0].count).toBe(1);
      await expect(db.query("SELECT credit_verified_recharge('razorpay','order_test','pay_other',24900)")).rejects.toThrow("Payment does not match credited order");
      await db.query("INSERT INTO recharge_orders(user_id,provider,provider_order_id,plan_id,amount_paise,minutes) VALUES($1,'razorpay','order_duplicate','60min',24900,65)", [user]);
      await expect(db.query("SELECT credit_verified_recharge('razorpay','order_duplicate','pay_test',24900)")).rejects.toThrow();
      const balance = await db.query<{ balance_minutes: string }>("SELECT balance_minutes FROM user_profiles");
      expect(Number(balance.rows[0].balance_minutes)).toBe(65.5);
      const role = await db.query<{ allowed: boolean }>("SELECT has_function_privilege('authenticated','credit_verified_recharge(text,text,text,bigint)','EXECUTE') AS allowed");
      expect(role.rows[0].allowed).toBe(false);
    } finally { await db.close(); }
  }, 30000);
});
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestUrl } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const rechargeSchema = z.object({
  amount: z
    .number({ message: "Enter a valid amount" })
    .int("Amount must be a whole number")
    .min(10, "Minimum recharge is ₹10")
    .max(100000, "Maximum recharge is ₹1,00,000"),
});

const PAYTM_CREATE_URL = "https://www.mypancard.in/paytm/create";

function resolveOrigin(): string {
  const fromHeader = getRequestHeader("origin");
  if (fromHeader) return fromHeader.replace(/\/$/, "");
  try {
    return new URL(getRequestUrl()).origin;
  } catch {
    return "https://sevakart.lovable.app";
  }
}

/**
 * Creates a Paytm wallet-recharge order via the mypancard.in payment API and
 * returns a payment URL to redirect the customer to. The API key is read
 * server-side and never exposed to the browser. The wallet is credited only
 * later by the verified /api/public/paytm-return callback.
 */
export const createRechargeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rechargeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase, claims } = context;
    const amount = Math.round(data.amount);

    const { data: profile } = await supabase
      .from("profiles")
      .select("status, full_name, phone")
      .eq("id", userId)
      .single();
    if (profile?.status !== "active") {
      throw new Error("Your account is suspended. Contact your administrator.");
    }

    const apiKey = process.env.APIZONE_API_KEY;
    if (!apiKey) {
      throw new Error("Payment gateway is not configured. Please contact support.");
    }

    const orderId =
      "SKR" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const origin = resolveOrigin();
    const redirectUrl = `${origin}/api/public/paytm-return?order_id=${encodeURIComponent(orderId)}`;

    const customerName = (profile?.full_name || "Sevakart User").slice(0, 80);
    const customerMobile = (profile?.phone || "0000000000").replace(/\D/g, "").slice(-10) || "0000000000";
    const customerEmail = ((claims as any)?.email as string) || "user@sevakart.in";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Record the pending order before contacting the gateway
    const { error: insertErr } = await supabaseAdmin.from("payment_orders").insert({
      user_id: userId,
      order_id: orderId,
      amount,
      status: "pending",
      provider: "paytm",
    });
    if (insertErr) {
      console.error("[RECHARGE] failed to record order:", insertErr.message);
      throw new Error("Could not start the recharge. Please try again.");
    }

    let paymentUrl = "";
    try {
      const body = new URLSearchParams({
        api_key: apiKey,
        txn_amount: String(amount),
        order_id: orderId,
        redirectUrl,
        customer_name: customerName,
        customer_mobile: customerMobile,
        customer_email: customerEmail,
      });

      console.log("[RECHARGE] create order →", `order_id=${orderId} amount=${amount} redirect=${redirectUrl}`);
      const res = await fetch(PAYTM_CREATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json, text/plain, */*",
        },
        body: body.toString(),
      });

      const raw = (await res.text()).trim();
      console.log("[RECHARGE] gateway response ←", `status=${res.status} body=${raw.slice(0, 500)}`);

      let json: any = null;
      try {
        json = JSON.parse(raw);
      } catch {
        /* not JSON */
      }

      if (!res.ok) {
        await supabaseAdmin
          .from("payment_orders")
          .update({ status: "failed", provider_response: json ?? { raw } })
          .eq("order_id", orderId);
        throw new Error(`Payment gateway error (HTTP ${res.status}). ${raw.slice(0, 160)}`);
      }

      // Find a payment URL in whatever shape the gateway returned
      if (json && typeof json === "object") {
        paymentUrl = String(
          json.payment_url ||
            json.paymentUrl ||
            json.url ||
            json.redirect ||
            json.redirect_url ||
            json.link ||
            json.data?.payment_url ||
            json.data?.url ||
            json.data?.redirect ||
            "",
        ).trim();
      } else if (/^https?:\/\//i.test(raw)) {
        paymentUrl = raw;
      }

      await supabaseAdmin
        .from("payment_orders")
        .update({ provider_response: json ?? { raw } })
        .eq("order_id", orderId);

      if (!paymentUrl) {
        const msg = String(json?.message || json?.error || raw || "No payment URL returned by gateway");
        await supabaseAdmin.from("payment_orders").update({ status: "failed" }).eq("order_id", orderId);
        throw new Error(msg.slice(0, 200));
      }
    } catch (e: any) {
      const raw = e?.message || "Network error while contacting the payment gateway.";
      console.error("[RECHARGE] failure:", raw);
      throw new Error(raw);
    }

    console.log("[RECHARGE] order ready", `order_id=${orderId} paymentUrl=${paymentUrl.slice(0, 80)}`);
    return { orderId, amount, paymentUrl };
  });

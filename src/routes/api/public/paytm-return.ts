import { createFileRoute } from "@tanstack/react-router";

/**
 * Public Paytm return/callback endpoint (no auth — the payment gateway
 * redirects the customer's browser here after payment).
 *
 * Security: we credit only the amount stored on OUR order record, and only
 * once (idempotent via the `credited` flag). We never trust an amount sent in
 * the callback. The order_id is carried in our redirectUrl query string.
 */
function collectParams(url: URL, body: Record<string, string>) {
  const params: Record<string, string> = { ...body };
  url.searchParams.forEach((v, k) => {
    if (params[k] === undefined) params[k] = v;
  });
  return params;
}

async function readBody(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      return (await request.json()) as Record<string, string>;
    }
    if (ct.includes("form")) {
      const form = await request.formData();
      const out: Record<string, string> = {};
      form.forEach((v, k) => (out[k] = String(v)));
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function isSuccess(params: Record<string, string>): boolean {
  const candidates = [
    params.status,
    params.STATUS,
    params.txn_status,
    params.payment_status,
    params.result,
    params.state,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  if (candidates.length === 0) return false;
  return candidates.some(
    (s) => s.includes("success") || s === "txn_success" || s === "1" || s === "true" || s === "completed" || s === "paid",
  );
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const body = request.method === "POST" ? await readBody(request) : {};
  const params = collectParams(url, body);
  const orderId = params.order_id || params.orderId || params.ORDERID || "";

  console.log("[PAYTM-RETURN] callback", `method=${request.method} order_id=${orderId} params=${JSON.stringify(params).slice(0, 500)}`);

  const base = `${url.origin}/recharge`;
  const fail = (reason: string) => {
    console.warn("[PAYTM-RETURN] redirect failed:", reason);
    return Response.redirect(`${base}?recharge=failed&order_id=${encodeURIComponent(orderId)}`, 302);
  };

  if (!orderId) return fail("missing order_id");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order, error } = await supabaseAdmin
    .from("payment_orders")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error || !order) return fail("order not found");

  const providerTxnId =
    params.txn_id || params.TXNID || params.txnid || params.transaction_id || params.payment_id || null;

  // Already credited → idempotent success
  if (order.credited) {
    return Response.redirect(`${base}?recharge=success&order_id=${encodeURIComponent(orderId)}`, 302);
  }

  if (!isSuccess(params)) {
    await supabaseAdmin
      .from("payment_orders")
      .update({ status: "failed", provider_txn_id: providerTxnId, provider_response: params })
      .eq("order_id", orderId);
    return fail("gateway reported non-success");
  }

  // Success — credit the wallet exactly once for the stored amount
  const { error: creditErr } = await supabaseAdmin.rpc("admin_adjust_wallet", {
    p_user_id: order.user_id,
    p_amount: Number(order.amount),
    p_description: `Wallet recharge (Paytm) · ${orderId}`,
  });

  if (creditErr) {
    console.error("[PAYTM-RETURN] credit failed:", creditErr.message);
    await supabaseAdmin
      .from("payment_orders")
      .update({ status: "failed", provider_txn_id: providerTxnId, provider_response: params })
      .eq("order_id", orderId);
    return fail("wallet credit failed");
  }

  await supabaseAdmin
    .from("payment_orders")
    .update({
      status: "success",
      credited: true,
      provider_txn_id: providerTxnId,
      provider_response: params,
    })
    .eq("order_id", orderId);

  console.log("[PAYTM-RETURN] credited", `order_id=${orderId} amount=${order.amount}`);
  return Response.redirect(`${base}?recharge=success&order_id=${encodeURIComponent(orderId)}`, 302);
}

export const Route = createFileRoute("/api/public/paytm-return")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

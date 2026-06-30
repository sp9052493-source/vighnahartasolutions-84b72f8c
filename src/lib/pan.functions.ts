import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const panSchema = z.object({
  aadhaar_no: z
    .string()
    .trim()
    .regex(/^\d{12}$/, "Aadhaar number must be exactly 12 digits"),
});

const panDetailsSchema = z.object({
  pan_no: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN format (e.g. ABCDE1234F)"),
});

/**
 * Securely proxies the APIZONE Aadhaar → PAN finder API.
 * The API key is read server-side from process.env.APIZONE_API_KEY and is
 * never exposed to the browser. Returns the discovered PAN details.
 */
export const findPanFromAadhaar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => panSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const aadhaar = data.aadhaar_no.replace(/\D/g, "");

    // Account must be active
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    if (profile?.status !== "active") {
      throw new Error("Your account is suspended. Contact your administrator.");
    }

    // Resolve the Aadhaar → PAN service
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("id, code, name, price, active")
      .eq("code", "A2P")
      .single();
    if (svcErr || !service || !service.active) {
      throw new Error("Aadhaar to PAN service is currently unavailable.");
    }

    // Pre-check wallet balance so we never spend an API credit we can't bill
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();
    if (Number(wallet?.balance ?? 0) < Number(service.price)) {
      throw new Error("Insufficient wallet balance. Please top up to continue.");
    }

    const apiKey = process.env.APIZONE_API_KEY;
    if (!apiKey) {
      throw new Error("Aadhaar to PAN service is not configured. Please contact support.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    async function logFailure(message: string) {
      await supabaseAdmin.from("document_requests").insert({
        user_id: userId,
        service_id: service!.id,
        service_name: service!.name,
        input_value: aadhaar,
        status: "failed",
        cost: 0,
        error_message: message.slice(0, 500),
      });
    }

    // Call the APIZONE Aadhaar → PAN finder API
    let panNumber = "";
    let holderName = "";
    let providerMessage = "";
    try {
      const url = new URL("https://www.apizone.info/api/find_pan/aadhaar_to_pan.php");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("aadhaar_no", aadhaar);

      console.log("[PAN] API request →", `aadhaar=****${aadhaar.slice(-4)}`);
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json, text/plain, */*" },
      });

      const text = (await res.text()).trim();
      console.log("[PAN] API response ←", `status=${res.status} bytes=${text.length}`);

      if (!res.ok) {
        throw new Error(`PROVIDER_${res.status}`);
      }

      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        /* not JSON */
      }

      if (json && typeof json === "object") {
        panNumber = String(
          json.pan_no || json.pan || json.pan_number || json.data?.pan_no || json.data?.pan || "",
        ).trim();
        holderName = String(json.name || json.full_name || json.data?.name || "").trim();
        providerMessage = String(json.message || json.status || "").trim();
        const statusOk =
          String(json.status ?? "").includes("200") || /success/i.test(String(json.message ?? ""));

        if (!panNumber) {
          const lower = providerMessage.toLowerCase();
          console.warn("[PAN] provider error JSON:", providerMessage);
          if (lower.includes("not found") || lower.includes("no record") || lower.includes("no pan")) {
            throw new Error("PAN_NOT_FOUND");
          }
          if (lower.includes("invalid")) throw new Error("INVALID_AADHAAR");
          throw new Error(providerMessage || "PAN_NOT_FOUND");
        }
        console.log("[PAN] decoded PAN:", `len=${panNumber.length} statusOk=${statusOk}`);
      } else {
        const lower = text.toLowerCase();
        console.warn("[PAN] provider error text:", text.slice(0, 200));
        if (lower.includes("not found") || lower.includes("no record")) throw new Error("PAN_NOT_FOUND");
        if (lower.includes("invalid")) throw new Error("INVALID_AADHAAR");
        throw new Error(text.slice(0, 200) || "Provider returned an unexpected response.");
      }
    } catch (e: any) {
      const raw = e?.message || "Network error while contacting the PAN provider.";
      let friendly = raw;
      if (raw === "PAN_NOT_FOUND") friendly = "No PAN found linked to this Aadhaar number.";
      else if (raw === "INVALID_AADHAAR") friendly = "Invalid Aadhaar number. Please check and retry.";
      else if (raw.startsWith("PROVIDER_"))
        friendly = "PAN provider is temporarily unavailable. Please try again.";
      else if (/fetch|network|timeout|ENOTFOUND|ECONN/i.test(raw))
        friendly = "Network error. Please check your connection and try again.";
      console.error("[PAN] failure:", friendly);
      await logFailure(friendly);
      throw new Error(friendly);
    }

    // Charge the wallet + log the successful request atomically
    const result = {
      reference: "PAN" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      fetched_at: new Date().toISOString(),
      mode: "LIVE",
      provider: "apizone",
      document: "PAN_LOOKUP",
      fields: {
        "Aadhaar Number": `XXXX XXXX ${aadhaar.slice(-4)}`,
        "PAN Number": panNumber,
        ...(holderName ? { "Holder Name": holderName } : {}),
      },
    };

    const { data: req, error } = await supabaseAdmin.rpc("complete_document_request", {
      p_user_id: userId,
      p_service_id: service.id,
      p_input: aadhaar,
      p_result: result,
      p_doc_url: "",
    });

    if (error) {
      if (error.message.includes("INSUFFICIENT_BALANCE")) {
        await logFailure("Insufficient wallet balance.");
        throw new Error("Insufficient wallet balance. Please top up to continue.");
      }
      await logFailure(error.message);
      throw new Error(error.message);
    }

    console.log("[PAN] success: charged & logged", `ref=${result.reference}`);
    return {
      request: req,
      panNumber,
      holderName,
      message: providerMessage || "PAN found successfully.",
      reference: result.reference,
    };
  });
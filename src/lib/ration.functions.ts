import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const rationSchema = z.object({
  rationno: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Enter a valid ration card number")
    .max(25, "Ration card number is too long")
    .regex(/^[A-Z0-9-/]+$/, "Only letters, numbers, dashes and slashes are allowed"),
  card_type: z.enum(["1", "2"]).default("1"),
});

const PDF_MAGIC = "%PDF";
const BASE64_PDF_PREFIX = "JVBER"; // base64 of "%PDF"

/**
 * Securely proxies the APIZONE Ration Card Print API.
 * The API key is read server-side from process.env.APIZONE_API_KEY and is
 * never exposed to the browser. Returns the generated PDF as a base64 string.
 */
export const processRationPrint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rationSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const rationno = data.rationno.trim().toUpperCase();

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    if (profile?.status !== "active") {
      throw new Error("Your account is suspended. Contact your administrator.");
    }

    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("id, code, name, price, active")
      .eq("code", "RATION")
      .single();
    if (svcErr || !service || !service.active) {
      throw new Error("Ration Card Print service is currently unavailable.");
    }

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
      throw new Error("Ration Print service is not configured. Please contact support.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    async function logFailure(message: string) {
      await supabaseAdmin.from("document_requests").insert({
        user_id: userId,
        service_id: service!.id,
        service_name: service!.name,
        input_value: data.rationno,
        status: "failed",
        cost: 0,
        error_message: message.slice(0, 500),
      });
    }

    let pdfBase64: string;
    let providerName = "";
    try {
      const url = new URL("https://www.apizone.info/api/ration_pdf/ration.php");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("rationno", rationno);
      url.searchParams.set("card_type", data.card_type);

      console.log("[RATION] API request →", `rationno=${rationno} card_type=${data.card_type}`);
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/pdf, application/json, */*" },
      });

      if (!res.ok) throw new Error(`PROVIDER_${res.status}`);

      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "";
      const head = buf.subarray(0, 8).toString("latin1");
      console.log(
        "[RATION] API response ←",
        `status=${res.status} content-type=${contentType} bytes=${buf.length} head=${JSON.stringify(head)}`,
      );

      if (head.startsWith(PDF_MAGIC)) {
        pdfBase64 = buf.toString("base64");
        console.log("[RATION] decoded: raw PDF bytes");
      } else {
        const text = buf.toString("utf8").trim();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          /* not JSON */
        }

        if (json && typeof json === "object") {
          const rawPdf =
            json.pdf || json.pdf_base64 || json.base64 || json.data?.pdf || json.data?.base64 || json.data;
          if (typeof rawPdf === "string" && rawPdf.replace(/\s+/g, "").startsWith(BASE64_PDF_PREFIX)) {
            pdfBase64 = rawPdf.replace(/\s+/g, "");
            providerName = String(json.name ?? "");
            console.log("[RATION] decoded: JSON base64 PDF", `base64Length=${pdfBase64.length}`);
          } else {
            const msg = String(json.message || json.error || json.status || "Unexpected provider response");
            const lower = msg.toLowerCase();
            console.warn("[RATION] provider error JSON:", JSON.stringify(json).slice(0, 300));
            if (lower.includes("not found") || lower.includes("no record")) throw new Error("RATION_NOT_FOUND");
            if (lower.includes("invalid")) throw new Error("INVALID_RATION");
            throw new Error(msg);
          }
        } else if (text.startsWith(BASE64_PDF_PREFIX)) {
          pdfBase64 = text.replace(/\s+/g, "");
          console.log("[RATION] decoded: plain base64 PDF body", `base64Length=${pdfBase64.length}`);
        } else {
          const providerMsg = text.slice(0, 200);
          const lower = providerMsg.toLowerCase();
          console.warn("[RATION] provider error text:", providerMsg);
          if (lower.includes("not found") || lower.includes("no record")) throw new Error("RATION_NOT_FOUND");
          if (lower.includes("invalid")) throw new Error("INVALID_RATION");
          throw new Error(providerMsg || "Provider returned an unexpected response.");
        }
      }

      const decodedHead = Buffer.from(pdfBase64.slice(0, 16), "base64").toString("latin1");
      if (!decodedHead.startsWith(PDF_MAGIC)) {
        console.error("[RATION] decoded data is not a PDF, head=", JSON.stringify(decodedHead));
        throw new Error("Provider returned invalid PDF data.");
      }
    } catch (e: any) {
      const raw = e?.message || "Network error while contacting Ration provider.";
      let friendly = raw;
      if (raw === "RATION_NOT_FOUND") friendly = "No record found for this ration card number.";
      else if (raw === "INVALID_RATION") friendly = "Invalid ration card number. Please check and retry.";
      else if (raw.startsWith("PROVIDER_"))
        friendly = "Ration provider is temporarily unavailable. Please try again.";
      else if (/fetch|network|timeout|ENOTFOUND|ECONN/i.test(raw))
        friendly = "Network error. Please check your connection and try again.";
      console.error("[RATION] failure:", friendly);
      await logFailure(friendly);
      throw new Error(friendly);
    }

    const result = {
      reference: "RTN" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      fetched_at: new Date().toISOString(),
      mode: "LIVE",
      provider: "apizone",
      document: "PDF",
      fields: {
        "Ration Card No": rationno,
        ...(providerName ? { "Holder Name": providerName } : {}),
        "Card Type": data.card_type === "1" ? "Type 1" : "Type 2",
      },
    };

    const { data: req, error } = await supabaseAdmin.rpc("complete_document_request", {
      p_user_id: userId,
      p_service_id: service.id,
      p_input: rationno,
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

    console.log("[RATION] success: charged & logged", `base64Length=${pdfBase64.length} ref=${result.reference}`);
    return {
      request: req,
      pdfBase64,
      fileName: `RATION_${rationno}.pdf`,
      reference: result.reference,
    };
  });

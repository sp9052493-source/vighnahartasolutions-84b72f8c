import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const rcSchema = z.object({
  rcno: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Enter a valid registration number")
    .max(15, "Registration number is too long")
    .regex(/^[A-Z0-9-]+$/, "Only letters, numbers and dashes are allowed"),
  cardtype: z.enum(["1", "2"]).default("2"),
  chiptype: z.enum(["1", "2"]).default("2"),
});

const PDF_MAGIC = "%PDF";
const BASE64_PDF_PREFIX = "JVBER"; // base64 encoding of "%PDF"

/**
 * Securely proxies the APIZONE Vehicle RC Print API.
 * The API key is read server-side from process.env.APIZONE_API_KEY and is
 * never exposed to the browser. Returns the generated PDF as a base64 string.
 */
export const processRcPrint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => rcSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const rcno = data.rcno.replace(/-/g, "").toUpperCase();

    // Account must be active
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    if (profile?.status !== "active") {
      throw new Error("Your account is suspended. Contact your administrator.");
    }

    // Resolve the RC service
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("id, code, name, price, active")
      .eq("code", "RC")
      .single();
    if (svcErr || !service || !service.active) {
      throw new Error("Vehicle RC Print service is currently unavailable.");
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
      throw new Error("RC Print service is not configured. Please contact support.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    async function logFailure(message: string) {
      await supabaseAdmin.from("document_requests").insert({
        user_id: userId,
        service_id: service!.id,
        service_name: service!.name,
        input_value: data.rcno,
        status: "failed",
        cost: 0,
        error_message: message.slice(0, 500),
      });
    }

    // Call the APIZONE RC Print API
    let pdfBase64: string;
    let providerName = "";
    let providerAppNo = "";
    try {
      const url = new URL("https://www.apizone.info/api/rc_pdf/rc.php");
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("rcno", rcno);
      url.searchParams.set("cardtype", data.cardtype);
      url.searchParams.set("chiptype", data.chiptype);

      console.log("[RC] API request →", `rcno=${rcno} cardtype=${data.cardtype} chiptype=${data.chiptype}`);
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/pdf, application/json, */*" },
      });

      if (!res.ok) {
        throw new Error(`PROVIDER_${res.status}`);
      }

      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "";
      const head = buf.subarray(0, 8).toString("latin1");
      console.log(
        "[RC] API response ←",
        `status=${res.status} content-type=${contentType} bytes=${buf.length} head=${JSON.stringify(head)}`,
      );

      if (head.startsWith(PDF_MAGIC)) {
        // Raw PDF bytes
        pdfBase64 = buf.toString("base64");
        console.log("[RC] decoded: raw PDF bytes");
      } else {
        const text = buf.toString("utf8").trim();
        // Try JSON first — APIZONE returns { status, rcno, name, application_no, message, pdf }
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {
          /* not JSON */
        }

        if (json && typeof json === "object") {
          const rawPdf =
            json.pdf || json.pdf_base64 || json.base64 || json.data?.pdf || json.data?.base64 || json.data;
          const statusOk = String(json.status ?? "").includes("200") || /success/i.test(String(json.message ?? ""));
          if (typeof rawPdf === "string" && rawPdf.replace(/\s+/g, "").startsWith(BASE64_PDF_PREFIX)) {
            pdfBase64 = rawPdf.replace(/\s+/g, "");
            providerName = String(json.name ?? "");
            providerAppNo = String(json.application_no ?? "");
            console.log("[RC] decoded: JSON base64 PDF", `base64Length=${pdfBase64.length} statusOk=${statusOk}`);
          } else {
            const msg = String(json.message || json.error || json.status || "Unexpected provider response");
            const lower = msg.toLowerCase();
            console.warn("[RC] provider error JSON:", msg);
            if (lower.includes("not found") || lower.includes("no record")) throw new Error("RC_NOT_FOUND");
            if (lower.includes("invalid")) throw new Error("INVALID_RC");
            throw new Error(msg);
          }
        } else if (text.startsWith(BASE64_PDF_PREFIX)) {
          // Body is already a base64-encoded PDF
          pdfBase64 = text.replace(/\s+/g, "");
          console.log("[RC] decoded: plain base64 PDF body", `base64Length=${pdfBase64.length}`);
        } else {
          // Plain-text error / unexpected body
          const providerMsg = text.slice(0, 200);
          const lower = providerMsg.toLowerCase();
          console.warn("[RC] provider error text:", providerMsg);
          if (lower.includes("not found") || lower.includes("no record")) {
            throw new Error("RC_NOT_FOUND");
          }
          if (lower.includes("invalid")) {
            throw new Error("INVALID_RC");
          }
          throw new Error(providerMsg || "Provider returned an unexpected response.");
        }
      }

      // Sanity-check the decoded PDF really is a PDF
      const decodedHead = Buffer.from(pdfBase64.slice(0, 16), "base64").toString("latin1");
      if (!decodedHead.startsWith(PDF_MAGIC)) {
        console.error("[RC] decoded data is not a PDF, head=", JSON.stringify(decodedHead));
        throw new Error("Provider returned invalid PDF data.");
      }
    } catch (e: any) {
      const raw = e?.message || "Network error while contacting RC provider.";
      let friendly = raw;
      if (raw === "RC_NOT_FOUND") friendly = "No record found for this registration number.";
      else if (raw === "INVALID_RC") friendly = "Invalid registration number. Please check and retry.";
      else if (raw.startsWith("PROVIDER_")) friendly = "RC provider is temporarily unavailable. Please try again.";
      else if (/fetch|network|timeout|ENOTFOUND|ECONN/i.test(raw))
        friendly = "Network error. Please check your connection and try again.";
      console.error("[RC] failure:", friendly);
      await logFailure(friendly);
      throw new Error(friendly);
    }

    // Charge the wallet + log the successful request atomically
    const result = {
      reference: "RC" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      fetched_at: new Date().toISOString(),
      mode: "LIVE",
      provider: "apizone",
      document: "PDF",
      fields: {
        "RC Number": rcno,
        ...(providerName ? { "Holder Name": providerName } : {}),
        ...(providerAppNo ? { "Application No": providerAppNo } : {}),
        "Card Type": data.cardtype === "1" ? "Old Background" : "New Background",
        "Chip Type": data.chiptype === "1" ? "Chip RC" : "Non-Chip RC",
      },
    };

    // Persist the generated PDF so it can be re-downloaded from history
    let docPath = "";
    try {
      const { uploadDocumentPdf } = await import("@/lib/documents.server");
      docPath = await uploadDocumentPdf(userId, `RC_${rcno}.pdf`, pdfBase64);
    } catch (e: any) {
      console.error("[RC] could not persist PDF:", e?.message);
    }

    const { data: req, error } = await supabaseAdmin.rpc("complete_document_request", {
      p_user_id: userId,
      p_service_id: service.id,
      p_input: rcno,
      p_result: result,
      p_doc_url: docPath,
    });

    if (error) {
      if (error.message.includes("INSUFFICIENT_BALANCE")) {
        await logFailure("Insufficient wallet balance.");
        throw new Error("Insufficient wallet balance. Please top up to continue.");
      }
      await logFailure(error.message);
      throw new Error(error.message);
    }

    console.log("[RC] success: charged & logged", `base64Length=${pdfBase64.length} ref=${result.reference}`);
    return {
      request: req,
      pdfBase64,
      fileName: `RC_${rcno}.pdf`,
      reference: result.reference,
    };
  });
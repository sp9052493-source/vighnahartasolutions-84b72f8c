import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const requestSchema = z.object({
  serviceId: z.string().uuid(),
  inputValue: z.string().trim().min(3, "Enter a valid number").max(40),
});

/**
 * Generates document result data.
 *
 * DEMO MODE: returns realistic-looking placeholder data so the full flow works
 * end-to-end without a paid KYC provider. To go live, set the secrets for your
 * KYC aggregator (e.g. KYC_API_URL + KYC_API_KEY) and replace the stub block
 * with a real fetch() to the provider, mapping its response into `fields`.
 */
function buildResult(code: string, input: string) {
  const now = new Date();
  const ref = "SK" + Math.random().toString(36).slice(2, 10).toUpperCase();
  const common = {
    reference: ref,
    fetched_at: now.toISOString(),
    mode: "DEMO",
  };

  switch (code) {
    case "DL":
      return {
        ...common,
        fields: {
          "License Number": input.toUpperCase(),
          "Holder Name": "SAMPLE HOLDER",
          "Date of Birth": "01-01-1990",
          "Valid From": "01-01-2018",
          "Valid Till": "31-12-2038",
          "Vehicle Class": "LMV, MCWG",
          "Issuing Authority": "RTO",
          Status: "ACTIVE",
        },
      };
    case "PAN":
      return {
        ...common,
        fields: {
          "PAN Number": input.toUpperCase(),
          "Holder Name": "SAMPLE HOLDER",
          Category: "Individual",
          Status: "VALID",
        },
      };
    case "AADHAAR":
      return {
        ...common,
        fields: {
          "Aadhaar (masked)": "XXXX-XXXX-" + input.replace(/\D/g, "").slice(-4).padStart(4, "X"),
          Name: "SAMPLE HOLDER",
          Gender: "—",
          State: "—",
          Status: "VERIFIED",
        },
      };
    case "VOTER":
      return {
        ...common,
        fields: {
          "EPIC Number": input.toUpperCase(),
          Name: "SAMPLE HOLDER",
          Constituency: "—",
          State: "—",
          Status: "VALID",
        },
      };
    case "PASSPORT":
      return {
        ...common,
        fields: {
          "File Number": input.toUpperCase(),
          "Applicant Name": "SAMPLE HOLDER",
          "Application Type": "Fresh",
          Status: "DISPATCHED",
        },
      };
    default:
      return { ...common, fields: { Number: input } };
  }
}

async function fetchFromProvider(
  service: { code: string; api_endpoint: string | null; api_provider: string | null },
  input: string,
) {
  const apiKey = process.env.KYC_API_KEY;
  if (!service.api_endpoint) throw new Error("API endpoint is not configured for this service.");
  const res = await fetch(service.api_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ id_number: input, document: service.code }),
  });
  if (!res.ok) {
    throw new Error(`Provider returned ${res.status}. Please verify the number and try again.`);
  }
  const json = (await res.json()) as any;
  const fields = json?.fields ?? json?.data ?? json;
  return {
    reference: json?.reference || "SK" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    fetched_at: new Date().toISOString(),
    mode: "LIVE",
    provider: service.api_provider || "api",
    fields: typeof fields === "object" ? fields : { Result: String(fields) },
  };
}

export const processDocumentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => requestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // account must be active
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
      .select("id, code, name, price, active, api_enabled, api_endpoint, api_provider")
      .eq("id", data.serviceId)
      .single();
    if (svcErr || !service || !service.active) {
      throw new Error("Service is not available.");
    }

    const result =
      service.api_enabled && service.api_endpoint
        ? await fetchFromProvider(service as any, data.inputValue)
        : buildResult(service.code, data.inputValue);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: req, error } = await supabaseAdmin.rpc("complete_document_request", {
      p_user_id: userId,
      p_service_id: service.id,
      p_input: data.inputValue,
      p_result: result,
      p_doc_url: "",
    });

    if (error) {
      if (error.message.includes("INSUFFICIENT_BALANCE")) {
        throw new Error("Insufficient wallet balance. Please top up to continue.");
      }
      throw new Error(error.message);
    }

    return { request: req };
  });
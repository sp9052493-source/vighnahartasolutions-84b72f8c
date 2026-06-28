import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function loadSarkarServiceFromDb(serviceType: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("aaple_sarkar_services")
    .select("type, name_en, name_mr, price, active")
    .eq("type", serviceType)
    .maybeSingle();
  if (error || !data || !data.active) return undefined;
  return { type: data.type, en: data.name_en, mr: data.name_mr, price: Number(data.price || 0) };
}



const TABLE = "aaple_sarkar_applications";

const docSchema = z.object({
  name: z.string().trim().min(1).max(160),
  base64: z.string().min(1).max(15_000_000),
  contentType: z.string().trim().max(120).optional(),
});

const submitSchema = z.object({
  serviceType: z.string().trim().min(1).max(60),
  serviceLabel: z.string().trim().min(1).max(160),
  applicantName: z.string().trim().min(2).max(160),
  applicantNameMr: z.string().trim().max(160).optional().or(z.literal("")),
  fatherName: z.string().trim().max(160).optional().or(z.literal("")),
  mobile: z.string().trim().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  address: z.string().trim().min(4).max(600),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  taluka: z.string().trim().max(80).optional().or(z.literal("")),
  pincode: z.string().trim().max(10).optional().or(z.literal("")),
  purpose: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
  documents: z.array(docSchema).max(8).default([]),
});

function newReceiptNo() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `AS${ymd}${rand}`;
}

/**
 * Retailer submits an Aaple Sarkar certificate application with applicant
 * details and supporting documents. Files are stored in the private documents
 * bucket; a receipt number is generated and a tracked application row created.
 */
export const submitAapleSarkarApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => submitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    const svc = getSarkarService(data.serviceType);
    if (!svc) throw new Error("Selected service is not available.");
    const price = Number(svc.price || 0);

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single();
    if (profile?.status !== "active") {
      throw new Error("Your account is suspended. Contact your administrator.");
    }

    const { uploadDocumentPdf } = await import("@/lib/documents.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Debit wallet first (atomic, raises INSUFFICIENT_BALANCE)
    if (price > 0) {
      const { error: debitErr } = await supabaseAdmin.rpc("admin_adjust_wallet", {
        p_user_id: userId,
        p_amount: -price,
        p_description: `Aaple Sarkar: ${svc.en}`,
      });
      if (debitErr) {
        if (String(debitErr.message).includes("INSUFFICIENT_BALANCE")) {
          throw new Error("Insufficient wallet balance. Please recharge and try again.");
        }
        console.error("[AAPLE-SARKAR] wallet debit failed:", debitErr.message);
        throw new Error("Could not process payment from wallet.");
      }
    }

    const stored: { name: string; path: string }[] = [];
    for (const doc of data.documents) {
      const clean = doc.base64.includes(",") ? doc.base64.split(",").pop()! : doc.base64;
      const path = await uploadDocumentPdf(`${userId}/aaple-sarkar`, doc.name, clean);
      stored.push({ name: doc.name, path });
    }

    const receiptNo = newReceiptNo();
    const { data: row, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        receipt_no: receiptNo,
        user_id: userId,
        service_type: data.serviceType,
        service_label: data.serviceLabel,
        applicant_name: data.applicantName,
        applicant_name_mr: data.applicantNameMr || null,
        father_name: data.fatherName || null,
        mobile: data.mobile,
        email: data.email || null,
        address: data.address,
        district: data.district || null,
        taluka: data.taluka || null,
        pincode: data.pincode || null,
        purpose: data.purpose || null,
        notes: data.notes || null,
        documents: stored,
        cost: price,
        status: "submitted",
      })
      .select()
      .single();

    if (error) {
      // Best-effort refund if insert fails after debit
      if (price > 0) {
        await supabaseAdmin.rpc("admin_adjust_wallet", {
          p_user_id: userId,
          p_amount: price,
          p_description: `Refund: Aaple Sarkar submission failed (${svc.en})`,
        });
      }
      console.error("[AAPLE-SARKAR] insert failed:", error.message);
      throw new Error("Could not submit your application. Please try again.");
    }

    return { id: row.id, receiptNo, status: row.status, charged: price };
  });

export const listMyAapleSarkar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

export const getAapleSarkarDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("Application not found.");

    const { signDocumentUrl } = await import("@/lib/documents.server");
    const docs: { name: string; path: string }[] = Array.isArray(row.documents) ? (row.documents as any) : [];
    const signedDocs = await Promise.all(
      docs.map(async (d) => ({ name: d.name, url: await signDocumentUrl(d.path, 300).catch(() => "") })),
    );
    let resultUrl = "";
    if (row.result_doc_url) {
      resultUrl = await signDocumentUrl(row.result_doc_url, 300).catch(() => "");
    }
    return { application: row, signedDocs, resultUrl };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

export const adminListAapleSarkar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: apps } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    const ids = Array.from(new Set((apps || []).map((a: any) => a.user_id)));
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, business_name").in("id", ids)
      : { data: [] as any[] };
    const pMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    return (apps || []).map((a: any) => ({
      ...a,
      retailer_name: pMap.get(a.user_id)?.full_name || "—",
      retailer_business: pMap.get(a.user_id)?.business_name || "",
    }));
  });

export const adminGetAapleSarkarDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { signDocumentUrl } = await import("@/lib/documents.server");
    const { data: row, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("Application not found.");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, business_name, phone")
      .eq("id", row.user_id)
      .maybeSingle();
    const docs: { name: string; path: string }[] = Array.isArray(row.documents) ? (row.documents as any) : [];
    const signedDocs = await Promise.all(
      docs.map(async (d) => ({ name: d.name, url: await signDocumentUrl(d.path, 300).catch(() => "") })),
    );
    let resultUrl = "";
    if (row.result_doc_url) resultUrl = await signDocumentUrl(row.result_doc_url, 300).catch(() => "");
    return { application: row, profile, signedDocs, resultUrl };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["submitted", "under_review", "approved", "rejected", "completed"]),
  adminRemarks: z.string().trim().max(600).optional().or(z.literal("")),
  resultDoc: docSchema.optional(),
});

export const adminUpdateAapleSarkar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const update: Record<string, any> = {
      status: data.status,
      admin_remarks: data.adminRemarks || null,
    };

    if (data.resultDoc) {
      const { data: row } = await supabaseAdmin
        .from(TABLE)
        .select("user_id")
        .eq("id", data.id)
        .maybeSingle();
      if (row) {
        const { uploadDocumentPdf } = await import("@/lib/documents.server");
        const clean = data.resultDoc.base64.includes(",")
          ? data.resultDoc.base64.split(",").pop()!
          : data.resultDoc.base64;
        update.result_doc_url = await uploadDocumentPdf(
          `${row.user_id}/aaple-sarkar/issued`,
          data.resultDoc.name,
          clean,
        );
      }
    }

    const { error } = await supabaseAdmin.from(TABLE).update(update as any).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
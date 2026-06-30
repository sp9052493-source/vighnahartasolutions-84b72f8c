import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STORAGE_BUCKET = "documents";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = /^(application\/pdf|image\/(jpeg|jpg|png|webp))$/i;

export const GST_REQUIRED_DOCS = [
  { id: "pan", label: "PAN Card (Business/Applicant)" },
  { id: "aadhaar", label: "Aadhaar Card" },
  { id: "photo", label: "Passport-size Photograph" },
  { id: "cancelled_cheque", label: "Cancelled Cheque" },
  { id: "bank_proof", label: "Bank Statement / Passbook" },
  { id: "electricity_bill", label: "Electricity Bill of Premises" },
  { id: "business_proof", label: "Business Proof / Incorporation Certificate" },
  { id: "signature", label: "Signature Specimen" },
] as const;

export const GST_OPTIONAL_DOCS = [
  { id: "rent_agreement", label: "Rent Agreement (if rented)" },
  { id: "noc", label: "NOC from Owner (if rented)" },
  { id: "additional", label: "Additional Supporting Document" },
] as const;

export const GST_STATUSES = [
  "new",
  "pending",
  "in_progress",
  "query_raised",
  "approved",
  "rejected",
  "completed",
  "on_hold",
] as const;
export type GstStatus = (typeof GST_STATUSES)[number];

// ---------------- Helpers ----------------
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

async function signDocs(
  supabaseAdmin: any,
  rows: Array<{ id: string; storage_path: string; file_name: string; doc_type: string; mime_type: string; uploaded_at: string }>,
) {
  const out: any[] = [];
  for (const r of rows) {
    const { data } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(r.storage_path, 60 * 60);
    out.push({ ...r, url: data?.signedUrl || null });
  }
  return out;
}

async function logEvent(
  supabaseAdmin: any,
  args: {
    applicationId: string;
    eventType: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    message?: string | null;
    actorId: string;
    actorRole: "retailer" | "admin" | "system";
    metadata?: Record<string, any>;
  },
) {
  await supabaseAdmin.from("gst_application_events").insert({
    application_id: args.applicationId,
    event_type: args.eventType,
    from_status: args.fromStatus ?? null,
    to_status: args.toStatus ?? null,
    message: args.message ?? null,
    actor_id: args.actorId,
    actor_role: args.actorRole,
    metadata: args.metadata ?? {},
  });
}

// ---------------- Config ----------------
export const getGstConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gst_service_config")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const adminSaveGstConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        service_charge: z.number().min(0).max(100000),
        govt_fee: z.number().min(0).max(100000),
        active: z.boolean(),
        turnaround_text: z.string().trim().max(80),
        instructions_en: z.string().trim().max(8000),
        instructions_mr: z.string().trim().max(8000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("gst_service_config").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Retailer: create / submit ----------------
const applicationSchema = z.object({
  applicant_name: z.string().trim().min(2).max(120),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile"),
  email: z.string().trim().email().max(160),
  pan: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN"),
  aadhaar: z.string().regex(/^\d{12}$/, "Enter a valid 12-digit Aadhaar"),

  business_name: z.string().trim().min(2).max(160),
  trade_name: z.string().trim().max(160).optional().default(""),
  constitution: z.enum([
    "proprietor",
    "partnership",
    "llp",
    "pvt_ltd",
    "public_ltd",
    "huf",
    "society",
    "trust",
    "other",
  ]),
  nature_of_business: z.string().trim().min(2).max(200),
  commencement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),

  address_line1: z.string().trim().min(3).max(200),
  address_line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pin_code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN"),

  bank_account_name: z.string().trim().max(120).optional().default(""),
  bank_account_no: z.string().trim().max(40).optional().default(""),
  bank_ifsc: z.string().trim().max(20).optional().default(""),
  bank_name: z.string().trim().max(120).optional().default(""),
  bank_branch: z.string().trim().max(120).optional().default(""),

  signatory_name: z.string().trim().max(120).optional().default(""),
  signatory_designation: z.string().trim().max(80).optional().default(""),
  signatory_pan: z.string().trim().max(20).optional().default(""),
  signatory_mobile: z.string().trim().max(20).optional().default(""),
  signatory_email: z.string().trim().max(160).optional().default(""),

  hsn_codes: z
    .array(z.object({ code: z.string().trim().min(2).max(12), description: z.string().trim().max(160).default("") }))
    .max(20)
    .default([]),
  estimated_turnover: z.number().min(0).max(1e12).optional().nullable(),
  existing_registration: z.string().trim().max(80).optional().default(""),
});

export const createGstApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => applicationSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cfg } = await supabaseAdmin
      .from("gst_service_config")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!cfg?.active) throw new Error("GST Registration service is currently disabled.");

    const { data: appNoData, error: appNoErr } = await supabaseAdmin.rpc("generate_gst_application_no");
    if (appNoErr) throw new Error(appNoErr.message);

    const insertRow = {
      application_no: appNoData as string,
      user_id: context.userId,
      status: "new",
      applicant_name: data.applicant_name,
      mobile: data.mobile,
      email: data.email,
      pan: data.pan,
      aadhaar_last4: data.aadhaar.slice(-4),
      business_name: data.business_name,
      trade_name: data.trade_name || null,
      constitution: data.constitution,
      nature_of_business: data.nature_of_business,
      commencement_date: data.commencement_date || null,
      address_line1: data.address_line1,
      address_line2: data.address_line2 || null,
      city: data.city,
      district: data.district,
      state: data.state,
      pin_code: data.pin_code,
      bank_account_name: data.bank_account_name || null,
      bank_account_no: data.bank_account_no || null,
      bank_ifsc: data.bank_ifsc || null,
      bank_name: data.bank_name || null,
      bank_branch: data.bank_branch || null,
      signatory_name: data.signatory_name || null,
      signatory_designation: data.signatory_designation || null,
      signatory_pan: data.signatory_pan || null,
      signatory_mobile: data.signatory_mobile || null,
      signatory_email: data.signatory_email || null,
      hsn_codes: data.hsn_codes,
      estimated_turnover: data.estimated_turnover ?? null,
      existing_registration: data.existing_registration || null,
      service_charge: Number(cfg.service_charge || 0),
      govt_fee: Number(cfg.govt_fee || 0),
    };

    const { data: inserted, error } = await supabaseAdmin
      .from("gst_applications")
      .insert(insertRow)
      .select("id, application_no")
      .single();
    if (error) throw new Error(error.message);

    await logEvent(supabaseAdmin, {
      applicationId: inserted.id,
      eventType: "created",
      toStatus: "new",
      message: "Application drafted",
      actorId: context.userId,
      actorRole: "retailer",
    });

    return { id: inserted.id, application_no: inserted.application_no };
  });

const uploadSchema = z.object({
  applicationId: z.string().uuid(),
  docType: z.string().trim().min(1).max(40),
  filename: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(120),
  base64: z.string().min(1),
});

export const uploadGstDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!ALLOWED_MIME.test(data.contentType)) {
      throw new Error("Only PDF, JPEG, PNG or WEBP files are allowed.");
    }

    // Verify ownership (or admin) via RLS-aware client.
    const { data: app, error: appErr } = await context.supabase
      .from("gst_applications")
      .select("id, user_id, status")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (appErr || !app) throw new Error("Application not found.");

    const isOwner = app.user_id === context.userId;
    let isAdmin = false;
    if (!isOwner) {
      const { data: hr } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      isAdmin = !!hr;
      if (!isAdmin) throw new Error("Forbidden");
    }

    if (isOwner && !["new", "query_raised"].includes(app.status)) {
      throw new Error("Application is locked and cannot be modified.");
    }

    const cleaned = data.base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error("File must be under 8 MB.");
    }

    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "bin";
    const path = `gst/${data.applicationId}/${data.docType}-${Date.now()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: docRow, error: insErr } = await supabaseAdmin
      .from("gst_application_documents")
      .insert({
        application_id: data.applicationId,
        doc_type: data.docType,
        storage_path: path,
        file_name: safeName,
        mime_type: data.contentType,
        size_bytes: buffer.byteLength,
        uploaded_by: context.userId,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    await logEvent(supabaseAdmin, {
      applicationId: data.applicationId,
      eventType: "document_uploaded",
      message: `${data.docType} uploaded`,
      actorId: context.userId,
      actorRole: isAdmin ? "admin" : "retailer",
      metadata: { doc_type: data.docType, file_name: safeName },
    });

    return { id: docRow.id, doc_type: docRow.doc_type, file_name: docRow.file_name };
  });

export const deleteGstDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("gst_application_documents")
      .select("id, application_id, storage_path, application:gst_applications(user_id, status)")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) throw new Error("Document not found.");
    const app = (doc as any).application;
    const isOwner = app?.user_id === context.userId;
    if (!isOwner) {
      const { data: hr } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!hr) throw new Error("Forbidden");
    } else if (!["new", "query_raised"].includes(app.status)) {
      throw new Error("Application is locked and cannot be modified.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([doc.storage_path]);
    await supabaseAdmin.from("gst_application_documents").delete().eq("id", data.id);
    return { ok: true };
  });

export const submitGstApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app, error } = await supabaseAdmin
      .from("gst_applications")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !app) throw new Error("Application not found.");
    if (!["new", "query_raised"].includes(app.status)) {
      throw new Error("Application has already been submitted.");
    }

    const { data: docs } = await supabaseAdmin
      .from("gst_application_documents")
      .select("doc_type")
      .eq("application_id", data.id);
    const have = new Set((docs || []).map((d: any) => d.doc_type));
    const missing = GST_REQUIRED_DOCS.filter((d) => !have.has(d.id));
    if (missing.length) {
      throw new Error("Missing required documents: " + missing.map((m) => m.label).join(", "));
    }

    const total = Number(app.service_charge || 0) + Number(app.govt_fee || 0);

    const { error: chargeErr } = await supabaseAdmin.rpc("charge_gst_application", {
      p_user_id: context.userId,
      p_app_id: data.id,
      p_amount: total,
    });
    if (chargeErr) {
      if ((chargeErr.message || "").includes("INSUFFICIENT_BALANCE")) {
        throw new Error("Insufficient wallet balance. Please recharge and try again.");
      }
      throw new Error(chargeErr.message);
    }

    const fromStatus = app.status;
    await supabaseAdmin
      .from("gst_applications")
      .update({ status: "pending" })
      .eq("id", data.id);

    await logEvent(supabaseAdmin, {
      applicationId: data.id,
      eventType: "fee_charged",
      message: `₹${total.toFixed(2)} debited from wallet`,
      actorId: context.userId,
      actorRole: "retailer",
      metadata: { amount: total },
    });
    await logEvent(supabaseAdmin, {
      applicationId: data.id,
      eventType: "status_changed",
      fromStatus,
      toStatus: "pending",
      message: "Application submitted for processing",
      actorId: context.userId,
      actorRole: "retailer",
    });

    return { ok: true, application_no: app.application_no, charged: total };
  });

// ---------------- Retailer: read ----------------
export const listMyGstApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("gst_applications")
      .select("id, application_no, business_name, applicant_name, status, total_charged, created_at, district")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getMyGstApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: app, error } = await context.supabase
      .from("gst_applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !app) throw new Error("Application not found.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: docsRaw } = await supabaseAdmin
      .from("gst_application_documents")
      .select("id, doc_type, storage_path, file_name, mime_type, uploaded_at")
      .eq("application_id", data.id)
      .order("uploaded_at", { ascending: true });
    const { data: events } = await supabaseAdmin
      .from("gst_application_events")
      .select("id, event_type, from_status, to_status, message, actor_role, metadata, created_at")
      .eq("application_id", data.id)
      .order("created_at", { ascending: true });

    const docs = await signDocs(supabaseAdmin, docsRaw || []);
    // hide internal_notes from retailer
    const { internal_notes: _ignored, ...safeApp } = app as any;
    return { app: safeApp, docs, events: events || [] };
  });

// ---------------- Admin ----------------
export const adminListGstApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(GST_STATUSES).optional(),
        q: z.string().trim().max(120).optional(),
        district: z.string().trim().max(80).optional(),
        retailerId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
      .partial()
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("gst_applications")
      .select(
        "id, application_no, applicant_name, business_name, mobile, status, district, total_charged, created_at, user_id",
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (data.status) q = q.eq("status", data.status);
    if (data.district) q = q.eq("district", data.district);
    if (data.retailerId) q = q.eq("user_id", data.retailerId);
    if (data.dateFrom) q = q.gte("created_at", data.dateFrom);
    if (data.dateTo) q = q.lte("created_at", data.dateTo);
    if (data.q) {
      const like = `%${data.q}%`;
      q = q.or(
        `application_no.ilike.${like},applicant_name.ilike.${like},business_name.ilike.${like},mobile.ilike.${like}`,
      );
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows || []).map((r: any) => r.user_id)));
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, business_name").in("id", userIds)
      : { data: [] as any[] };
    const pMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return (rows || []).map((r: any) => ({
      ...r,
      retailer_name: pMap.get(r.user_id)?.full_name || "—",
      retailer_business: pMap.get(r.user_id)?.business_name || "",
    }));
  });

export const adminGetGstApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error } = await supabaseAdmin
      .from("gst_applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !app) throw new Error("Application not found.");

    const [{ data: docsRaw }, { data: events }, { data: profile }, { data: wallet }] = await Promise.all([
      supabaseAdmin
        .from("gst_application_documents")
        .select("id, doc_type, storage_path, file_name, mime_type, uploaded_at")
        .eq("application_id", data.id)
        .order("uploaded_at", { ascending: true }),
      supabaseAdmin
        .from("gst_application_events")
        .select("id, event_type, from_status, to_status, message, actor_role, actor_id, metadata, created_at")
        .eq("application_id", data.id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, business_name, phone")
        .eq("id", app.user_id)
        .maybeSingle(),
      supabaseAdmin.from("wallets").select("balance").eq("user_id", app.user_id).maybeSingle(),
    ]);

    const docs = await signDocs(supabaseAdmin, docsRaw || []);
    return { app, docs, events: events || [], retailer: profile, wallet };
  });

export const adminUpdateGstStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(GST_STATUSES),
        remarks: z.string().trim().max(2000).optional(),
        internalNote: z.string().trim().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin
      .from("gst_applications")
      .select("status, admin_remarks, internal_notes")
      .eq("id", data.id)
      .maybeSingle();
    if (!app) throw new Error("Application not found.");

    const patch: any = { status: data.status };
    if (data.remarks) patch.admin_remarks = data.remarks;
    if (data.internalNote) {
      patch.internal_notes = (app.internal_notes ? app.internal_notes + "\n\n" : "") + `[${new Date().toISOString()}] ${data.internalNote}`;
    }

    const { error } = await supabaseAdmin.from("gst_applications").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    await logEvent(supabaseAdmin, {
      applicationId: data.id,
      eventType: "status_changed",
      fromStatus: app.status,
      toStatus: data.status,
      message: data.remarks || null,
      actorId: context.userId,
      actorRole: "admin",
    });
    return { ok: true };
  });

export const adminAddGstRemark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        message: z.string().trim().min(1).max(2000),
        internal: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin
      .from("gst_applications")
      .select("internal_notes, admin_remarks")
      .eq("id", data.id)
      .maybeSingle();
    if (!app) throw new Error("Application not found.");

    if (data.internal) {
      const next = (app.internal_notes ? app.internal_notes + "\n\n" : "") + `[${new Date().toISOString()}] ${data.message}`;
      await supabaseAdmin.from("gst_applications").update({ internal_notes: next }).eq("id", data.id);
    } else {
      await supabaseAdmin.from("gst_applications").update({ admin_remarks: data.message }).eq("id", data.id);
    }

    await logEvent(supabaseAdmin, {
      applicationId: data.id,
      eventType: "remark_added",
      message: data.internal ? "[internal] " + data.message : data.message,
      actorId: context.userId,
      actorRole: "admin",
      metadata: { internal: data.internal },
    });
    return { ok: true };
  });

export const adminUploadGstResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        kind: z.enum(["certificate", "arn", "ack", "other"]),
        filename: z.string().trim().min(1).max(200),
        contentType: z.string().trim().min(1).max(120),
        base64: z.string().min(1),
        arnNo: z.string().trim().max(40).optional(),
        gstin: z.string().trim().max(20).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!ALLOWED_MIME.test(data.contentType)) throw new Error("Only PDF / image files allowed.");
    const cleaned = data.base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("File must be under 8 MB.");

    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "pdf";
    const docType =
      data.kind === "certificate" ? "admin_certificate" : data.kind === "arn" ? "admin_arn" : data.kind === "ack" ? "admin_ack" : "admin_other";
    const path = `gst/${data.id}/${docType}-${Date.now()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    await supabaseAdmin.from("gst_application_documents").insert({
      application_id: data.id,
      doc_type: docType,
      storage_path: path,
      file_name: safeName,
      mime_type: data.contentType,
      size_bytes: buffer.byteLength,
      uploaded_by: context.userId,
    });

    const patch: any = {};
    if (data.kind === "certificate") patch.certificate_path = path;
    if (data.kind === "ack") patch.acknowledgement_path = path;
    if (data.arnNo) patch.arn_no = data.arnNo;
    if (data.gstin) patch.gstin = data.gstin;
    if (Object.keys(patch).length) {
      await supabaseAdmin.from("gst_applications").update(patch).eq("id", data.id);
    }

    await logEvent(supabaseAdmin, {
      applicationId: data.id,
      eventType: data.kind === "certificate" ? "certificate_issued" : "document_uploaded",
      message: `Admin uploaded ${data.kind} (${safeName})`,
      actorId: context.userId,
      actorRole: "admin",
      metadata: { kind: data.kind, arn: data.arnNo, gstin: data.gstin },
    });
    return { ok: true };
  });

export const adminGetDistrictOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("gst_applications")
      .select("district")
      .order("district", { ascending: true });
    const set = new Set<string>();
    (data || []).forEach((r: any) => r.district && set.add(r.district));
    return Array.from(set);
  });

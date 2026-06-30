import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { UDYAM_DOC_TYPES, UDYAM_STATUSES, type UdyamStatus } from "./udyam.shared";

const STORAGE_BUCKET = "documents";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = /^(application\/pdf|image\/(jpeg|jpg|png|webp))$/i;
const SERVICE_CODE = "UDYAM";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

async function logEvent(
  supabaseAdmin: any,
  args: {
    applicationId: string;
    actorId: string;
    actorRole: "retailer" | "admin" | "system";
    eventType: string;
    fromStatus?: UdyamStatus | null;
    toStatus?: UdyamStatus | null;
    note?: string | null;
  },
) {
  await supabaseAdmin.from("udyam_application_events").insert({
    application_id: args.applicationId,
    actor_id: args.actorId,
    actor_role: args.actorRole,
    event_type: args.eventType,
    from_status: args.fromStatus ?? null,
    to_status: args.toStatus ?? null,
    note: args.note ?? null,
  });
}

// ---------- Validation schemas ----------
const formSchema = z.object({
  // personal
  aadhaar_number: z.string().regex(/^\d{12}$/, "Enter a valid 12-digit Aadhaar"),
  pan_number: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN"),
  name_as_aadhaar: z.string().trim().min(2).max(120),
  name_as_pan: z.string().trim().min(2).max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile"),
  email: z.string().trim().email().max(160),
  gender: z.string().trim().min(1).max(20),
  category: z.string().trim().min(1).max(20),

  // business
  business_name: z.string().trim().min(2).max(160),
  business_type: z.string().trim().min(2).max(60),
  business_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  business_address: z.string().trim().min(3).max(300),
  state: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  village: z.string().trim().max(120).optional().default(""),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN"),
  investment_amount: z.number().min(0).max(1e12),
  annual_turnover: z.number().min(0).max(1e12),
  gst_available: z.boolean(),
  gst_number: z.string().trim().max(20).optional().default(""),

  // bank
  bank_name: z.string().trim().min(2).max(120),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Enter a valid IFSC"),
  account_number: z.string().regex(/^\d{9,18}$/, "Enter a valid account number"),

  // employees
  employees_male: z.number().int().min(0).max(100000),
  employees_female: z.number().int().min(0).max(100000),
  employees_other: z.number().int().min(0).max(100000),
});

// Lenient version for drafts (everything optional, regex fields allow empty)
const draftSchema = z
  .object({
    id: z.string().uuid().optional(),
    aadhaar_number: z.string().regex(/^(\d{12})?$/, "Enter a valid 12-digit Aadhaar").optional(),
    pan_number: z.string().regex(/^([A-Z]{5}\d{4}[A-Z])?$/, "Enter a valid PAN").optional(),
    name_as_aadhaar: z.string().trim().max(120).optional(),
    name_as_pan: z.string().trim().max(120).optional(),
    dob: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Enter a valid date").optional(),
    mobile: z.string().regex(/^([6-9]\d{9})?$/, "Enter a valid 10-digit mobile").optional(),
    email: z.string().trim().max(160).optional(),
    gender: z.string().trim().max(20).optional(),
    category: z.string().trim().max(20).optional(),
    business_name: z.string().trim().max(160).optional(),
    business_type: z.string().trim().max(60).optional(),
    business_start_date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Enter a valid date").optional(),
    business_address: z.string().trim().max(300).optional(),
    state: z.string().trim().max(80).optional(),
    district: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    village: z.string().trim().max(120).optional(),
    pincode: z.string().regex(/^(\d{6})?$/, "Enter a valid 6-digit PIN").optional(),
    investment_amount: z.number().min(0).max(1e12).optional(),
    annual_turnover: z.number().min(0).max(1e12).optional(),
    gst_available: z.boolean().optional(),
    gst_number: z.string().trim().max(20).optional(),
    bank_name: z.string().trim().max(120).optional(),
    ifsc: z.string().regex(/^([A-Z]{4}0[A-Z0-9]{6})?$/, "Enter a valid IFSC").optional(),
    account_number: z.string().regex(/^(\d{9,18})?$/, "Enter a valid account number").optional(),
    employees_male: z.number().int().min(0).max(100000).optional(),
    employees_female: z.number().int().min(0).max(100000).optional(),
    employees_other: z.number().int().min(0).max(100000).optional(),
  });


// ---------- Service price helper ----------
async function getServicePrice(supabaseAdmin: any, userId: string): Promise<number> {
  const { data: svc } = await supabaseAdmin
    .from("services")
    .select("id, price")
    .eq("code", SERVICE_CODE)
    .maybeSingle();
  const { data: cfg } = await supabaseAdmin
    .from("udyam_service_config")
    .select("service_charge, govt_fee")
    .limit(1)
    .maybeSingle();
  if (svc?.id) {
    const { data: override } = await supabaseAdmin
      .from("user_service_pricing")
      .select("price")
      .eq("user_id", userId)
      .eq("service_id", svc.id)
      .maybeSingle();
    if (override?.price != null) return Number(override.price);
  }
  if (cfg) return Number(cfg.service_charge ?? 0) + Number(cfg.govt_fee ?? 0);
  if (svc) return Number(svc.price ?? 0);
  throw new Error("Udyam service is not configured.");
}

// ---------- Admin config: read / save ----------
export const getUdyamConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("udyam_service_config")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const adminSaveUdyamConfig = createServerFn({ method: "POST" })
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
    const { error } = await supabaseAdmin.from("udyam_service_config").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    // Keep services.price in sync for any UI that reads from it
    await supabaseAdmin
      .from("services")
      .update({ price: Number(patch.service_charge) + Number(patch.govt_fee), active: patch.active })
      .eq("code", SERVICE_CODE);
    return { ok: true };
  });


// ---------- Retailer: save draft ----------
export const saveUdyamDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;

    if (id) {
      const { data: existing } = await supabaseAdmin
        .from("udyam_applications")
        .select("id, user_id, status")
        .eq("id", id)
        .maybeSingle();
      if (!existing || existing.user_id !== context.userId) {
        throw new Error("Application not found.");
      }
      if (existing.status !== "draft") {
        throw new Error("Application is already submitted and cannot be edited.");
      }
      const { error } = await supabaseAdmin
        .from("udyam_applications")
        .update(patch)
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { id, application_no: null };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("udyam_applications")
      .insert({ ...patch, user_id: context.userId, status: "draft" })
      .select("id, application_no")
      .single();
    if (error) throw new Error(error.message);

    await logEvent(supabaseAdmin, {
      applicationId: inserted.id,
      actorId: context.userId,
      actorRole: "retailer",
      eventType: "created",
      toStatus: "draft",
      note: "Application drafted",
    });
    return { id: inserted.id, application_no: inserted.application_no };
  });

// ---------- Retailer: submit ----------
export const submitUdyamApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error } = await supabaseAdmin
      .from("udyam_applications")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error || !app) throw new Error("Application not found.");
    if (app.status !== "draft") throw new Error("Application has already been submitted.");

    // Validate the full form using current values
    const parsed = formSchema.safeParse({
      aadhaar_number: app.aadhaar_number,
      pan_number: app.pan_number,
      name_as_aadhaar: app.name_as_aadhaar,
      name_as_pan: app.name_as_pan,
      dob: app.dob,
      mobile: app.mobile,
      email: app.email,
      gender: app.gender,
      category: app.category,
      business_name: app.business_name,
      business_type: app.business_type,
      business_start_date: app.business_start_date,
      business_address: app.business_address,
      state: app.state,
      district: app.district,
      city: app.city,
      village: app.village ?? "",
      pincode: app.pincode,
      investment_amount: Number(app.investment_amount ?? 0),
      annual_turnover: Number(app.annual_turnover ?? 0),
      gst_available: !!app.gst_available,
      gst_number: app.gst_number ?? "",
      bank_name: app.bank_name,
      ifsc: app.ifsc,
      account_number: app.account_number,
      employees_male: Number(app.employees_male ?? 0),
      employees_female: Number(app.employees_female ?? 0),
      employees_other: Number(app.employees_other ?? 0),
    });
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      throw new Error(`Please complete the form: ${first.path.join(".")} – ${first.message}`);
    }

    // Verify required documents
    const { data: docs } = await supabaseAdmin
      .from("udyam_application_documents")
      .select("doc_type")
      .eq("application_id", data.id);
    const have = new Set((docs || []).map((d: any) => d.doc_type));
    const missing = UDYAM_DOC_TYPES.filter((d) => d.required && !have.has(d.id));
    if (missing.length) {
      throw new Error("Missing required documents: " + missing.map((m) => m.label).join(", "));
    }

    const fee = await getServicePrice(supabaseAdmin, context.userId);

    const { error: chargeErr } = await supabaseAdmin.rpc("charge_udyam_application", {
      p_user_id: context.userId,
      p_app_id: data.id,
      p_amount: fee,
    });
    if (chargeErr) {
      if ((chargeErr.message || "").includes("INSUFFICIENT_BALANCE")) {
        throw new Error("Insufficient wallet balance. Please recharge and try again.");
      }
      throw new Error(chargeErr.message);
    }

    await supabaseAdmin
      .from("udyam_applications")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", data.id);

    await logEvent(supabaseAdmin, {
      applicationId: data.id,
      actorId: context.userId,
      actorRole: "retailer",
      eventType: "fee_charged",
      note: `₹${fee.toFixed(2)} debited from wallet`,
    });
    await logEvent(supabaseAdmin, {
      applicationId: data.id,
      actorId: context.userId,
      actorRole: "retailer",
      eventType: "status_changed",
      fromStatus: "draft",
      toStatus: "submitted",
      note: "Application submitted for processing",
    });

    return { ok: true, application_no: app.application_no, charged: fee };
  });

// ---------- Documents ----------
const uploadSchema = z.object({
  applicationId: z.string().uuid(),
  docType: z.string().trim().min(1).max(40),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.string().trim().min(1).max(120),
  base64: z.string().min(1),
});

export const uploadUdyamDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!ALLOWED_MIME.test(data.mimeType)) {
      throw new Error("Only PDF, JPEG, PNG or WEBP files are allowed.");
    }

    const { data: app } = await context.supabase
      .from("udyam_applications")
      .select("id, user_id, status")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!app) throw new Error("Application not found.");

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
    if (isOwner && app.status !== "draft") {
      throw new Error("Application is locked.");
    }

    const cleaned = data.base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new Error("File must be under 8 MB.");
    }

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "bin";
    const path = `udyam/${app.user_id}/${data.applicationId}/${data.docType}-${Date.now()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: data.mimeType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: doc, error: insErr } = await supabaseAdmin
      .from("udyam_application_documents")
      .insert({
        application_id: data.applicationId,
        doc_type: data.docType,
        file_path: path,
        file_name: safeName,
        mime_type: data.mimeType,
        size_bytes: buffer.byteLength,
        uploaded_by: context.userId,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    await logEvent(supabaseAdmin, {
      applicationId: data.applicationId,
      actorId: context.userId,
      actorRole: isAdmin ? "admin" : "retailer",
      eventType: "document_uploaded",
      note: `${data.docType} uploaded`,
    });

    return { id: doc.id, doc_type: doc.doc_type, file_name: doc.file_name };
  });

export const deleteUdyamDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("udyam_application_documents")
      .select("id, application_id, file_path, application:udyam_applications(user_id, status)")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) throw new Error("Document not found.");
    const app = (doc as any).application;
    const isOwner = app?.user_id === context.userId;
    if (!isOwner) {
      const { data: hr } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!hr) throw new Error("Forbidden");
    } else if (app.status !== "draft") {
      throw new Error("Application is locked.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([doc.file_path]);
    await supabaseAdmin.from("udyam_application_documents").delete().eq("id", data.id);
    return { ok: true };
  });

export const getUdyamDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("udyam_application_documents")
      .select("id, file_path, application:udyam_applications(user_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (!doc) throw new Error("Document not found.");
    const app = (doc as any).application;
    if (app?.user_id !== context.userId) {
      const { data: hr } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!hr) throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(doc.file_path, 60 * 10);
    if (error || !signed?.signedUrl) throw new Error("Could not prepare document URL.");
    return { url: signed.signedUrl };
  });

// ---------- Retailer reads ----------
export const listMyUdyamApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("udyam_applications")
      .select(
        "id, application_no, business_name, name_as_aadhaar, status, total_charged, created_at, district, mobile",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getMyUdyamApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: app, error } = await context.supabase
      .from("udyam_applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !app) throw new Error("Application not found.");

    const [{ data: docs }, { data: events }] = await Promise.all([
      context.supabase
        .from("udyam_application_documents")
        .select("id, doc_type, file_name, mime_type, size_bytes, created_at")
        .eq("application_id", data.id)
        .order("created_at", { ascending: true }),
      context.supabase
        .from("udyam_application_events")
        .select("id, event_type, from_status, to_status, note, actor_role, created_at")
        .eq("application_id", data.id)
        .order("created_at", { ascending: true }),
    ]);

    return { app, docs: docs || [], events: events || [] };
  });

// ---------- Admin ----------
export const adminListUdyamApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(UDYAM_STATUSES).optional(),
        q: z.string().trim().max(120).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("udyam_applications")
      .select(
        "id, application_no, business_name, name_as_aadhaar, mobile, aadhaar_number, pan_number, status, total_charged, created_at, district, state",
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (data.status) query = query.eq("status", data.status);
    if (data.q) {
      const q = data.q.trim();
      query = query.or(
        [
          `application_no.ilike.%${q}%`,
          `business_name.ilike.%${q}%`,
          `name_as_aadhaar.ilike.%${q}%`,
          `mobile.ilike.%${q}%`,
          `aadhaar_number.ilike.%${q}%`,
          `pan_number.ilike.%${q}%`,
        ].join(","),
      );
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    // counts by status
    const { data: countsRaw } = await supabaseAdmin.from("udyam_applications").select("status");
    const counts: Record<string, number> = {};
    for (const r of countsRaw || []) counts[(r as any).status] = (counts[(r as any).status] || 0) + 1;

    return { rows: rows || [], counts };
  });

export const adminGetUdyamApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app, error } = await supabaseAdmin
      .from("udyam_applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !app) throw new Error("Application not found.");

    const [{ data: docs }, { data: events }] = await Promise.all([
      supabaseAdmin
        .from("udyam_application_documents")
        .select("*")
        .eq("application_id", data.id)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("udyam_application_events")
        .select("*")
        .eq("application_id", data.id)
        .order("created_at", { ascending: true }),
    ]);

    return { app, docs: docs || [], events: events || [] };
  });

export const adminUpdateUdyamStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        applicationId: z.string().uuid(),
        status: z.enum(UDYAM_STATUSES),
        remarks: z.string().trim().max(2000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: app } = await supabaseAdmin
      .from("udyam_applications")
      .select("id, status")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!app) throw new Error("Application not found.");

    const patch: any = { status: data.status };
    if (data.remarks) patch.remarks = data.remarks;

    const { error } = await supabaseAdmin
      .from("udyam_applications")
      .update(patch)
      .eq("id", data.applicationId);
    if (error) throw new Error(error.message);

    await logEvent(supabaseAdmin, {
      applicationId: data.applicationId,
      actorId: context.userId,
      actorRole: "admin",
      eventType: "status_changed",
      fromStatus: app.status as UdyamStatus,
      toStatus: data.status,
      note: data.remarks || null,
    });

    return { ok: true };
  });

export const adminUploadUdyamCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        applicationId: z.string().uuid(),
        fileName: z.string().trim().min(1).max(200),
        mimeType: z.string().trim().min(1).max(120),
        base64: z.string().min(1),
        kind: z.enum(["certificate", "acknowledgement"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!ALLOWED_MIME.test(data.mimeType)) {
      throw new Error("Only PDF, JPEG, PNG or WEBP files are allowed.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin
      .from("udyam_applications")
      .select("id, user_id")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!app) throw new Error("Application not found.");

    const cleaned = data.base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("File must be under 8 MB.");

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "bin";
    const path = `udyam/${app.user_id}/${data.applicationId}/${data.kind}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: data.mimeType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const patch: any = {};
    if (data.kind === "certificate") patch.certificate_url = path;
    else patch.acknowledgement_url = path;

    await supabaseAdmin.from("udyam_applications").update(patch).eq("id", data.applicationId);

    await logEvent(supabaseAdmin, {
      applicationId: data.applicationId,
      actorId: context.userId,
      actorRole: "admin",
      eventType: data.kind === "certificate" ? "certificate_uploaded" : "acknowledgement_uploaded",
      note: safeName,
    });

    return { ok: true, path };
  });

export const getUdyamStoredFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ applicationId: z.string().uuid(), kind: z.enum(["certificate", "acknowledgement"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: app } = await context.supabase
      .from("udyam_applications")
      .select("user_id, certificate_url, acknowledgement_url")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (!app) throw new Error("Application not found.");
    if (app.user_id !== context.userId) {
      const { data: hr } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!hr) throw new Error("Forbidden");
    }
    const path = data.kind === "certificate" ? app.certificate_url : app.acknowledgement_url;
    if (!path) throw new Error("File not available yet.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 10);
    if (error || !signed?.signedUrl) throw new Error("Could not prepare URL.");
    return { url: signed.signedUrl };
  });

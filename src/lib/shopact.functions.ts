import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SHOPACT_DOC_TYPES, SHOPACT_STATUSES, type ShopactStatus } from "./shopact.shared";

const STORAGE_BUCKET = "documents";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = /^(application\/pdf|image\/(jpeg|jpg|png|webp))$/i;
const SERVICE_CODE = "SHOPACT";

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
    fromStatus?: ShopactStatus | null;
    toStatus?: ShopactStatus | null;
    note?: string | null;
  },
) {
  await supabaseAdmin.from("shopact_application_events").insert({
    application_id: args.applicationId,
    actor_id: args.actorId,
    actor_role: args.actorRole,
    event_type: args.eventType,
    from_status: args.fromStatus ?? null,
    to_status: args.toStatus ?? null,
    note: args.note ?? null,
  });
}

// ---------- Schemas ----------
const formSchema = z.object({
  owner_name: z.string().trim().min(2).max(120),
  father_name: z.string().trim().min(2).max(120),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  gender: z.string().trim().min(1).max(20),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile"),
  email: z.string().trim().email().max(160),
  aadhaar_number: z.string().regex(/^\d{12}$/, "Enter a valid 12-digit Aadhaar"),
  pan_number: z.string().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN"),

  res_address: z.string().trim().min(3).max(300),
  res_city: z.string().trim().min(2).max(80),
  res_district: z.string().trim().min(2).max(80),
  res_state: z.string().trim().min(2).max(80),
  res_pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN"),

  business_name: z.string().trim().min(2).max(160),
  business_type: z.string().trim().min(2).max(60),
  business_nature: z.string().trim().min(2).max(120),
  business_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  business_address: z.string().trim().min(3).max(300),
  business_city: z.string().trim().min(2).max(80),
  business_district: z.string().trim().min(2).max(80),
  business_state: z.string().trim().min(2).max(80),
  business_pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN"),

  employees_male: z.number().int().min(0).max(100000),
  employees_female: z.number().int().min(0).max(100000),
  employees_other: z.number().int().min(0).max(100000),
});

const draftSchema = z.object({
  id: z.string().uuid().optional(),
  owner_name: z.string().trim().max(120).optional(),
  father_name: z.string().trim().max(120).optional(),
  dob: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional(),
  gender: z.string().trim().max(20).optional(),
  mobile: z.string().regex(/^([6-9]\d{9})?$/).optional(),
  email: z.string().trim().max(160).optional(),
  aadhaar_number: z.string().regex(/^(\d{12})?$/).optional(),
  pan_number: z.string().regex(/^([A-Z]{5}\d{4}[A-Z])?$/).optional(),
  res_address: z.string().trim().max(300).optional(),
  res_city: z.string().trim().max(80).optional(),
  res_district: z.string().trim().max(80).optional(),
  res_state: z.string().trim().max(80).optional(),
  res_pincode: z.string().regex(/^(\d{6})?$/).optional(),
  business_name: z.string().trim().max(160).optional(),
  business_type: z.string().trim().max(60).optional(),
  business_nature: z.string().trim().max(120).optional(),
  business_start_date: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional(),
  business_address: z.string().trim().max(300).optional(),
  business_city: z.string().trim().max(80).optional(),
  business_district: z.string().trim().max(80).optional(),
  business_state: z.string().trim().max(80).optional(),
  business_pincode: z.string().regex(/^(\d{6})?$/).optional(),
  employees_male: z.number().int().min(0).max(100000).optional(),
  employees_female: z.number().int().min(0).max(100000).optional(),
  employees_other: z.number().int().min(0).max(100000).optional(),
});

async function getServicePrice(supabaseAdmin: any, userId: string): Promise<number> {
  const { data: svc } = await supabaseAdmin
    .from("services").select("id, price").eq("code", SERVICE_CODE).maybeSingle();
  const { data: cfg } = await supabaseAdmin
    .from("shopact_service_config").select("price").limit(1).maybeSingle();
  if (svc?.id) {
    const { data: override } = await supabaseAdmin
      .from("user_service_pricing").select("price")
      .eq("user_id", userId).eq("service_id", svc.id).maybeSingle();
    if (override?.price != null) return Number(override.price);
  }
  if (cfg?.price != null) return Number(cfg.price);
  if (svc?.price != null) return Number(svc.price);
  throw new Error("Shop Act service is not configured.");
}

// ---------- Admin config ----------
export const getShopactConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shopact_service_config").select("*").limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const adminSaveShopactConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      price: z.number().min(0).max(100000),
      distributor_commission: z.number().min(0).max(100000),
      instructions: z.string().trim().max(8000),
      active: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("shopact_service_config").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("services")
      .update({ price: patch.price, distributor_commission: patch.distributor_commission, active: patch.active })
      .eq("code", SERVICE_CODE);
    return { ok: true };
  });

// ---------- Retailer: save draft ----------
export const saveShopactDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    if (id) {
      const { data: existing } = await supabaseAdmin
        .from("shopact_applications").select("id, user_id, status").eq("id", id).maybeSingle();
      if (!existing || existing.user_id !== context.userId) throw new Error("Application not found.");
      if (existing.status !== "draft") throw new Error("Application is already submitted and cannot be edited.");
      const { error } = await supabaseAdmin.from("shopact_applications").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      return { id, application_no: null };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("shopact_applications")
      .insert({ ...patch, user_id: context.userId, status: "draft" })
      .select("id, application_no").single();
    if (error) throw new Error(error.message);
    await logEvent(supabaseAdmin, {
      applicationId: inserted.id, actorId: context.userId, actorRole: "retailer",
      eventType: "created", toStatus: "draft", note: "Application drafted",
    });
    return { id: inserted.id, application_no: inserted.application_no };
  });

// ---------- Retailer: submit ----------
export const submitShopactApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error } = await supabaseAdmin
      .from("shopact_applications").select("*").eq("id", data.id).eq("user_id", context.userId).maybeSingle();
    if (error || !app) throw new Error("Application not found.");
    if (app.status !== "draft") throw new Error("Application has already been submitted.");

    const s = (v: any) => (v == null ? "" : String(v));
    const parsed = formSchema.safeParse({
      owner_name: s(app.owner_name), father_name: s(app.father_name), dob: s(app.dob),
      gender: s(app.gender), mobile: s(app.mobile), email: s(app.email),
      aadhaar_number: s(app.aadhaar_number), pan_number: s(app.pan_number),
      res_address: s(app.res_address), res_city: s(app.res_city), res_district: s(app.res_district),
      res_state: s(app.res_state), res_pincode: s(app.res_pincode),
      business_name: s(app.business_name), business_type: s(app.business_type),
      business_nature: s(app.business_nature), business_start_date: s(app.business_start_date),
      business_address: s(app.business_address), business_city: s(app.business_city),
      business_district: s(app.business_district), business_state: s(app.business_state),
      business_pincode: s(app.business_pincode),
      employees_male: Number(app.employees_male ?? 0),
      employees_female: Number(app.employees_female ?? 0),
      employees_other: Number(app.employees_other ?? 0),
    });
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      throw new Error(`Please complete the form: ${first.path.join(".")} – ${first.message}`);
    }

    const { data: docs } = await supabaseAdmin
      .from("shopact_application_documents").select("doc_type").eq("application_id", data.id);
    const have = new Set((docs || []).map((d: any) => d.doc_type));
    const missing = SHOPACT_DOC_TYPES.filter((d) => d.required && !have.has(d.id));
    if (missing.length) throw new Error("Missing required documents: " + missing.map((m) => m.label).join(", "));

    const fee = await getServicePrice(supabaseAdmin, context.userId);
    const { error: chargeErr } = await supabaseAdmin.rpc("charge_shopact_application", {
      p_user_id: context.userId, p_app_id: data.id, p_amount: fee,
    });
    if (chargeErr) {
      if ((chargeErr.message || "").includes("INSUFFICIENT_BALANCE"))
        throw new Error("Insufficient wallet balance. Please recharge and try again.");
      throw new Error(chargeErr.message);
    }

    await supabaseAdmin.from("shopact_applications")
      .update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("id", data.id);
    await logEvent(supabaseAdmin, {
      applicationId: data.id, actorId: context.userId, actorRole: "retailer",
      eventType: "fee_charged", note: `₹${fee.toFixed(2)} debited from wallet`,
    });
    await logEvent(supabaseAdmin, {
      applicationId: data.id, actorId: context.userId, actorRole: "retailer",
      eventType: "status_changed", fromStatus: "draft", toStatus: "submitted",
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

export const uploadShopactDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (!ALLOWED_MIME.test(data.mimeType)) throw new Error("Only PDF, JPEG, PNG or WEBP files are allowed.");
    const { data: app } = await context.supabase
      .from("shopact_applications").select("id, user_id, status").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Application not found.");
    const isOwner = app.user_id === context.userId;
    let isAdmin = false;
    if (!isOwner) {
      const { data: hr } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      isAdmin = !!hr;
      if (!isAdmin) throw new Error("Forbidden");
    }
    if (isOwner && app.status !== "draft") throw new Error("Application is locked.");

    const cleaned = data.base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("File must be under 8 MB.");

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "bin";
    const path = `shopact/${app.user_id}/${data.applicationId}/${data.docType}-${Date.now()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin.storage.from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: data.mimeType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: doc, error: insErr } = await supabaseAdmin
      .from("shopact_application_documents").insert({
        application_id: data.applicationId, doc_type: data.docType,
        file_path: path, file_name: safeName, mime_type: data.mimeType,
        size_bytes: buffer.byteLength, uploaded_by: context.userId,
      }).select("*").single();
    if (insErr) throw new Error(insErr.message);

    await logEvent(supabaseAdmin, {
      applicationId: data.applicationId, actorId: context.userId,
      actorRole: isAdmin ? "admin" : "retailer",
      eventType: "document_uploaded", note: `${data.docType} uploaded`,
    });
    return { id: doc.id, doc_type: doc.doc_type, file_name: doc.file_name };
  });

export const deleteShopactDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("shopact_application_documents")
      .select("id, application_id, file_path, application:shopact_applications(user_id, status)")
      .eq("id", data.id).maybeSingle();
    if (!doc) throw new Error("Document not found.");
    const app = (doc as any).application;
    const isOwner = app?.user_id === context.userId;
    if (!isOwner) {
      const { data: hr } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!hr) throw new Error("Forbidden");
    } else if (app.status !== "draft") throw new Error("Application is locked.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([doc.file_path]);
    await supabaseAdmin.from("shopact_application_documents").delete().eq("id", data.id);
    return { ok: true };
  });

export const getShopactDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("shopact_application_documents")
      .select("id, file_path, application:shopact_applications(user_id)")
      .eq("id", data.id).maybeSingle();
    if (!doc) throw new Error("Document not found.");
    const app = (doc as any).application;
    if (app?.user_id !== context.userId) {
      const { data: hr } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!hr) throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).createSignedUrl(doc.file_path, 600);
    if (error || !signed?.signedUrl) throw new Error("Could not prepare document URL.");
    return { url: signed.signedUrl };
  });

// ---------- Retailer reads ----------
export const listMyShopactApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("shopact_applications")
      .select("id, application_no, business_name, owner_name, status, total_charged, created_at, business_district, mobile")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data || [];
  });

export const getMyShopactApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: app, error } = await context.supabase
      .from("shopact_applications").select("*").eq("id", data.id).maybeSingle();
    if (error || !app) throw new Error("Application not found.");
    const [{ data: docs }, { data: events }] = await Promise.all([
      context.supabase.from("shopact_application_documents")
        .select("id, doc_type, file_name, mime_type, size_bytes, created_at")
        .eq("application_id", data.id).order("created_at", { ascending: true }),
      context.supabase.from("shopact_application_events")
        .select("id, event_type, from_status, to_status, note, actor_role, created_at")
        .eq("application_id", data.id).order("created_at", { ascending: true }),
    ]);
    return { app, docs: docs || [], events: events || [] };
  });

// ---------- Admin ----------
export const adminListShopactApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      status: z.enum(SHOPACT_STATUSES).optional(),
      q: z.string().trim().max(120).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("shopact_applications")
      .select("id, application_no, business_name, owner_name, mobile, aadhaar_number, pan_number, status, total_charged, created_at, business_district, business_state")
      .order("created_at", { ascending: false }).limit(500);
    if (data.status) query = query.eq("status", data.status);
    if (data.q) {
      const q = data.q.trim();
      query = query.or([
        `application_no.ilike.%${q}%`, `business_name.ilike.%${q}%`, `owner_name.ilike.%${q}%`,
        `mobile.ilike.%${q}%`, `aadhaar_number.ilike.%${q}%`, `pan_number.ilike.%${q}%`,
      ].join(","));
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const { data: countsRaw } = await supabaseAdmin.from("shopact_applications").select("status");
    const counts: Record<string, number> = {};
    for (const r of countsRaw || []) counts[(r as any).status] = (counts[(r as any).status] || 0) + 1;
    return { rows: rows || [], counts };
  });

export const adminGetShopactApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app, error } = await supabaseAdmin
      .from("shopact_applications").select("*").eq("id", data.id).maybeSingle();
    if (error || !app) throw new Error("Application not found.");
    const [{ data: docs }, { data: events }] = await Promise.all([
      supabaseAdmin.from("shopact_application_documents").select("*")
        .eq("application_id", data.id).order("created_at", { ascending: true }),
      supabaseAdmin.from("shopact_application_events").select("*")
        .eq("application_id", data.id).order("created_at", { ascending: true }),
    ]);
    return { app, docs: docs || [], events: events || [] };
  });

export const adminUpdateShopactStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      applicationId: z.string().uuid(),
      status: z.enum(SHOPACT_STATUSES),
      remarks: z.string().trim().max(2000).optional().default(""),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin
      .from("shopact_applications").select("id, status").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Application not found.");
    const patch: any = { status: data.status };
    if (data.remarks) patch.remarks = data.remarks;
    const { error } = await supabaseAdmin.from("shopact_applications").update(patch).eq("id", data.applicationId);
    if (error) throw new Error(error.message);
    await logEvent(supabaseAdmin, {
      applicationId: data.applicationId, actorId: context.userId, actorRole: "admin",
      eventType: "status_changed", fromStatus: app.status as ShopactStatus,
      toStatus: data.status, note: data.remarks || null,
    });
    return { ok: true };
  });

export const adminUploadShopactCertificate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      applicationId: z.string().uuid(),
      fileName: z.string().trim().min(1).max(200),
      mimeType: z.string().trim().min(1).max(120),
      base64: z.string().min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!ALLOWED_MIME.test(data.mimeType)) throw new Error("Only PDF, JPEG, PNG or WEBP files are allowed.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin.from("shopact_applications")
      .select("id, user_id").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Application not found.");
    const cleaned = data.base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");
    if (buffer.byteLength > MAX_UPLOAD_BYTES) throw new Error("File must be under 8 MB.");
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "bin";
    const path = `shopact/${app.user_id}/${data.applicationId}/certificate-${Date.now()}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage.from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: data.mimeType, upsert: false });
    if (upErr) throw new Error(upErr.message);
    await supabaseAdmin.from("shopact_applications").update({ certificate_url: path }).eq("id", data.applicationId);
    await logEvent(supabaseAdmin, {
      applicationId: data.applicationId, actorId: context.userId, actorRole: "admin",
      eventType: "certificate_uploaded", note: safeName,
    });
    return { ok: true, path };
  });

export const getShopactCertificateUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ applicationId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: app } = await context.supabase
      .from("shopact_applications").select("user_id, certificate_url").eq("id", data.applicationId).maybeSingle();
    if (!app) throw new Error("Application not found.");
    if (app.user_id !== context.userId) {
      const { data: hr } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!hr) throw new Error("Forbidden");
    }
    if (!app.certificate_url) throw new Error("Certificate not available yet.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET)
      .createSignedUrl(app.certificate_url, 600);
    if (error || !signed?.signedUrl) throw new Error("Could not prepare URL.");
    return { url: signed.signedUrl };
  });

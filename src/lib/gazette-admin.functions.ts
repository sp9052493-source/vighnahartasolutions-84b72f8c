import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TABLE = "aaple_sarkar_services";
const GAZETTE_TYPE = "gazette";
const SAMPLE_BUCKET = "documents";
const SAMPLE_PREFIX = "gazette-samples";

const changeTypeSchema = z.object({
  value: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Value must be lowercase a-z, 0-9, underscore"),
  en: z.string().trim().min(1).max(160),
  mr: z.string().trim().min(1).max(160),
  needsOld: z.boolean().default(true),
  needsNew: z.boolean().default(true),
  active: z.boolean().default(true),
});

const conditionalFieldSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Key must be alphanumeric"),
  en: z.string().trim().min(1).max(160),
  mr: z.string().trim().min(1).max(160),
  type: z.enum(["text", "number", "textarea"]).default("text"),
  required: z.boolean().default(false),
  appearsFor: z.array(z.string().trim().min(1).max(40)).default([]),
});

const docSchema = z.object({
  id: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_]+$/, "ID must be lowercase a-z, 0-9, underscore"),
  en: z.string().trim().min(1).max(200),
  mr: z.string().trim().min(1).max(200),
  required: z.boolean().default(false),
  appearsFor: z.array(z.string().trim().min(1).max(40)).default([]),
});

const saveSchema = z.object({
  price: z.number().min(0).max(100000),
  active: z.boolean().default(true),
  turnaround_text: z.string().trim().max(80).default(""),
  payment_options: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  change_types: z.array(changeTypeSchema).min(1).max(30),
  conditional_fields: z.array(conditionalFieldSchema).max(40).default([]),
  required_docs: z.array(docSchema).min(1).max(40),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

async function buildSampleUrl(supabaseAdmin: any, path: string | null) {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(SAMPLE_BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) return null;
  return data?.signedUrl || null;
}

export const adminGetGazette = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .eq("type", GAZETTE_TYPE)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Gazette service is not configured yet.");

    const cfg = (data as any).config && typeof (data as any).config === "object" ? (data as any).config : {};
    const samplePath: string | null = cfg.sample_pdf_path || null;
    const sampleUrl = await buildSampleUrl(supabaseAdmin, samplePath);

    return {
      id: data.id,
      price: Number(data.price ?? 0),
      active: !!data.active,
      change_types: Array.isArray(cfg.change_types) ? cfg.change_types : [],
      conditional_fields: Array.isArray(data.extra_fields) ? data.extra_fields : [],
      required_docs: Array.isArray(data.required_docs) ? data.required_docs : [],
      turnaround_text: typeof cfg.turnaround_text === "string" ? cfg.turnaround_text : "",
      payment_options: Array.isArray(cfg.payment_options) ? cfg.payment_options : [],
      sample_pdf_path: samplePath,
      sample_pdf_name: cfg.sample_pdf_name || null,
      sample_pdf_url: sampleUrl,
    };
  });

export const adminSaveGazette = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const allowed = new Set(data.change_types.map((c) => c.value));
    for (const f of data.conditional_fields) {
      for (const v of f.appearsFor) {
        if (!allowed.has(v)) throw new Error(`Field "${f.key}" references unknown change type "${v}"`);
      }
    }
    for (const d2 of data.required_docs) {
      for (const v of d2.appearsFor) {
        if (!allowed.has(v)) throw new Error(`Document "${d2.id}" references unknown change type "${v}"`);
      }
    }
    const keys = new Set<string>();
    for (const f of data.conditional_fields) {
      if (keys.has(f.key)) throw new Error(`Duplicate field key: ${f.key}`);
      keys.add(f.key);
    }
    const ids = new Set<string>();
    for (const d2 of data.required_docs) {
      if (ids.has(d2.id)) throw new Error(`Duplicate document id: ${d2.id}`);
      ids.add(d2.id);
    }
    const ctv = new Set<string>();
    for (const c of data.change_types) {
      if (ctv.has(c.value)) throw new Error(`Duplicate change-type value: ${c.value}`);
      ctv.add(c.value);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // preserve sample pdf metadata in config
    const { data: existing } = await supabaseAdmin
      .from(TABLE)
      .select("config")
      .eq("type", GAZETTE_TYPE)
      .maybeSingle();
    const existingCfg =
      existing?.config && typeof existing.config === "object" ? (existing.config as any) : {};

    const { error } = await supabaseAdmin
      .from(TABLE)
      .update({
        price: data.price,
        active: data.active,
        extra_fields: data.conditional_fields as any,
        required_docs: data.required_docs as any,
        config: {
          ...existingCfg,
          change_types: data.change_types,
          turnaround_text: data.turnaround_text,
          payment_options: data.payment_options,
        } as any,
      })
      .eq("type", GAZETTE_TYPE);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------- Sample PDF management ----------------

const uploadSampleSchema = z.object({
  filename: z.string().trim().min(1).max(160),
  contentType: z.string().trim().min(1).max(120),
  base64: z.string().min(1), // data URL or pure base64
});

export const adminUploadGazetteSample = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadSampleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    if (!/^application\/pdf$|^image\//.test(data.contentType)) {
      throw new Error("Only PDF or image files are allowed.");
    }

    // Decode base64 (strip data: prefix if present)
    const cleaned = data.base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleaned, "base64");
    if (buffer.byteLength > 8 * 1024 * 1024) {
      throw new Error("Sample file must be under 8 MB.");
    }

    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "pdf";
    const path = `${SAMPLE_PREFIX}/sample-${Date.now()}.${ext}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // remove old sample if any
    const { data: existing } = await supabaseAdmin
      .from(TABLE)
      .select("config")
      .eq("type", GAZETTE_TYPE)
      .maybeSingle();
    const existingCfg =
      existing?.config && typeof existing.config === "object" ? (existing.config as any) : {};
    if (existingCfg.sample_pdf_path) {
      await supabaseAdmin.storage.from(SAMPLE_BUCKET).remove([existingCfg.sample_pdf_path]);
    }

    const { error: upErr } = await supabaseAdmin.storage
      .from(SAMPLE_BUCKET)
      .upload(path, buffer, { contentType: data.contentType, upsert: true });
    if (upErr) throw new Error(upErr.message);

    const { error: dbErr } = await supabaseAdmin
      .from(TABLE)
      .update({
        config: {
          ...existingCfg,
          sample_pdf_path: path,
          sample_pdf_name: safeName,
          sample_pdf_type: data.contentType,
        } as any,
      })
      .eq("type", GAZETTE_TYPE);
    if (dbErr) throw new Error(dbErr.message);

    const url = await buildSampleUrl(supabaseAdmin, path);
    return { ok: true, path, name: safeName, url };
  });

export const adminDeleteGazetteSample = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from(TABLE)
      .select("config")
      .eq("type", GAZETTE_TYPE)
      .maybeSingle();
    const existingCfg =
      existing?.config && typeof existing.config === "object" ? (existing.config as any) : {};
    if (existingCfg.sample_pdf_path) {
      await supabaseAdmin.storage.from(SAMPLE_BUCKET).remove([existingCfg.sample_pdf_path]);
    }
    const nextCfg = { ...existingCfg };
    delete nextCfg.sample_pdf_path;
    delete nextCfg.sample_pdf_name;
    delete nextCfg.sample_pdf_type;
    const { error } = await supabaseAdmin
      .from(TABLE)
      .update({ config: nextCfg as any })
      .eq("type", GAZETTE_TYPE);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public (authenticated user) — fresh signed URL for the sample document.
export const getGazetteSampleUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("config")
      .eq("type", GAZETTE_TYPE)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const cfg = data?.config && typeof data.config === "object" ? (data.config as any) : {};
    const path: string | null = cfg.sample_pdf_path || null;
    if (!path) return { url: null, name: null, type: null };
    const url = await buildSampleUrl(supabaseAdmin, path);
    return {
      url,
      name: cfg.sample_pdf_name || "sample.pdf",
      type: cfg.sample_pdf_type || "application/pdf",
    };
  });

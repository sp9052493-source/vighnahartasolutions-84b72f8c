import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SarkarService } from "@/lib/aaple-sarkar.shared";

const TABLE = "aaple_sarkar_services";

const extraFieldSchema = z.object({
  key: z.string().trim().min(1).max(40).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Key must be alphanumeric"),
  en: z.string().trim().min(1).max(120),
  mr: z.string().trim().min(1).max(120),
  type: z.enum(["text", "number", "textarea"]).optional(),
  required: z.boolean().optional(),
});

const requiredDocSchema = z.object({
  id: z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/, "ID must be lowercase alphanumeric"),
  en: z.string().trim().min(1).max(160),
  mr: z.string().trim().min(1).max(160),
  required: z.boolean().optional(),
});

const upsertSchema = z.object({
  type: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Type must be lowercase a-z, 0-9, underscore"),
  name_en: z.string().trim().min(2).max(120),
  name_mr: z.string().trim().min(1).max(120),
  desc_en: z.string().trim().max(400).default(""),
  desc_mr: z.string().trim().max(400).default(""),
  tone: z.string().trim().max(200).default("from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]"),
  price: z.number().min(0).max(100000),
  extra_fields: z.array(extraFieldSchema).max(20).default([]),
  required_docs: z.array(requiredDocSchema).max(20).default([]),
  active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(10000).default(100),
});

function rowToService(row: any): SarkarService & { id: string; active: boolean; sort_order: number } {
  return {
    id: row.id,
    type: row.type,
    en: row.name_en,
    mr: row.name_mr,
    descEn: row.desc_en || "",
    descMr: row.desc_mr || "",
    tone: row.tone || "",
    price: Number(row.price || 0),
    extraFields: Array.isArray(row.extra_fields) ? row.extra_fields : [],
    requiredDocs: Array.isArray(row.required_docs) ? row.required_docs : [],
    active: !!row.active,
    sort_order: Number(row.sort_order || 0),
  };
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

export const listSarkarServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from(TABLE)
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name_en", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToService);
  });

export const adminListSarkarServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name_en", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(rowToService);
  });

export const adminCreateSarkarService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(TABLE).insert(data as any);
    if (error) {
      if (error.code === "23505") throw new Error(`Service type "${data.type}" already exists.`);
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminUpdateSarkarService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from(TABLE).update(patch as any).eq("id", id);
    if (error) {
      if (error.code === "23505") throw new Error(`Service type "${data.type}" already exists.`);
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteSarkarService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from(TABLE)
      .select("id, type")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Service not found.");

    const { count } = await supabaseAdmin
      .from("aaple_sarkar_applications")
      .select("id", { count: "exact", head: true })
      .eq("service_type", row.type);

    if ((count || 0) > 0) {
      // Soft delete: preserve history
      const { error } = await supabaseAdmin.from(TABLE).update({ active: false }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, softDeleted: true };
    }

    const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, softDeleted: false };
  });

export const adminToggleSarkarService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from(TABLE)
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

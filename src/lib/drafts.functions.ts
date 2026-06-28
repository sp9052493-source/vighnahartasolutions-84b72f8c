import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TABLE = "service_drafts";

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  service_key: z.string().trim().min(1).max(80),
  service_label: z.string().trim().min(1).max(160),
  customer_name: z.string().trim().max(160).optional().nullable(),
  summary: z.string().trim().max(400).optional().nullable(),
  form_data: z.record(z.string(), z.any()).default({}),
});

export type DraftRow = {
  id: string;
  service_key: string;
  service_label: string;
  customer_name: string | null;
  summary: string | null;
  form_data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export const listDrafts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data || []) as DraftRow[];
  });

export const getDraft = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from(TABLE)
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (row || null) as DraftRow | null;
  });

export const saveDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload = {
      user_id: context.userId,
      service_key: data.service_key,
      service_label: data.service_label,
      customer_name: data.customer_name?.trim() || null,
      summary: data.summary?.trim() || null,
      form_data: data.form_data,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from(TABLE)
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", context.userId)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Draft not found");
      return row as DraftRow;
    }
    const { data: row, error } = await context.supabase
      .from(TABLE)
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as DraftRow;
  });

export const deleteDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from(TABLE)
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

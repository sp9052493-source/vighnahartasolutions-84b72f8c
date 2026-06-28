import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

const emailSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().trim().email().max(255),
});

export const adminChangeUserEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      email: data.email,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const passwordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(6).max(72),
});

export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => passwordSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const extrasSchema = z.object({
  userId: z.string().uuid(),
  photo_url: z.string().max(500).optional().nullable(),
  kyc_aadhaar_url: z.string().max(500).optional().nullable(),
  kyc_pan_url: z.string().max(500).optional().nullable(),
  kyc_extra_url: z.string().max(500).optional().nullable(),
});

export const adminUpdateUserExtras = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => extrasSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId, ...patch } = data;
    const { error } = await supabaseAdmin.from("profiles").update(patch as any).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const uploadSchema = z.object({
  userId: z.string().uuid(),
  field: z.enum(["photo_url", "kyc_aadhaar_url", "kyc_pan_url", "kyc_extra_url"]),
  filename: z.string().trim().min(1).max(160),
  contentType: z.string().trim().min(1).max(100),
  base64: z.string().min(1),
});

export const adminUploadUserAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => uploadSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `kyc/${data.userId}/${data.field}_${Date.now()}_${safe}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("documents")
      .upload(path, bytes, { contentType: data.contentType, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: signed } = await supabaseAdmin.storage.from("documents").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl || path;
    const { error: pErr } = await supabaseAdmin.from("profiles").update({ [data.field]: url } as any).eq("id", data.userId);
    if (pErr) throw new Error(pErr.message);
    return { url };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin access required");
}

// -------- Public reads --------
export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("site_settings").select("*").eq("id", "global").maybeSingle();
  return data;
});

export const getSitePage = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().max(40) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row } = await sb.from("site_pages").select("*").eq("slug", data.slug).maybeSingle();
    return row;
  });

export const listSitePages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("site_pages").select("*").order("slug");
    return data || [];
  });

// -------- Admin: site settings --------
const settingsSchema = z.object({
  company_name: z.string().trim().min(1).max(120),
  brand_tagline: z.string().trim().max(160).optional().nullable(),
  contact_email: z.string().trim().email().max(160),
  support_email: z.string().trim().email().max(160),
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  address_line1: z.string().trim().max(200),
  address_line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(80),
  state: z.string().trim().max(80),
  pincode: z.string().trim().max(20),
  country: z.string().trim().max(80),
  gst_number: z.string().trim().max(40).optional().nullable(),
  business_hours: z.string().trim().max(120).optional().nullable(),
  logo_url: z.string().trim().max(500).optional().nullable(),
  favicon_url: z.string().trim().max(500).optional().nullable(),
  social: z
    .object({
      facebook: z.string().max(300).optional(),
      instagram: z.string().max(300).optional(),
      twitter: z.string().max(300).optional(),
      youtube: z.string().max(300).optional(),
      linkedin: z.string().max(300).optional(),
    })
    .optional(),
});

export const adminUpdateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .update({ ...data, social: data.social ?? {} })
      .eq("id", "global");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Admin: site pages --------
const pageSchema = z.object({
  slug: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(200),
  meta_description: z.string().trim().max(400).optional().nullable(),
  content_md: z.string().max(40000),
});

export const adminUpsertSitePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => pageSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_pages")
      .upsert({ ...data, updated_by: context.userId }, { onConflict: "slug" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Admin: payment gateways --------
export const adminListGateways = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("payment_gateways").select("*").order("provider");
    return data || [];
  });

const gatewaySchema = z.object({
  provider: z.enum(["paytm", "razorpay", "cashfree"]),
  mode: z.enum(["test", "live"]),
  enabled: z.boolean(),
  is_primary: z.boolean(),
  merchant_id: z.string().trim().max(120).optional().nullable(),
  key_id_public: z.string().trim().max(200).optional().nullable(),
  webhook_url: z.string().trim().max(400).optional().nullable(),
  secret_key_name: z.string().trim().max(80).optional().nullable(),
});

export const adminUpdateGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => gatewaySchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // If marking as primary, demote all others
    if (data.is_primary) {
      await supabaseAdmin.from("payment_gateways").update({ is_primary: false }).neq("provider", data.provider);
    }
    const { error } = await supabaseAdmin.from("payment_gateways").update(data).eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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

export const adminListUserPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: services }, { data: overrides }] = await Promise.all([
      supabaseAdmin
        .from("services")
        .select("id, name, name_mr, code, category, price, distributor_commission, active")
        .order("category", { ascending: true })
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("user_service_pricing")
        .select("service_id, price, distributor_commission, note, updated_at")
        .eq("user_id", data.userId),
    ]);
    const map = new Map((overrides || []).map((o: any) => [o.service_id, o]));
    return (services || []).map((s: any) => {
      const o = map.get(s.id);
      return {
        service_id: s.id,
        name: s.name,
        name_mr: s.name_mr,
        code: s.code,
        category: s.category,
        active: s.active,
        default_price: Number(s.price),
        default_commission: Number(s.distributor_commission),
        override_price: o ? Number(o.price) : null,
        override_commission: o ? Number(o.distributor_commission) : null,
        note: o?.note ?? null,
        updated_at: o?.updated_at ?? null,
      };
    });
  });

const upsertSchema = z.object({
  userId: z.string().uuid(),
  serviceId: z.string().uuid(),
  price: z.number().min(0).max(100000),
  distributorCommission: z.number().min(0).max(100000).optional(),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export const adminUpsertUserPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_service_pricing")
      .upsert(
        {
          user_id: data.userId,
          service_id: data.serviceId,
          price: data.price,
          distributor_commission: data.distributorCommission ?? 0,
          note: data.note || null,
        },
        { onConflict: "user_id,service_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminClearUserPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), serviceId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_service_pricing")
      .delete()
      .eq("user_id", data.userId)
      .eq("service_id", data.serviceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

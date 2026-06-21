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

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  businessName: z.string().trim().max(160).optional().or(z.literal("")),
  role: z.enum(["distributor", "retailer"]),
  parentId: z.string().uuid().optional().or(z.literal("")),
  openingBalance: z.number().min(0).max(1000000).optional(),
});

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        phone: data.phone || null,
        business_name: data.businessName || null,
        role: data.role,
      },
    });
    if (error || !created.user) throw new Error(error?.message || "Could not create account");

    const newId = created.user.id;

    // Ensure role is set exactly (trigger sets retailer by default for non-first users)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    await supabaseAdmin.from("user_roles").insert({ user_id: newId, role: data.role });

    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone || null,
        business_name: data.businessName || null,
        parent_id: data.parentId || null,
      })
      .eq("id", newId);

    if (data.openingBalance && data.openingBalance > 0) {
      await supabaseAdmin.rpc("admin_adjust_wallet", {
        p_user_id: newId,
        p_amount: data.openingBalance,
        p_description: "Opening balance",
      });
    }

    return { id: newId };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: roles }, { data: wallets }, authRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("wallets").select("user_id, balance"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
    const walletMap = new Map((wallets || []).map((w: any) => [w.user_id, Number(w.balance)]));
    const emailMap = new Map((authRes.data?.users || []).map((u: any) => [u.id, u.email]));

    return (profiles || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      phone: p.phone,
      business_name: p.business_name,
      status: p.status,
      parent_id: p.parent_id,
      created_at: p.created_at,
      role: roleMap.get(p.id) || "retailer",
      balance: walletMap.get(p.id) ?? 0,
      email: emailMap.get(p.id) || "",
    }));
  });

const adjustSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().refine((n) => n !== 0, "Amount cannot be zero").gte(-1000000).lte(1000000),
  description: z.string().trim().max(160).optional(),
});

export const adminAdjustWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => adjustSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: balance, error } = await supabaseAdmin.rpc("admin_adjust_wallet", {
      p_user_id: data.userId,
      p_amount: data.amount,
      p_description: data.description || "Admin adjustment",
    });
    if (error) {
      if (error.message.includes("INSUFFICIENT_BALANCE")) throw new Error("Balance cannot go negative.");
      throw new Error(error.message);
    }
    return { balance };
  });

const statusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

export const adminSetUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => statusSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reqs } = await supabaseAdmin
      .from("document_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const ids = Array.from(new Set((reqs || []).map((r: any) => r.user_id)));
    const { data: profiles } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as any[] };
    const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
    return (reqs || []).map((r: any) => ({ ...r, user_name: nameMap.get(r.user_id) || "—" }));
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: users }, { count: requests }, { data: wallets }, { count: distributors }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("document_requests").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("wallets").select("balance"),
        supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "distributor"),
      ]);
    const totalBalance = (wallets || []).reduce((s: number, w: any) => s + Number(w.balance), 0);
    return {
      users: users || 0,
      requests: requests || 0,
      distributors: distributors || 0,
      totalBalance,
    };
  });

const serviceSchema = z.object({
  id: z.string().uuid(),
  price: z.number().min(0).max(100000),
  retailer_commission: z.number().min(0).max(100000),
  distributor_commission: z.number().min(0).max(100000),
  active: z.boolean(),
});

export const adminUpdateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => serviceSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("services")
      .update({
        price: data.price,
        retailer_commission: data.retailer_commission,
        distributor_commission: data.distributor_commission,
        active: data.active,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
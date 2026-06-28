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
  amount: z.number().gte(-1000000).lte(1000000).refine((n) => n !== 0, "Amount cannot be zero"),
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

const CODE_RE = /^[A-Z0-9_]{2,20}$/;

const serviceSchema = z.object({
  id: z.string().uuid(),
  code: z.string().trim().toUpperCase().regex(CODE_RE, "Code must be 2–20 chars, A–Z / 0–9 / _"),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(280).optional().or(z.literal("")),
  input_label: z.string().trim().min(2).max(40),
  price: z.number().min(0).max(100000),
  retailer_commission: z.number().min(0).max(100000),
  distributor_commission: z.number().min(0).max(100000),
  sort_order: z.number().int().min(0).max(9999).optional(),
  active: z.boolean(),
  api_provider: z.string().trim().max(40).optional(),
  api_endpoint: z.string().trim().max(500).optional().or(z.literal("")),
  api_enabled: z.boolean().optional(),
  api_notes: z.string().trim().max(500).optional().or(z.literal("")),
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
        code: data.code,
        name: data.name,
        description: data.description || null,
        input_label: data.input_label,
        price: data.price,
        retailer_commission: data.retailer_commission,
        distributor_commission: data.distributor_commission,
        sort_order: data.sort_order ?? 0,
        active: data.active,
        api_provider: data.api_provider ?? "demo",
        api_endpoint: data.api_endpoint || null,
        api_enabled: data.api_enabled ?? false,
        api_notes: data.api_notes || null,
      })
      .eq("id", data.id);
    if (error) {
      if (error.code === "23505") throw new Error(`Service code "${data.code}" already exists.`);
      throw new Error(error.message);
    }
    return { ok: true };
  });

const createServiceSchema = serviceSchema.omit({ id: true });

export const adminCreateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createServiceSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("services")
      .insert({
        code: data.code,
        name: data.name,
        description: data.description || null,
        input_label: data.input_label,
        price: data.price,
        retailer_commission: data.retailer_commission,
        distributor_commission: data.distributor_commission,
        sort_order: data.sort_order ?? 0,
        active: data.active,
        api_provider: data.api_provider ?? "demo",
        api_endpoint: data.api_endpoint || null,
        api_enabled: data.api_enabled ?? false,
        api_notes: data.api_notes || null,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") throw new Error(`Service code "${data.code}" already exists.`);
      throw new Error(error.message);
    }
    return { id: row!.id };
  });

const deleteServiceSchema = z.object({ id: z.string().uuid() });

export const adminDeleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deleteServiceSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Soft delete: deactivate if referenced by document_requests; hard delete otherwise
    const { count } = await supabaseAdmin
      .from("document_requests")
      .select("*", { count: "exact", head: true })
      .eq("service_id", data.id);
    if ((count ?? 0) > 0) {
      const { error } = await supabaseAdmin.from("services").update({ active: false }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, softDeleted: true };
    }
    const { error } = await supabaseAdmin.from("services").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, softDeleted: false };
  });


const updateUserSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  businessName: z.string().trim().max(160).optional().or(z.literal("")),
  parentId: z.string().uuid().optional().or(z.literal("")),
});

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateUserSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone || null,
        business_name: data.businessName || null,
        parent_id: data.parentId || null,
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminMemberDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = data.userId;

    const [{ data: profile }, { data: roleRow }, { data: wallet }, { data: reqs }, { data: txns }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabaseAdmin.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
        supabaseAdmin.from("wallets").select("balance").eq("user_id", uid).maybeSingle(),
        supabaseAdmin
          .from("document_requests")
          .select("id, service_name, input_value, status, cost, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(500),
        supabaseAdmin
          .from("wallet_transactions")
          .select("id, amount, type, description, balance_after, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    const allReqs = reqs || [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthReqs = allReqs.filter((r: any) => new Date(r.created_at) >= monthStart);
    const totalSpent = allReqs.reduce((s: number, r: any) => s + Number(r.cost), 0);
    const monthSpent = monthReqs.reduce((s: number, r: any) => s + Number(r.cost), 0);

    // last 6 months trend
    const months: { label: string; count: number; spent: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const inMonth = allReqs.filter(
        (r: any) => new Date(r.created_at) >= d && new Date(r.created_at) < next,
      );
      months.push({
        label: d.toLocaleString("en-IN", { month: "short" }),
        count: inMonth.length,
        spent: inMonth.reduce((s: number, r: any) => s + Number(r.cost), 0),
      });
    }

    // by service breakdown
    const byServiceMap = new Map<string, number>();
    for (const r of allReqs) byServiceMap.set(r.service_name, (byServiceMap.get(r.service_name) || 0) + 1);
    const byService = Array.from(byServiceMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      profile,
      role: roleRow?.role || "retailer",
      balance: Number(wallet?.balance ?? 0),
      stats: {
        totalRequests: allReqs.length,
        monthRequests: monthReqs.length,
        totalSpent,
        monthSpent,
        completed: allReqs.filter((r: any) => r.status === "completed").length,
      },
      months,
      byService,
      recentRequests: allReqs.slice(0, 20),
      transactions: txns || [],
    };
  });
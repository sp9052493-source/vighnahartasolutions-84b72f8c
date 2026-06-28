import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  FileEdit,
  CreditCard,
  SlidersHorizontal,
  Landmark,
  Users,
  ShieldCheck,
  LayoutGrid,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Control Center — Vighnaharta Solutions" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

type Section = { to: string; label: string; icon: typeof LayoutGrid; exact?: boolean };
const SECTIONS: Section[] = [
  { to: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/admin/site", label: "Site & Brand", icon: Building2 },
  { to: "/admin/pages", label: "Page Content", icon: FileEdit },
  { to: "/admin/gateways", label: "Payment Gateways", icon: CreditCard },
  { to: "/manage-services", label: "Services & API", icon: SlidersHorizontal },
  { to: "/admin/sarkar-services", label: "Aaple Sarkar", icon: Landmark },
  { to: "/members", label: "Members & KYC", icon: Users },
];


function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/admin";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-hero p-5 text-primary-foreground shadow-elegant">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
          <ShieldCheck className="h-6 w-6 text-[oklch(0.82_0.17_64)]" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/65">Administrator</div>
          <h1 className="font-display text-2xl font-extrabold leading-tight">Control Center</h1>
          <p className="text-sm text-primary-foreground/75">
            Manage every public-facing setting, content block and integration from one place.
          </p>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2 shadow-card">
        {SECTIONS.map((s) => {
          const active = s.exact ? pathname === s.to : pathname.startsWith(s.to);
          return (
            <Link
              key={s.to}
              to={s.to}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </Link>
          );
        })}
      </nav>

      {isRoot ? <AdminHome /> : <Outlet />}
    </div>
  );
}

function AdminHome() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SECTIONS.filter((s) => !s.exact).map((s) => (
        <Link key={s.to} to={s.to}>
          <Card className="group h-full p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{s.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{DESC[s.to as keyof typeof DESC]}</p>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary group-hover:underline">
              Open →
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

const DESC = {
  "/admin/site": "Logo, contact email, phone, address, GST, business hours and social links.",
  "/admin/pages": "Edit About, Privacy, Terms, Refund and home hero copy live.",
  "/admin/gateways": "Configure Paytm, Razorpay and Cashfree — toggle test/live and the primary processor.",
  "/manage-services": "Service price, retailer & distributor commission, API provider and live endpoint.",
  "/admin/sarkar-services": "Aaple Sarkar certificates — pricing, descriptions, extra fields and required documents.",
  "/members": "Create accounts, change email, reset password, upload photo & KYC documents.",
} as const;


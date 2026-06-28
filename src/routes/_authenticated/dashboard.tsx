import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Wallet,
  FileText,
  Users,
  IndianRupee,
  ArrowUpRight,
  FileStack,
  Clock,
  IdCard,
  Wheat,
  CreditCard,
} from "lucide-react";
import { useMe, useMyRequests, useMyOrders, formatINR } from "@/lib/queries";
import { adminStats, adminListRequests } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Vighnaharta Solutions" }] }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  tone?: "primary" | "accent" | "success";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-[oklch(0.76_0.16_64_/_0.12)] text-[oklch(0.55_0.16_60)]"
      : tone === "success"
        ? "bg-[oklch(0.62_0.14_155_/_0.12)] text-[oklch(0.45_0.14_155)]"
        : "bg-primary/10 text-primary";
  return (
    <Card className="group relative flex items-center gap-4 overflow-hidden p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent-gradient transition-transform duration-300 group-hover:scale-x-100" />
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase leading-none tracking-[0.16em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-1.5 font-display text-[1.65rem] font-extrabold leading-[1.05] tracking-tight text-foreground tabular-nums">
          {value}
        </div>
      </div>
    </Card>
  );
}

function Dashboard() {
  const { data: me } = useMe();
  const role = me?.role ?? "retailer";

  if (role === "admin") return <AdminDashboard />;
  return <MemberDashboard greeting={me?.profile?.full_name || "Member"} balance={me?.balance ?? 0} />;
}

function AdminDashboard() {
  const statsFn = useServerFn(adminStats);
  const reqFn = useServerFn(adminListRequests);
  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const { data: requests } = useQuery({ queryKey: ["admin-requests"], queryFn: () => reqFn() });

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div className="border-b border-border/70 pb-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
          Control Center
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-foreground lg:text-[2.25rem]">
          Administrator Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          A real-time overview of the entire Vighnaharta Solutions network — members, distributors, and document activity.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Members" value={String(stats?.users ?? 0)} icon={Users} />
        <StatCard label="Distributors" value={String(stats?.distributors ?? 0)} icon={Users} tone="accent" />
        <StatCard label="Total Requests" value={String(stats?.requests ?? 0)} icon={FileText} tone="success" />
        <StatCard label="Wallet Float" value={formatINR(stats?.totalBalance ?? 0)} icon={IndianRupee} />
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">Recent Document Requests</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Latest activity across the network.</p>
          </div>
          <Link to="/members">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold uppercase tracking-wider">
              Members <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] leading-relaxed">
            <thead className="bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Member</th>
                <th className="px-6 py-3.5">Service</th>
                <th className="px-6 py-3.5">Number</th>
                <th className="px-6 py-3.5">Cost</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(requests ?? []).slice(0, 12).map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-6 py-3.5 font-semibold text-foreground">{r.user_name}</td>
                  <td className="px-6 py-3.5 text-foreground/80">{r.service_name}</td>
                  <td className="px-6 py-3.5 font-mono text-[12px] tracking-tight text-muted-foreground">{r.input_value}</td>
                  <td className="px-6 py-3.5 font-semibold tabular-nums text-foreground">{formatINR(Number(r.cost))}</td>
                  <td className="px-6 py-3.5 text-[13px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
              {(requests ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MemberDashboard({ greeting, balance }: { greeting: string; balance: number }) {
  const { data: requests } = useMyRequests();
  const { data: orders } = useMyOrders();
  const total = requests?.length ?? 0;
  const today = (requests ?? []).filter(
    (r) => new Date(r.created_at).toDateString() === new Date().toDateString(),
  ).length;
  const dlCount = (requests ?? []).filter((r) => r.service_name === "Driving License").length;
  const rationCount = (requests ?? []).filter((r) => r.service_name === "Ration Card Print").length;
  const rechargeCount = (orders ?? []).filter((o) => o.status === "success").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-hero p-7 text-primary-foreground shadow-elegant lg:p-9">
        {/* Accent flourishes */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[oklch(0.76_0.16_64_/_0.25)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[oklch(0.4_0.12_270_/_0.4)] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,oklch(0.82_0.17_64_/_0.6),transparent)]" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/75 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.82_0.17_64)]" />
              Welcome back
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight lg:text-4xl">
              {greeting}
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/65">
              Your trusted gateway to government document services.
            </p>
          </div>
          <Link to="/services">
            <Button className="gap-2 bg-accent-gradient text-[oklch(0.25_0.06_60)] shadow-lg shadow-[oklch(0.76_0.16_64_/_0.3)] transition-transform hover:-translate-y-0.5 hover:opacity-95">
              <FileStack className="h-4 w-4" /> New Request
            </Button>
          </Link>
        </div>

        <div className="relative mt-7 flex flex-wrap items-end gap-x-10 gap-y-4 border-t border-white/10 pt-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/55">
              Available Balance
            </div>
            <div className="font-display text-4xl font-extrabold tracking-tight text-[oklch(0.92_0.12_70)] lg:text-5xl">
              {formatINR(balance)}
            </div>
          </div>
          <div className="hidden h-12 w-px bg-white/10 sm:block" />
          <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
            <span className="inline-flex h-2 w-2 rounded-full bg-[oklch(0.62_0.14_155)] shadow-[0_0_12px_oklch(0.62_0.14_155)]" />
            Account verified · Live
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Requests" value={String(total)} icon={FileText} tone="primary" />
        <StatCard label="Today" value={String(today)} icon={Clock} tone="accent" />
        <StatCard label="Wallet" value={formatINR(balance)} icon={Wallet} tone="success" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="DL Transactions" value={String(dlCount)} icon={IdCard} tone="primary" />
        <StatCard label="Ration Transactions" value={String(rationCount)} icon={Wheat} tone="accent" />
        <StatCard label="Recharge Transactions" value={String(rechargeCount)} icon={CreditCard} tone="success" />
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">Recent Requests</h2>
          <Link to="/requests">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {(requests ?? []).slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <div className="font-medium">{r.service_name}</div>
                <div className="font-mono text-xs text-muted-foreground">{r.input_value}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatINR(Number(r.cost))}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>
          ))}
          {total === 0 && (
            <div className="px-5 py-10 text-center text-muted-foreground">
              No requests yet. Start with a new request.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
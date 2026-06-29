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
  TrendingUp,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CreditCard,
  ListChecks,
  Inbox,
  Landmark,
  Newspaper,
  SlidersHorizontal,
} from "lucide-react";
import { useMe, useMyRequests, useMyOrders, formatINR } from "@/lib/queries";
import { adminStats, adminListRequests } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const reqs = requests ?? [];
  const ords = orders ?? [];

  const total = reqs.length;
  const today = reqs.filter(
    (r) => new Date(r.created_at).toDateString() === new Date().toDateString(),
  ).length;
  const completed = reqs.filter((r) => r.status === "completed").length;
  const failed = reqs.filter((r) => r.status === "failed").length;
  const refunds = ords.filter((o) => o.status === "refunded").length;
  const todaySpent = reqs
    .filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString())
    .reduce((s, r) => s + Number(r.cost), 0);
  const successOrders = ords.filter((o) => o.status === "success").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Marquee / greeting strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-success" />
          नमस्कार, <span className="font-bold">{greeting}</span> — Welcome to Vighnaharta Solutions Portal.
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-success/80">
          एका दिवसात GST रजिस्ट्रेशनची हमी
        </div>
      </div>

      {/* Stat grid — balance is shown in the header; here we focus on activity */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <FastStat
          label="Today's Requests"
          value={String(today)}
          icon={FileStack}
          tone="blue"
        />
        <FastStat
          label="Success Transaction"
          value={String(completed)}
          icon={CheckCircle2}
          tone="green"
        />
        <FastStat
          label="Failed Transaction"
          value={String(failed)}
          icon={XCircle}
          tone="red"
        />
        <FastStat
          label="Refund Transaction"
          value={String(refunds)}
          icon={RotateCcw}
          tone="amber"
        />
        <FastStat
          label="Today's Spend"
          value={formatINR(todaySpent)}
          icon={TrendingUp}
          tone="rose"
        />
        <FastStat
          label="Total Txn Count"
          value={String(total + successOrders)}
          icon={ListChecks}
          tone="slate"
        />
      </div>


      {/* Transactions */}
      <Card className="overflow-hidden border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border bg-success/10 px-5 py-3">
          <h2 className="font-display text-base font-bold tracking-tight text-foreground">Transactions</h2>
          <Link to="/requests">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-semibold uppercase tracking-wider">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {reqs.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/30">
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold text-foreground">{r.service_name}</div>
                <div className="mt-0.5 font-mono text-[12px] tracking-tight text-muted-foreground">{r.input_value}</div>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-bold tabular-nums text-foreground">{formatINR(Number(r.cost))}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>
          ))}
          {total === 0 && (
            <div className="px-6 py-14 text-center">
              <FileStack className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-[14px] text-muted-foreground">No transactions yet.</p>
              <Link to="/services">
                <Button size="sm" className="mt-4 gap-2">
                  <FileStack className="h-4 w-4" /> Start a new request
                </Button>
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

type FastTone = "blue" | "rose" | "green" | "red" | "amber" | "slate";

const FAST_TONES: Record<FastTone, { tile: string; ring: string }> = {
  blue: {
    tile: "bg-[oklch(0.65_0.16_255)] text-white",
    ring: "ring-[oklch(0.65_0.16_255_/_0.18)]",
  },
  rose: {
    tile: "bg-[oklch(0.7_0.16_18)] text-white",
    ring: "ring-[oklch(0.7_0.16_18_/_0.18)]",
  },
  green: {
    tile: "bg-[oklch(0.62_0.14_155)] text-white",
    ring: "ring-[oklch(0.62_0.14_155_/_0.18)]",
  },
  red: {
    tile: "bg-[oklch(0.62_0.2_25)] text-white",
    ring: "ring-[oklch(0.62_0.2_25_/_0.18)]",
  },
  amber: {
    tile: "bg-[oklch(0.78_0.16_70)] text-[oklch(0.25_0.06_60)]",
    ring: "ring-[oklch(0.78_0.16_70_/_0.22)]",
  },
  slate: {
    tile: "bg-[oklch(0.45_0.04_260)] text-white",
    ring: "ring-[oklch(0.45_0.04_260_/_0.18)]",
  },
};

function FastStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
  tone: FastTone;
}) {
  const t = FAST_TONES[tone];
  return (
    <div className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant">
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-sm ring-4",
          t.tile,
          t.ring,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold leading-tight text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 font-display text-[1.35rem] font-extrabold leading-none tabular-nums text-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}
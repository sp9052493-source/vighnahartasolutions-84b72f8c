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
  head: () => ({ meta: [{ title: "Dashboard — Sevakart Portal" }] }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Wallet;
}) {
  return (
    <Card className="flex items-center gap-4 p-5 shadow-card">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-bold">{value}</div>
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of the entire Sevakart network.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Members" value={String(stats?.users ?? 0)} icon={Users} />
        <StatCard label="Distributors" value={String(stats?.distributors ?? 0)} icon={Users} />
        <StatCard label="Total Requests" value={String(stats?.requests ?? 0)} icon={FileText} />
        <StatCard label="Wallet Float" value={formatINR(stats?.totalBalance ?? 0)} icon={IndianRupee} />
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">Recent Document Requests</h2>
          <Link to="/members">
            <Button variant="ghost" size="sm" className="gap-1">
              Members <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Number</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(requests ?? []).slice(0, 12).map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium">{r.user_name}</td>
                  <td className="px-5 py-3">{r.service_name}</td>
                  <td className="px-5 py-3 font-mono text-xs">{r.input_value}</td>
                  <td className="px-5 py-3">{formatINR(Number(r.cost))}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
              {(requests ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
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
      <div className="overflow-hidden rounded-xl bg-hero p-6 text-primary-foreground shadow-elegant">
        <p className="text-sm text-primary-foreground/70">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold">{greeting}</h1>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-primary-foreground/60">Available Balance</div>
            <div className="font-display text-3xl font-bold">{formatINR(balance)}</div>
          </div>
          <Link to="/services" className="ml-auto">
            <Button className="gap-2 bg-accent-gradient text-[oklch(0.25_0.06_60)] hover:opacity-90">
              <FileStack className="h-4 w-4" /> New Request
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Requests" value={String(total)} icon={FileText} />
        <StatCard label="Today" value={String(today)} icon={Clock} />
        <StatCard label="Wallet" value={formatINR(balance)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="DL Transactions" value={String(dlCount)} icon={IdCard} />
        <StatCard label="Ration Transactions" value={String(rationCount)} icon={Wheat} />
        <StatCard label="Recharge Transactions" value={String(rechargeCount)} icon={CreditCard} />
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
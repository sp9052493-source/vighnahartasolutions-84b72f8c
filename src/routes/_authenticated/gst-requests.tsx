import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileCheck2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMyGstApplications } from "@/lib/gst.functions";
import { formatINR } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/gst-requests")({
  head: () => ({ meta: [{ title: "My GST Applications — Vighnaharta Solutions" }] }),
  component: GstRequestsPage,
});

const STATUS_TONE: Record<string, string> = {
  new: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  in_progress: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  query_raised: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  completed: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200",
  on_hold: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
};

function GstRequestsPage() {
  const listFn = useServerFn(listMyGstApplications);
  const { data, isLoading } = useQuery({
    queryKey: ["my-gst"],
    queryFn: () => listFn(),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My GST Applications</h1>
          <p className="text-[13px] text-muted-foreground">Track your GST Registration submissions and status.</p>
        </div>
        <Link to="/gst">
          <Button><Plus className="mr-1 h-4 w-4" /> New GST Application</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Loading…</div>
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <FileCheck2 className="h-10 w-10 text-muted-foreground/50" />
            <div className="font-semibold">No GST applications yet</div>
            <Link to="/gst"><Button>Start a New Application</Button></Link>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Application</th>
                <th className="px-4 py-2 text-left">Business</th>
                <th className="px-4 py-2 text-left">District</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Charged</th>
                <th className="px-4 py-2 text-right">Created</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.application_no}</td>
                  <td className="px-4 py-3">{r.business_name}<div className="text-[11px] text-muted-foreground">{r.applicant_name}</div></td>
                  <td className="px-4 py-3">{r.district}</td>
                  <td className="px-4 py-3"><Badge className={STATUS_TONE[r.status] || ""} variant="outline">{r.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(Number(r.total_charged || 0))}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/gst/$id" params={{ id: r.id }}><Button variant="ghost" size="sm">View</Button></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

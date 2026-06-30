import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Utensils, Plus, Pencil, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMyFssaiApplications } from "@/lib/fssai.functions";
import { formatINR, useMe } from "@/lib/queries";
import { FSSAI_STATUS_LABEL, FSSAI_STATUS_TONE, type FssaiStatus } from "@/lib/fssai.shared";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/fssai-applications")({
  head: () => ({ meta: [{ title: "My Food License Applications — Vighnaharta Solutions" }] }),
  component: Page,
});

function Page() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listMyFssaiApplications);
  const { data, isLoading } = useQuery({ queryKey: ["my-fssai"], queryFn: () => listFn() });

  useEffect(() => {
    if (!me?.id) return;
    const channel = supabase
      .channel(`fssai-self-${me.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "fssai_applications", filter: `user_id=eq.${me.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["my-fssai"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [me?.id, queryClient]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My Food License Applications</h1>
          <p className="text-[13px] text-muted-foreground">Track FSSAI license applications with live status updates.</p>
        </div>
        <Link to="/fssai"><Button><Plus className="mr-1 h-4 w-4" /> New Food License</Button></Link>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Loading…</div>
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <Utensils className="h-10 w-10 text-muted-foreground/50" />
            <div className="font-semibold">No Food License applications yet</div>
            <Link to="/fssai"><Button>Start a New Application</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Application</th>
                  <th className="px-4 py-2 text-left">Business</th>
                  <th className="px-4 py-2 text-left">License</th>
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
                    <td className="px-4 py-3">
                      {r.business_name || "—"}
                      <div className="text-[11px] text-muted-foreground">{r.applicant_name}</div>
                    </td>
                    <td className="px-4 py-3">{r.license_type || "—"}</td>
                    <td className="px-4 py-3">{r.business_district || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={FSSAI_STATUS_TONE[r.status as FssaiStatus]}>
                        {FSSAI_STATUS_LABEL[r.status as FssaiStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatINR(Number(r.total_charged || 0))}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/fssai" search={{ id: r.id }}>
                        <Button variant="ghost" size="sm">{r.status === "draft" ? "Continue" : "View"}</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

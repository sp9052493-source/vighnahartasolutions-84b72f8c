import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Plus, Pencil, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listMyUdyamApplications } from "@/lib/udyam.functions";
import { formatINR, useMe } from "@/lib/queries";
import { UDYAM_STATUS_LABEL, UDYAM_STATUS_TONE, type UdyamStatus } from "@/lib/udyam.shared";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/udyam-applications")({
  head: () => ({ meta: [{ title: "My Udyam Applications — Vighnaharta Solutions" }] }),
  component: Page,
});

function Page() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listMyUdyamApplications);
  const { data, isLoading } = useQuery({ queryKey: ["my-udyam"], queryFn: () => listFn() });

  // Realtime updates for this user's applications
  useEffect(() => {
    if (!me?.id) return;
    const channel = supabase
      .channel(`udyam-self-${me.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "udyam_applications", filter: `user_id=eq.${me.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["my-udyam"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me?.id, queryClient]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">My Udyam Applications</h1>
          <p className="text-[13px] text-muted-foreground">Track Udyam Aadhaar registrations and live status updates.</p>
        </div>
        <Link to="/udyam">
          <Button><Plus className="mr-1 h-4 w-4" /> New Udyam Application</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">Loading…</div>
        ) : !data?.length ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/50" />
            <div className="font-semibold">No Udyam applications yet</div>
            <Link to="/udyam"><Button>Start a New Application</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="px-4 py-3">
                      {r.business_name || "—"}
                      <div className="text-[11px] text-muted-foreground">{r.name_as_aadhaar}</div>
                    </td>
                    <td className="px-4 py-3">{r.district || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={UDYAM_STATUS_TONE[r.status as UdyamStatus]}>
                        {UDYAM_STATUS_LABEL[r.status as UdyamStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatINR(Number(r.total_charged || 0))}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/udyam" search={{ id: r.id }}>
                        {r.status === "draft" ? (
                          <Button variant="outline" size="sm" className="border-amber-400/60 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-200">
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit Draft
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                          </Button>
                        )}
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

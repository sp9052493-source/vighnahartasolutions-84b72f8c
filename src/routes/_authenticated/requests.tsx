import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useMyRequests, formatINR } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentDialog } from "@/components/portal/DocumentDialog";
import { DocumentDownloadButton } from "@/components/portal/DocumentDownloadButton";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "My Requests — Sevakart Portal" }] }),
  component: Requests,
});

function Requests() {
  const { data: requests } = useMyRequests();
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Requests</h1>
        <p className="text-sm text-muted-foreground">All documents you have fetched.</p>
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Number</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(requests ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium">{r.service_name}</td>
                  <td className="px-5 py-3 font-mono text-xs">{r.input_value}</td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className="border-success/30 bg-success/10 text-success capitalize"
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">{formatINR(Number(r.cost))}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>
                        View
                      </Button>
                      {r.status === "completed" && (r as any).document_url && (
                        <DocumentDownloadButton requestId={r.id} hasFile={!!(r as any).document_url} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(requests ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DocumentDialog request={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  IdCard,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  FileText,
} from "lucide-react";
import { useMyRequests, useMe, formatINR } from "@/lib/queries";
import { fetchPanDetails } from "@/lib/pan.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/pan-details")({
  head: () => ({ meta: [{ title: "PAN Details — Vighnaharta Solutions" }] }),
  component: PanDetailsPage,
});

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

type PanResult = {
  pan: string;
  fields: Record<string, string>;
  message: string;
  reference: string;
};

function PanDetailsPage() {
  const { data: me } = useMe();
  const { data: requests } = useMyRequests();
  const queryClient = useQueryClient();

  const [pan, setPan] = useState("");
  const [result, setResult] = useState<PanResult | null>(null);

  const panRequests = (requests ?? []).filter((r) => r.service_name === "PAN Details");

  const fn = useServerFn(fetchPanDetails);
  const mutation = useMutation({
    mutationFn: (vars: { pan_no: string }) => fn({ data: vars }),
    onSuccess: (res: any) => {
      setResult({
        pan: res.pan,
        fields: res.fields ?? {},
        message: res.message,
        reference: res.reference,
      });
      toast.success("PAN details fetched");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: (e: any) => {
      console.error("[PAN-DETAILS] request error:", e?.message);
      toast.error(e?.message || "Request failed");
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = pan.replace(/\s+/g, "").toUpperCase();
    if (!PAN_REGEX.test(cleaned)) {
      toast.error("Invalid PAN format. Expected 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F).");
      return;
    }
    setResult(null);
    mutation.mutate({ pan_no: cleaned });
  }

  function copyPan() {
    if (!result?.pan) return;
    navigator.clipboard.writeText(result.pan);
    toast.success("PAN number copied");
  }

  const cleaned = pan.replace(/\s+/g, "").toUpperCase();
  const isValid = PAN_REGEX.test(cleaned);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.7_0.16_55)] to-[oklch(0.62_0.16_45)] text-primary-foreground shadow-sm">
          <IdCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">PAN Details</h1>
          <p className="text-sm text-muted-foreground">
            Verify any PAN and fetch the full holder details. The fee is deducted from your wallet —
            current balance{" "}
            <span className="font-semibold text-primary">{formatINR(me?.balance ?? 0)}</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 shadow-card lg:col-span-3">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pan">PAN Number</Label>
              <Input
                id="pan"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="e.g. ABCDE1234F"
                autoFocus
                required
                maxLength={10}
                className="font-mono tracking-widest uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Format: 5 letters, 4 digits, 1 letter.{" "}
                {cleaned.length > 0 && !isValid && (
                  <span className="text-destructive">Invalid format.</span>
                )}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending || !isValid}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching PAN details…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Fetch PAN Details
                </>
              )}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col p-6 shadow-card lg:col-span-2">
          {mutation.isPending && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Verifying PAN with the income-tax department…</p>
            </div>
          )}

          {!mutation.isPending && mutation.isError && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <AlertCircle className="h-9 w-9 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {(mutation.error as any)?.message || "Request failed"}
              </p>
              <p className="text-xs text-muted-foreground">No amount has been charged.</p>
            </div>
          )}

          {!mutation.isPending && result && (
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-success">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div className="text-sm font-medium">{result.message}</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">PAN Number</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-xl font-bold tracking-widest">{result.pan}</span>
                  <Button size="icon" variant="ghost" onClick={copyPan} title="Copy PAN">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 rounded-lg border border-border p-4 text-sm">
                {Object.entries(result.fields)
                  .filter(([k]) => k !== "PAN Number")
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-right">{v}</span>
                    </div>
                  ))}
                {Object.keys(result.fields).filter((k) => k !== "PAN Number").length === 0 && (
                  <p className="text-xs text-muted-foreground">No additional details returned.</p>
                )}
              </div>
              <div className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground">
                Transaction ID: <span className="font-semibold text-foreground">{result.reference}</span>
              </div>
            </div>
          )}

          {!mutation.isPending && !mutation.isError && !result && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
              <IdCard className="h-9 w-9 opacity-40" />
              <p className="text-sm">The verified PAN details will appear here.</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Search History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">PAN</th>
                <th className="px-5 py-3">Holder</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {panRequests.map((r) => {
                const fields = (r.result_data as any)?.fields ?? {};
                const holder = fields["Full Name"] || fields["First Name"] || "—";
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-mono text-xs">{r.input_value ?? "—"}</td>
                    <td className="px-5 py-3">{holder}</td>
                    <td className="px-5 py-3">
                      {r.status === "completed" ? (
                        <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                          Failed
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">{formatINR(Number(r.cost))}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
              {panRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No PAN lookups yet.
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

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CreditCard,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  IdCard,
} from "lucide-react";
import { useMyRequests, useMe, formatINR } from "@/lib/queries";
import { findPanFromAadhaar } from "@/lib/pan.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/aadhaar-to-pan")({
  head: () => ({ meta: [{ title: "Aadhaar to PAN Finder — Vighnaharta Solutions" }] }),
  component: AadhaarToPan,
});

type PanResult = {
  panNumber: string;
  holderName: string;
  message: string;
  reference: string;
};

function AadhaarToPan() {
  const { data: me } = useMe();
  const { data: requests } = useMyRequests();
  const queryClient = useQueryClient();

  const [aadhaar, setAadhaar] = useState("");
  const [result, setResult] = useState<PanResult | null>(null);

  const panRequests = (requests ?? []).filter((r) => r.service_name === "Aadhaar to PAN");

  const panFn = useServerFn(findPanFromAadhaar);
  const mutation = useMutation({
    mutationFn: (vars: { aadhaar_no: string }) => panFn({ data: vars }),
    onSuccess: (res: any) => {
      setResult({
        panNumber: res.panNumber,
        holderName: res.holderName,
        message: res.message,
        reference: res.reference,
      });
      toast.success("PAN found successfully");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: (e: any) => {
      console.error("[PAN] request error:", e?.message);
      toast.error(e?.message || "Request failed");
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = aadhaar.replace(/\D/g, "");
    if (cleaned.length !== 12) {
      toast.error("Aadhaar number must be exactly 12 digits");
      return;
    }
    setResult(null);
    mutation.mutate({ aadhaar_no: cleaned });
  }

  function copyPan() {
    if (!result?.panNumber) return;
    navigator.clipboard.writeText(result.panNumber);
    toast.success("PAN number copied");
  }

  const digits = aadhaar.replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)] text-primary-foreground shadow-sm">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Aadhaar to PAN Finder</h1>
          <p className="text-sm text-muted-foreground">
            Find the PAN number linked to an Aadhaar number. The fee is deducted from your wallet —
            current balance{" "}
            <span className="font-semibold text-primary">{formatINR(me?.balance ?? 0)}</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 shadow-card lg:col-span-3">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="aadhaar">Aadhaar Number</Label>
              <Input
                id="aadhaar"
                value={aadhaar}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 12);
                  // Format as XXXX XXXX XXXX for readability
                  setAadhaar(d.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
                }}
                placeholder="e.g. 1234 5678 9012"
                inputMode="numeric"
                autoFocus
                required
                className="font-mono tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                {digits.length}/12 digits entered.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending || digits.length !== 12}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding PAN…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Find PAN
                </>
              )}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col p-6 shadow-card lg:col-span-2">
          {mutation.isPending && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Searching PAN records…</p>
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
                  <span className="font-mono text-xl font-bold tracking-widest">{result.panNumber}</span>
                  <Button size="icon" variant="ghost" onClick={copyPan} title="Copy PAN">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {result.holderName && (
                <div className="rounded-lg border border-border px-4 py-2 text-sm">
                  <span className="text-muted-foreground">Holder Name: </span>
                  <span className="font-semibold">{result.holderName}</span>
                </div>
              )}
              <div className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground">
                Transaction ID: <span className="font-semibold text-foreground">{result.reference}</span>
              </div>
            </div>
          )}

          {!mutation.isPending && !mutation.isError && !result && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
              <IdCard className="h-9 w-9 opacity-40" />
              <p className="text-sm">The discovered PAN details will appear here.</p>
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
                <th className="px-5 py-3">Aadhaar</th>
                <th className="px-5 py-3">PAN Number</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {panRequests.map((r) => {
                const pan = (r.result_data as any)?.fields?.["PAN Number"] as string | undefined;
                const masked = r.input_value ? `XXXX XXXX ${String(r.input_value).slice(-4)}` : "—";
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-mono text-xs">{masked}</td>
                    <td className="px-5 py-3 font-mono text-xs">{pan ?? "—"}</td>
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
                    <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No PAN searches yet.
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
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Wallet as WalletIcon,
  Loader2,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useMe, useMyOrders, formatINR } from "@/lib/queries";
import { createRechargeOrder } from "@/lib/recharge.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/recharge")({
  head: () => ({ meta: [{ title: "Wallet Recharge — Vighnaharta Solutions" }] }),
  component: Recharge,
});

const QUICK = [100, 200, 500, 1000, 2000, 5000];

function StatusBadge({ status }: { status: string }) {
  if (status === "success")
    return (
      <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
        <CheckCircle2 className="h-3 w-3" /> Success
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge variant="outline" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
        <XCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

function Recharge() {
  const { data: me } = useMe();
  const { data: orders } = useMyOrders();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");

  // Handle the Paytm callback redirect (?recharge=success|failed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("recharge");
    if (!status) return;
    if (status === "success") {
      toast.success("Wallet recharged successfully!");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    } else {
      toast.error("Recharge failed or was cancelled. No amount was deducted.");
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [queryClient]);

  const createFn = useServerFn(createRechargeOrder);
  const mutation = useMutation({
    mutationFn: (vars: { amount: number }) => createFn({ data: vars }),
    onSuccess: (res: any) => {
      console.log("[RECHARGE] order created:", { orderId: res?.orderId, amount: res?.amount });
      if (!res?.paymentUrl) {
        toast.error("Could not start payment. Please try again.");
        return;
      }
      toast.message("Redirecting to Paytm…");
      window.location.href = res.paymentUrl;
    },
    onError: (e: any) => {
      console.error("[RECHARGE] error:", e?.message);
      toast.error(e?.message || "Could not start recharge");
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value < 10) {
      toast.error("Enter an amount of at least ₹10");
      return;
    }
    if (value > 100000) {
      toast.error("Maximum recharge is ₹1,00,000");
      return;
    }
    mutation.mutate({ amount: value });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)] text-primary-foreground shadow-sm">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Wallet Recharge</h1>
          <p className="text-sm text-muted-foreground">
            Add money to your wallet securely via Paytm. Current balance{" "}
            <span className="font-semibold text-primary">{formatINR(me?.balance ?? 0)}</span>.
          </p>
        </div>
      </div>

      <Card className="flex items-center gap-5 bg-hero p-6 text-primary-foreground shadow-elegant">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15">
          <WalletIcon className="h-7 w-7" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-primary-foreground/60">Current Balance</div>
          <div className="font-display text-4xl font-bold">{formatINR(me?.balance ?? 0)}</div>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="amount">Recharge Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              min={10}
              max={100000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
              className="text-lg font-semibold"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <Button
                key={q}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(q))}
              >
                ₹{q}
              </Button>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating secure order…
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" /> Proceed to Pay
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You will be redirected to Paytm to complete the payment securely.
          </p>
        </form>
      </Card>

      <Card className="overflow-hidden shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Recharge History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(orders ?? []).map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-mono text-xs">{o.order_id}</td>
                  <td className="px-5 py-3 font-medium">{formatINR(Number(o.amount))}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {(orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                    <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No recharge orders yet.
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

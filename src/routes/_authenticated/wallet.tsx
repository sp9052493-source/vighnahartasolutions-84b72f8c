import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Wallet as WalletIcon } from "lucide-react";
import { useMe, useMyTransactions, formatINR } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Vighnaharta Solutions" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { data: me } = useMe();
  const { data: txns } = useMyTransactions();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground">
          Top-ups are added by your administrator. Service fees are deducted automatically.
        </p>
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

      <Card className="overflow-hidden shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Transaction History</h2>
        </div>
        <div className="divide-y divide-border">
          {(txns ?? []).map((t) => {
            const credit = Number(t.amount) >= 0;
            return (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    credit ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.description}</div>
                  <div className="text-xs capitalize text-muted-foreground">
                    {t.type} · {new Date(t.created_at).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      credit ? "text-success" : "text-destructive",
                    )}
                  >
                    {credit ? "+" : ""}
                    {formatINR(Number(t.amount))}
                  </div>
                  <div className="text-xs text-muted-foreground">Bal {formatINR(Number(t.balance_after))}</div>
                </div>
              </div>
            );
          })}
          {(txns ?? []).length === 0 && (
            <div className="px-5 py-12 text-center text-muted-foreground">No transactions yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, IdCard, Fingerprint, Vote, BookUser, Loader2 } from "lucide-react";
import { useServices, useMe, formatINR } from "@/lib/queries";
import { processDocumentRequest } from "@/lib/portal.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentDialog } from "@/components/portal/DocumentDialog";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({ meta: [{ title: "Services — Vighnaharta Solutions" }] }),
  component: Services,
});

const ICONS: Record<string, typeof CreditCard> = {
  DL: CreditCard,
  PAN: IdCard,
  AADHAAR: Fingerprint,
  VOTER: Vote,
  PASSPORT: BookUser,
};

const TONES: Record<string, string> = {
  DL: "from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]",
  PAN: "from-[oklch(0.7_0.16_55)] to-[oklch(0.62_0.16_45)]",
  AADHAAR: "from-[oklch(0.6_0.15_155)] to-[oklch(0.5_0.13_160)]",
  VOTER: "from-[oklch(0.58_0.18_25)] to-[oklch(0.5_0.16_20)]",
  PASSPORT: "from-[oklch(0.5_0.13_300)] to-[oklch(0.42_0.12_295)]",
};

function Services() {
  const { data: services } = useServices();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<any | null>(null);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<any | null>(null);

  const processFn = useServerFn(processDocumentRequest);
  const mutation = useMutation({
    mutationFn: (vars: { serviceId: string; inputValue: string }) => processFn({ data: vars }),
    onSuccess: (res) => {
      toast.success("Document fetched successfully");
      setActive(null);
      setValue("");
      setResult(res.request);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: (e: any) => toast.error(e?.message || "Request failed"),
  });

  const activeServices = (services ?? []).filter((s) => s.active);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">
            Service Catalogue
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
            Services
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fee is debited from your wallet. Current balance{" "}
            <span className="font-semibold text-primary">{formatINR(me?.balance ?? 0)}</span>.
          </p>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Dashboard
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {activeServices.map((s) => {
          const Icon = ICONS[s.code] ?? CreditCard;
          const tone = TONES[s.code] ?? "from-primary to-[oklch(0.26_0.08_262)]";
          return (
            <button
              key={s.id}
              onClick={() => {
                setActive(s);
                setValue("");
              }}
              className="group relative flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
            >
              <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${tone} text-primary-foreground shadow-md ring-4 ring-background`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="font-display text-[13px] font-bold leading-tight text-foreground">
                  {s.name}
                </div>
                <div className="inline-block rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                  {formatINR(Number(s.price))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{active?.name}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!active) return;
              mutation.mutate({ serviceId: active.id, inputValue: value.trim() });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="num">{active?.input_label}</Label>
              <Input
                id="num"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter ${active?.input_label}`}
                autoFocus
                maxLength={40}
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Service fee</span>
              <span className="font-semibold">{formatINR(Number(active?.price ?? 0))}</span>
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch & Pay
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DocumentDialog request={result} onOpenChange={(o) => !o && setResult(null)} />
    </div>
  );
}
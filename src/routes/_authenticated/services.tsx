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
  head: () => ({ meta: [{ title: "Services — Sevakart Portal" }] }),
  component: Services,
});

const ICONS: Record<string, typeof CreditCard> = {
  DL: CreditCard,
  PAN: IdCard,
  AADHAAR: Fingerprint,
  VOTER: Vote,
  PASSPORT: BookUser,
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Services</h1>
        <p className="text-sm text-muted-foreground">
          Enter a number to fetch the record. The fee is deducted from your wallet — current balance{" "}
          <span className="font-semibold text-primary">{formatINR(me?.balance ?? 0)}</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeServices.map((s) => {
          const Icon = ICONS[s.code] ?? CreditCard;
          return (
            <Card key={s.id} className="flex flex-col p-5 shadow-card transition-shadow hover:shadow-elegant">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  {formatINR(Number(s.price))}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description}</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setActive(s);
                  setValue("");
                }}
              >
                Request now
              </Button>
            </Card>
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
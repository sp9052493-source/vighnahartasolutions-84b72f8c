import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useServices } from "@/lib/queries";
import { adminUpdateService } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/manage-services")({
  head: () => ({ meta: [{ title: "Service Pricing — Sevakart Portal" }] }),
  component: ManageServices,
});

function ManageServices() {
  const { data: services } = useServices();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service Pricing</h1>
        <p className="text-sm text-muted-foreground">
          Set the fee charged per request and the commission paid to distributors.
        </p>
      </div>
      <div className="space-y-4">
        {(services ?? []).map((s) => (
          <ServiceRow key={s.id} service={s} />
        ))}
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: any }) {
  const updateFn = useServerFn(adminUpdateService);
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(service.price));
  const [rc, setRc] = useState(String(service.retailer_commission));
  const [dc, setDc] = useState(String(service.distributor_commission));
  const [active, setActive] = useState(service.active);

  useEffect(() => {
    setPrice(String(service.price));
    setRc(String(service.retailer_commission));
    setDc(String(service.distributor_commission));
    setActive(service.active);
  }, [service]);

  const mut = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: service.id,
          price: Number(price),
          retailer_commission: Number(rc),
          distributor_commission: Number(dc),
          active,
        },
      }),
    onSuccess: () => {
      toast.success(`${service.name} updated`);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <Card className="p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{service.name}</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor={`a-${service.id}`} className="text-sm text-muted-foreground">
            Active
          </Label>
          <Switch id={`a-${service.id}`} checked={active} onCheckedChange={setActive} />
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Fee (₹)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Retailer commission (₹)</Label>
          <Input type="number" value={rc} onChange={(e) => setRc(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Distributor commission (₹)</Label>
          <Input type="number" value={dc} onChange={(e) => setDc(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </Card>
  );
}
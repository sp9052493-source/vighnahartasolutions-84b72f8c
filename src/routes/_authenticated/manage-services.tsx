import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plug, Wifi, WifiOff } from "lucide-react";
import { useServices } from "@/lib/queries";
import { adminUpdateService } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/manage-services")({
  head: () => ({ meta: [{ title: "Service Pricing — Sevakart Portal" }] }),
  component: ManageServices,
});

function ManageServices() {
  const { data: services } = useServices();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services &amp; API Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Set the fee &amp; commissions, and connect a live API provider for each document service.
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

const PROVIDERS = [
  { value: "demo", label: "Demo (sample data)" },
  { value: "surepass", label: "Surepass" },
  { value: "cashfree", label: "Cashfree" },
  { value: "signzy", label: "Signzy" },
  { value: "custom", label: "Custom API" },
];

function ServiceRow({ service }: { service: any }) {
  const updateFn = useServerFn(adminUpdateService);
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(String(service.price));
  const [rc, setRc] = useState(String(service.retailer_commission));
  const [dc, setDc] = useState(String(service.distributor_commission));
  const [active, setActive] = useState(service.active);
  const [apiProvider, setApiProvider] = useState(service.api_provider || "demo");
  const [apiEndpoint, setApiEndpoint] = useState(service.api_endpoint || "");
  const [apiEnabled, setApiEnabled] = useState(service.api_enabled || false);
  const [apiNotes, setApiNotes] = useState(service.api_notes || "");

  useEffect(() => {
    setPrice(String(service.price));
    setRc(String(service.retailer_commission));
    setDc(String(service.distributor_commission));
    setActive(service.active);
    setApiProvider(service.api_provider || "demo");
    setApiEndpoint(service.api_endpoint || "");
    setApiEnabled(service.api_enabled || false);
    setApiNotes(service.api_notes || "");
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
          api_provider: apiProvider,
          api_endpoint: apiEndpoint.trim(),
          api_enabled: apiEnabled,
          api_notes: apiNotes.trim(),
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
        <div className="flex items-center gap-2.5">
          <h3 className="font-display text-lg font-semibold">{service.name}</h3>
          <Badge
            variant="outline"
            className={
              apiEnabled
                ? "gap-1 border-success/30 bg-success/10 text-success"
                : "gap-1 border-border bg-muted text-muted-foreground"
            }
          >
            {apiEnabled ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {apiEnabled ? "Live API" : "Demo"}
          </Badge>
        </div>
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

      <Separator className="my-5" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Plug className="h-4 w-4 text-primary" /> API Provider
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`api-${service.id}`} className="text-sm text-muted-foreground">
            Live mode
          </Label>
          <Switch id={`api-${service.id}`} checked={apiEnabled} onCheckedChange={setApiEnabled} />
        </div>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Provider</Label>
          <Select value={apiProvider} onValueChange={setApiProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">API endpoint URL</Label>
          <Input
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://api.provider.com/verify"
          />
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <Label className="text-xs">Notes (internal)</Label>
        <Input value={apiNotes} onChange={(e) => setApiNotes(e.target.value)} placeholder="Optional notes" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        When Live mode is on, requests are sent to this endpoint. The secret API key is stored securely on the
        server (KYC_API_KEY) and never shown here.
      </p>

      <div className="mt-5 flex justify-end">
        <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </Card>
  );
}
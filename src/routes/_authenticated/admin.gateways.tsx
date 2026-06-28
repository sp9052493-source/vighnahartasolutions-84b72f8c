import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save, Star, KeyRound, Info } from "lucide-react";
import { adminListGateways, adminUpdateGateway } from "@/lib/site.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_authenticated/admin/gateways")({
  head: () => ({ meta: [{ title: "Payment Gateways — Admin" }] }),
  component: AdminGateways,
});

function AdminGateways() {
  const listFn = useServerFn(adminListGateways);
  const { data } = useQuery({ queryKey: ["admin-gateways"], queryFn: () => listFn() });

  return (
    <div className="space-y-4">
      <Card className="flex items-start gap-3 border-primary/30 bg-primary/5 p-4">
        <Info className="mt-0.5 h-5 w-5 text-primary" />
        <div className="text-sm">
          <strong>Secret keys are stored securely as backend secrets</strong> — the field below shows only the
          secret name. To set or rotate the actual secret value, ask Lovable to update the named secret.
        </div>
      </Card>
      {(data || []).map((g: any) => (
        <GatewayCard key={g.provider} gateway={g} />
      ))}
    </div>
  );
}

function GatewayCard({ gateway }: { gateway: any }) {
  const updateFn = useServerFn(adminUpdateGateway);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(gateway);

  useEffect(() => setForm(gateway), [gateway]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          provider: form.provider,
          mode: form.mode,
          enabled: form.enabled,
          is_primary: form.is_primary,
          merchant_id: form.merchant_id,
          key_id_public: form.key_id_public,
          webhook_url: form.webhook_url,
          secret_key_name: form.secret_key_name,
        },
      }),
    onSuccess: () => {
      toast.success(`${form.display_name} updated`);
      queryClient.invalidateQueries({ queryKey: ["admin-gateways"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <Card className="p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-bold">{form.display_name}</h3>
          {form.is_primary && (
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <Star className="h-3 w-3" /> Primary
            </Badge>
          )}
          <Badge
            variant="outline"
            className={
              form.enabled
                ? "border-success/30 bg-success/10 text-success"
                : "border-border bg-muted text-muted-foreground"
            }
          >
            {form.enabled ? "Active" : "Disabled"}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {form.mode} mode
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Active</Label>
            <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Primary</Label>
            <Switch checked={form.is_primary} onCheckedChange={(v) => set("is_primary", v)} />
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Mode</Label>
          <Select value={form.mode} onValueChange={(v) => set("mode", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test">Test / Sandbox</SelectItem>
              <SelectItem value="live">Live / Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Merchant ID</Label>
          <Input value={form.merchant_id || ""} onChange={(e) => set("merchant_id", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Public Key / Key ID</Label>
          <Input value={form.key_id_public || ""} onChange={(e) => set("key_id_public", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1">
            <KeyRound className="h-3 w-3" /> Secret key (stored as backend secret)
          </Label>
          <Input value={form.secret_key_name || ""} onChange={(e) => set("secret_key_name", e.target.value)} placeholder="e.g. RAZORPAY_KEY_SECRET" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">Webhook URL</Label>
          <Input
            value={form.webhook_url || ""}
            onChange={(e) => set("webhook_url", e.target.value)}
            placeholder="https://yourdomain.com/api/public/..."
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="gap-2">
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save {form.display_name}
        </Button>
      </div>
    </Card>
  );
}

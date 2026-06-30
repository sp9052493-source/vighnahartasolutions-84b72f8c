import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Utensils } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getFssaiConfig, adminSaveFssaiConfig } from "@/lib/fssai.functions";

export const Route = createFileRoute("/_authenticated/admin/fssai-settings")({
  head: () => ({ meta: [{ title: "Food License (FSSAI) Settings — Admin" }] }),
  component: Page,
});

function Page() {
  const getFn = useServerFn(getFssaiConfig);
  const saveFn = useServerFn(adminSaveFssaiConfig);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["fssai-config"], queryFn: () => getFn() });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data && !form) setForm({ ...data }); }, [data, form]);

  const mut = useMutation({
    mutationFn: () => saveFn({
      data: {
        id: form.id,
        basic_price: Number(form.basic_price),
        state_price: Number(form.state_price),
        central_price: Number(form.central_price),
        distributor_commission: Number(form.distributor_commission),
        instructions: form.instructions || "", active: !!form.active,
      },
    }),
    onSuccess: () => { toast.success("FSSAI settings saved"); qc.invalidateQueries({ queryKey: ["fssai-config"] }); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  if (isLoading || !form) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Utensils className="h-6 w-6" /> Food License (FSSAI) Settings
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Configure per-license-type pricing, commission and instructions for the Food License service.
          </p>
        </div>
        <Badge variant="outline" className={form.active ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}>
          {form.active ? "Active" : "Disabled"}
        </Badge>
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Basic License Price (₹)</Label>
            <Input type="number" min={0} value={form.basic_price}
              onChange={(e) => setForm({ ...form, basic_price: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>State License Price (₹)</Label>
            <Input type="number" min={0} value={form.state_price}
              onChange={(e) => setForm({ ...form, state_price: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Central License Price (₹)</Label>
            <Input type="number" min={0} value={form.central_price}
              onChange={(e) => setForm({ ...form, central_price: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Distributor Commission (₹)</Label>
            <Input type="number" min={0} value={form.distributor_commission}
              onChange={(e) => setForm({ ...form, distributor_commission: e.target.value })} />
          </div>
          <div className="flex items-center gap-3 pt-6 sm:col-span-2">
            <Switch checked={!!form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Service is active for retailers</Label>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Instructions</Label>
          <Textarea rows={8} value={form.instructions || ""}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}

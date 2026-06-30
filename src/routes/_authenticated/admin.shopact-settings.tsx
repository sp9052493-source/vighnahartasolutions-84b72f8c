import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getShopactConfig, adminSaveShopactConfig } from "@/lib/shopact.functions";

export const Route = createFileRoute("/_authenticated/admin/shopact-settings")({
  head: () => ({ meta: [{ title: "Shop Act Settings — Admin" }] }),
  component: Page,
});

function Page() {
  const getFn = useServerFn(getShopactConfig);
  const saveFn = useServerFn(adminSaveShopactConfig);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["shopact-config"], queryFn: () => getFn() });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data && !form) setForm({ ...data }); }, [data, form]);

  const mut = useMutation({
    mutationFn: () => saveFn({
      data: {
        id: form.id, price: Number(form.price),
        distributor_commission: Number(form.distributor_commission),
        instructions: form.instructions || "", active: !!form.active,
      },
    }),
    onSuccess: () => { toast.success("Shop Act settings saved"); qc.invalidateQueries({ queryKey: ["shopact-config"] }); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  if (isLoading || !form) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" /> Shop Act Settings
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Configure price, commission and instructions for the Shop Act Registration service.
          </p>
        </div>
        <Badge variant="outline" className={form.active ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}>
          {form.active ? "Active" : "Disabled"}
        </Badge>
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Service Price (₹)</Label>
            <Input type="number" min={0} value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} />
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

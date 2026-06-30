import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getUdyamConfig, adminSaveUdyamConfig } from "@/lib/udyam.functions";

export const Route = createFileRoute("/_authenticated/admin/udyam-settings")({
  head: () => ({ meta: [{ title: "Udyam Aadhaar Settings — Admin" }] }),
  component: AdminUdyamConfigPage,
});

function AdminUdyamConfigPage() {
  const getFn = useServerFn(getUdyamConfig);
  const saveFn = useServerFn(adminSaveUdyamConfig);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["udyam-config"], queryFn: () => getFn() });

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (data && !form) setForm({ ...data }); }, [data, form]);

  const mut = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          id: form.id,
          service_charge: Number(form.service_charge),
          govt_fee: Number(form.govt_fee),
          active: !!form.active,
          turnaround_text: form.turnaround_text,
          instructions_en: form.instructions_en,
          instructions_mr: form.instructions_mr,
        },
      }),
    onSuccess: () => {
      toast.success("Udyam settings saved");
      qc.invalidateQueries({ queryKey: ["udyam-config"] });
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  if (isLoading || !form) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const total = Number(form.service_charge || 0) + Number(form.govt_fee || 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" /> Udyam Aadhaar Settings
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Configure pricing, availability, turnaround and on-form instructions for the Udyam Aadhaar Registration service.
          </p>
        </div>
        <Badge variant="outline" className={form.active ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"}>
          {form.active ? "Active" : "Disabled"}
        </Badge>
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Service Charge (₹)</Label>
            <Input type="number" min={0} value={form.service_charge}
              onChange={(e) => setForm({ ...form, service_charge: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Government Fee (₹)</Label>
            <Input type="number" min={0} value={form.govt_fee}
              onChange={(e) => setForm({ ...form, govt_fee: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Turnaround Text</Label>
            <Input value={form.turnaround_text}
              onChange={(e) => setForm({ ...form, turnaround_text: e.target.value })} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={!!form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Service is active for retailers</Label>
          </div>
        </div>

        <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-[13px]">
          <span className="text-muted-foreground">Total charged to retailer wallet: </span>
          <span className="font-display font-bold tabular-nums">₹{total.toFixed(2)}</span>
          <span className="ml-1 text-muted-foreground">(service + govt fee)</span>
        </div>

        <div className="space-y-1.5">
          <Label>Instructions (English)</Label>
          <Textarea rows={10} value={form.instructions_en}
            onChange={(e) => setForm({ ...form, instructions_en: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Instructions (Marathi)</Label>
          <Textarea rows={6} value={form.instructions_mr}
            onChange={(e) => setForm({ ...form, instructions_mr: e.target.value })} />
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

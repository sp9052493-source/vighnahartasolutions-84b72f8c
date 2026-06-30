import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getGstConfig, adminSaveGstConfig } from "@/lib/gst.functions";

export const Route = createFileRoute("/_authenticated/admin/gst")({
  head: () => ({ meta: [{ title: "GST Settings — Admin" }] }),
  component: AdminGstConfigPage,
});

function AdminGstConfigPage() {
  const getFn = useServerFn(getGstConfig);
  const saveFn = useServerFn(adminSaveGstConfig);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["gst-config"], queryFn: () => getFn() });

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
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["gst-config"] }); },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  if (isLoading || !form) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">GST Registration Settings</h1>
        <p className="text-[13px] text-muted-foreground">Tune service charge, government fee, instructions and availability.</p>
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Service Charge (₹)</Label>
            <Input type="number" value={form.service_charge} onChange={(e) => setForm({ ...form, service_charge: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Government Fee (₹)</Label>
            <Input type="number" value={form.govt_fee} onChange={(e) => setForm({ ...form, govt_fee: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Turnaround Text</Label>
            <Input value={form.turnaround_text} onChange={(e) => setForm({ ...form, turnaround_text: e.target.value })} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={!!form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            <Label>Service is active for retailers</Label>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Instructions (English)</Label>
          <Textarea rows={10} value={form.instructions_en} onChange={(e) => setForm({ ...form, instructions_en: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Instructions (Marathi)</Label>
          <Textarea rows={6} value={form.instructions_mr} onChange={(e) => setForm({ ...form, instructions_mr: e.target.value })} />
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

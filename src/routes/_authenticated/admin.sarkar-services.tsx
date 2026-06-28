import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  ShieldCheck,
  Landmark,
  IndianRupee,
  FileText,
  GripVertical,
} from "lucide-react";
import {
  adminListSarkarServices,
  adminCreateSarkarService,
  adminUpdateSarkarService,
  adminDeleteSarkarService,
  adminToggleSarkarService,
} from "@/lib/sarkar-services.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/sarkar-services")({
  head: () => ({ meta: [{ title: "Aaple Sarkar Services — Admin" }] }),
  component: AdminSarkarServices,
});

const TONE_PRESETS = [
  { label: "Indigo", value: "from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]" },
  { label: "Emerald", value: "from-[oklch(0.6_0.15_155)] to-[oklch(0.5_0.13_160)]" },
  { label: "Saffron", value: "from-[oklch(0.7_0.16_55)] to-[oklch(0.62_0.16_45)]" },
  { label: "Crimson", value: "from-[oklch(0.58_0.18_25)] to-[oklch(0.5_0.16_20)]" },
  { label: "Violet", value: "from-[oklch(0.5_0.13_300)] to-[oklch(0.42_0.12_295)]" },
  { label: "Sunset", value: "from-[oklch(0.6_0.16_20)] to-[oklch(0.5_0.14_15)]" },
  { label: "Ocean", value: "from-[oklch(0.55_0.14_220)] to-[oklch(0.45_0.12_230)]" },
  { label: "Teal", value: "from-[oklch(0.6_0.13_185)] to-[oklch(0.5_0.12_190)]" },
];

type ExtraFieldForm = { key: string; en: string; mr: string; type: "text" | "number" | "textarea"; required: boolean };
type DocForm = { id: string; en: string; mr: string; required: boolean };

type ServiceForm = {
  type: string;
  name_en: string;
  name_mr: string;
  desc_en: string;
  desc_mr: string;
  tone: string;
  price: string;
  active: boolean;
  sort_order: string;
  extra_fields: ExtraFieldForm[];
  required_docs: DocForm[];
};

const EMPTY: ServiceForm = {
  type: "",
  name_en: "",
  name_mr: "",
  desc_en: "",
  desc_mr: "",
  tone: TONE_PRESETS[0].value,
  price: "0",
  active: true,
  sort_order: "100",
  extra_fields: [],
  required_docs: [
    { id: "aadhaar", en: "Aadhaar Card", mr: "आधार कार्ड", required: true },
    { id: "photo", en: "Passport Size Photo", mr: "पासपोर्ट आकाराचा फोटो", required: true },
  ],
};

function fromRow(s: any): ServiceForm {
  return {
    type: s.type,
    name_en: s.en,
    name_mr: s.mr,
    desc_en: s.descEn || "",
    desc_mr: s.descMr || "",
    tone: s.tone || TONE_PRESETS[0].value,
    price: String(s.price ?? 0),
    active: !!s.active,
    sort_order: String(s.sort_order ?? 100),
    extra_fields: (s.extraFields || []).map((f: any) => ({
      key: f.key,
      en: f.en,
      mr: f.mr,
      type: (f.type || "text") as ExtraFieldForm["type"],
      required: !!f.required,
    })),
    required_docs: (s.requiredDocs || []).map((d: any) => ({
      id: d.id,
      en: d.en,
      mr: d.mr,
      required: !!d.required,
    })),
  };
}

function toPayload(f: ServiceForm) {
  return {
    type: f.type.trim().toLowerCase(),
    name_en: f.name_en.trim(),
    name_mr: f.name_mr.trim(),
    desc_en: f.desc_en.trim(),
    desc_mr: f.desc_mr.trim(),
    tone: f.tone.trim(),
    price: Number(f.price) || 0,
    active: f.active,
    sort_order: Math.max(0, Math.floor(Number(f.sort_order) || 0)),
    extra_fields: f.extra_fields.map((x) => ({
      key: x.key.trim(),
      en: x.en.trim(),
      mr: x.mr.trim(),
      type: x.type,
      required: !!x.required,
    })),
    required_docs: f.required_docs.map((x) => ({
      id: x.id.trim().toLowerCase(),
      en: x.en.trim(),
      mr: x.mr.trim(),
      required: !!x.required,
    })),
  };
}

function AdminSarkarServices() {
  const listFn = useServerFn(adminListSarkarServices);
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin-sarkar-services"],
    queryFn: () => listFn() as Promise<any[]>,
  });
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; service: any } | null>(null);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
            <ShieldCheck className="h-3 w-3" /> Admin Console
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight lg:text-3xl">
            Aaple Sarkar Services
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage every Aaple Sarkar certificate — pricing, descriptions, extra form fields and required
            documents. Changes go live instantly.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2">
          <Plus className="h-4 w-4" /> New Service
        </Button>
      </div>

      {isLoading ? (
        <Card className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading services…
        </Card>
      ) : services.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No services configured yet. Click <b>New Service</b> to add one.
        </Card>
      ) : (
        <div className="space-y-4">
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} onEdit={() => setDialog({ mode: "edit", service: s })} />
          ))}
        </div>
      )}

      <ServiceDialog
        key={dialog ? (dialog.mode === "edit" ? dialog.service.id : "create") : "closed"}
        open={!!dialog}
        mode={dialog?.mode ?? "create"}
        initial={dialog?.mode === "edit" ? fromRow(dialog.service) : EMPTY}
        serviceId={dialog?.mode === "edit" ? dialog.service.id : undefined}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function ServiceRow({ service, onEdit }: { service: any; onEdit: () => void }) {
  const toggleFn = useServerFn(adminToggleSarkarService);
  const deleteFn = useServerFn(adminDeleteSarkarService);
  const queryClient = useQueryClient();
  const [active, setActive] = useState<boolean>(!!service.active);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setActive(!!service.active);
  }, [service]);

  const toggleMut = useMutation({
    mutationFn: (next: boolean) => toggleFn({ data: { id: service.id, active: next } }),
    onSuccess: () => {
      toast.success(`${service.en} updated`);
      queryClient.invalidateQueries({ queryKey: ["admin-sarkar-services"] });
      queryClient.invalidateQueries({ queryKey: ["sarkar-services-public"] });
    },
    onError: (e: any) => {
      setActive(!!service.active);
      toast.error(e?.message || "Failed");
    },
  });

  const delMut = useMutation({
    mutationFn: () => deleteFn({ data: { id: service.id } }),
    onSuccess: (res: any) => {
      toast.success(res?.softDeleted ? `${service.en} deactivated (has history)` : `${service.en} removed`);
      queryClient.invalidateQueries({ queryKey: ["admin-sarkar-services"] });
      queryClient.invalidateQueries({ queryKey: ["sarkar-services-public"] });
      setConfirmDel(false);
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <Card className="p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-primary-foreground shadow-sm",
              service.tone,
            )}
          >
            <Landmark className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold">{service.en}</h3>
            <div className="truncate text-[12px] text-muted-foreground">{service.mr}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{service.type}</code>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5 font-semibold tabular-nums">
                <IndianRupee className="h-3 w-3" />
                {Number(service.price).toFixed(2)}
              </span>
              <span>·</span>
              <span>{service.extraFields?.length || 0} fields</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {service.requiredDocs?.length || 0} docs
              </span>
              <span>·</span>
              <span>Order: {service.sort_order}</span>
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            active
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted text-muted-foreground"
          }
        >
          {active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id={`a-${service.id}`}
            checked={active}
            disabled={toggleMut.isPending}
            onCheckedChange={(v) => {
              setActive(v);
              toggleMut.mutate(v);
            }}
          />
          <Label htmlFor={`a-${service.id}`}>Enable service</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDel(true)}
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {service.en}?</AlertDialogTitle>
            <AlertDialogDescription>
              If this service has past applications, it will be deactivated instead of removed to preserve
              history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                delMut.mutate();
              }}
              disabled={delMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {delMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ServiceDialog({
  open,
  mode,
  initial,
  serviceId,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: ServiceForm;
  serviceId?: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ServiceForm>(initial);
  const queryClient = useQueryClient();
  const createFn = useServerFn(adminCreateSarkarService);
  const updateFn = useServerFn(adminUpdateSarkarService);

  function up<K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  const mut = useMutation<{ ok?: boolean }, Error>({
    mutationFn: async () => {
      const payload = toPayload(form);
      if (mode === "edit" && serviceId) return updateFn({ data: { ...payload, id: serviceId } });
      return createFn({ data: payload });
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? "Service updated" : "Service created");
      queryClient.invalidateQueries({ queryKey: ["admin-sarkar-services"] });
      queryClient.invalidateQueries({ queryKey: ["sarkar-services-public"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  function addExtra() {
    up("extra_fields", [
      ...form.extra_fields,
      { key: "", en: "", mr: "", type: "text", required: false },
    ]);
  }
  function updateExtra(i: number, patch: Partial<ExtraFieldForm>) {
    up(
      "extra_fields",
      form.extra_fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)),
    );
  }
  function removeExtra(i: number) {
    up("extra_fields", form.extra_fields.filter((_, idx) => idx !== i));
  }

  function addDoc() {
    up("required_docs", [...form.required_docs, { id: "", en: "", mr: "", required: false }]);
  }
  function updateDoc(i: number, patch: Partial<DocForm>) {
    up(
      "required_docs",
      form.required_docs.map((d, idx) => (idx === i ? { ...d, ...patch } : d)),
    );
  }
  function removeDoc(i: number) {
    up("required_docs", form.required_docs.filter((_, idx) => idx !== i));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? `Edit ${initial.name_en}` : "New Aaple Sarkar Service"}</DialogTitle>
          <DialogDescription>
            Define how this certificate appears, what details retailers must fill, and which documents they
            must upload.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="space-y-6"
        >
          {/* Basic */}
          <section className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Service Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Service Code *</Label>
                <Input
                  value={form.type}
                  onChange={(e) => up("type", e.target.value.toLowerCase())}
                  placeholder="income, caste, domicile…"
                  required
                  maxLength={40}
                  disabled={mode === "edit"}
                  className="font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Lowercase a–z, 0–9, underscore. Cannot be changed once created.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sort Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => up("sort_order", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">English Name *</Label>
                <Input
                  value={form.name_en}
                  onChange={(e) => up("name_en", e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">मराठी Name *</Label>
                <Input
                  value={form.name_mr}
                  onChange={(e) => up("name_mr", e.target.value)}
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">English Description</Label>
                <Textarea
                  value={form.desc_en}
                  onChange={(e) => up("desc_en", e.target.value)}
                  maxLength={400}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">मराठी Description</Label>
                <Textarea
                  value={form.desc_mr}
                  onChange={(e) => up("desc_mr", e.target.value)}
                  maxLength={400}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price (₹) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => up("price", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color Tone</Label>
                <Select value={form.tone} onValueChange={(v) => up("tone", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-4 w-4 rounded bg-gradient-to-br",
                              p.value,
                            )}
                          />
                          {p.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch id="active" checked={form.active} onCheckedChange={(v) => up("active", v)} />
                <Label htmlFor="active">Active (visible to retailers)</Label>
              </div>
            </div>
          </section>

          <Separator />

          {/* Extra fields */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Extra Form Fields
                </h3>
                <p className="text-xs text-muted-foreground">
                  Service-specific inputs the retailer fills (e.g. Annual Income, Caste).
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addExtra} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Field
              </Button>
            </div>
            {form.extra_fields.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No extra fields. Click <b>Add Field</b> to create one.
              </div>
            )}
            {form.extra_fields.map((f, i) => (
              <div key={i} className="rounded-lg border bg-card p-3">
                <div className="grid gap-2 sm:grid-cols-12">
                  <div className="flex items-center justify-center sm:col-span-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    className="sm:col-span-2 font-mono"
                    placeholder="key"
                    value={f.key}
                    onChange={(e) => updateExtra(i, { key: e.target.value })}
                  />
                  <Input
                    className="sm:col-span-3"
                    placeholder="English label"
                    value={f.en}
                    onChange={(e) => updateExtra(i, { en: e.target.value })}
                  />
                  <Input
                    className="sm:col-span-3"
                    placeholder="मराठी label"
                    value={f.mr}
                    onChange={(e) => updateExtra(i, { mr: e.target.value })}
                  />
                  <Select value={f.type} onValueChange={(v: any) => updateExtra(i, { type: v })}>
                    <SelectTrigger className="sm:col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-end gap-2 sm:col-span-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeExtra(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={f.required}
                    onCheckedChange={(v) => updateExtra(i, { required: !!v })}
                  />
                  Required
                </label>
              </div>
            ))}
          </section>

          <Separator />

          {/* Required docs */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Required Documents
                </h3>
                <p className="text-xs text-muted-foreground">
                  Files the retailer must upload to submit this application.
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addDoc} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Document
              </Button>
            </div>
            {form.required_docs.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No documents. Click <b>Add Document</b> to create one.
              </div>
            )}
            {form.required_docs.map((d, i) => (
              <div key={i} className="rounded-lg border bg-card p-3">
                <div className="grid gap-2 sm:grid-cols-12">
                  <div className="flex items-center justify-center sm:col-span-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    className="sm:col-span-3 font-mono"
                    placeholder="doc_id"
                    value={d.id}
                    onChange={(e) => updateDoc(i, { id: e.target.value.toLowerCase() })}
                  />
                  <Input
                    className="sm:col-span-4"
                    placeholder="English name"
                    value={d.en}
                    onChange={(e) => updateDoc(i, { en: e.target.value })}
                  />
                  <Input
                    className="sm:col-span-3"
                    placeholder="मराठी नाव"
                    value={d.mr}
                    onChange={(e) => updateDoc(i, { mr: e.target.value })}
                  />
                  <div className="flex items-center justify-end gap-2 sm:col-span-1">
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeDoc(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={d.required}
                    onCheckedChange={(v) => updateDoc(i, { required: !!v })}
                  />
                  Required
                </label>
              </div>
            ))}
          </section>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending} className="gap-2">
              {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

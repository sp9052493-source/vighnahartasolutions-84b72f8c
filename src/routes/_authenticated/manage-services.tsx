import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plug, Wifi, WifiOff, Plus, Trash2, Pencil, ShieldCheck, Landmark, ArrowRight } from "lucide-react";
import { adminUpdateService, adminCreateService, adminDeleteService, adminListServices } from "@/lib/admin.functions";
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

export const Route = createFileRoute("/_authenticated/manage-services")({
  head: () => ({ meta: [{ title: "Manage Services — Vighnaharta Solutions" }] }),
  component: ManageServices,
});

const PROVIDERS = [
  { value: "demo", label: "Demo (sample data)" },
  { value: "apizone", label: "APIZONE" },
  { value: "surepass", label: "Surepass" },
  { value: "cashfree", label: "Cashfree" },
  { value: "signzy", label: "Signzy" },
  { value: "custom", label: "Custom API" },
];

type ServiceForm = {
  code: string;
  name: string;
  description: string;
  input_label: string;
  price: string;
  retailer_commission: string;
  distributor_commission: string;
  sort_order: string;
  active: boolean;
  api_provider: string;
  api_endpoint: string;
  api_enabled: boolean;
  api_notes: string;
};

const EMPTY: ServiceForm = {
  code: "",
  name: "",
  description: "",
  input_label: "Number",
  price: "0",
  retailer_commission: "0",
  distributor_commission: "0",
  sort_order: "100",
  active: true,
  api_provider: "apizone",
  api_endpoint: "",
  api_enabled: false,
  api_notes: "",
};

function fromService(s: any): ServiceForm {
  return {
    code: s.code,
    name: s.name,
    description: s.description ?? "",
    input_label: s.input_label,
    price: String(s.price),
    retailer_commission: String(s.retailer_commission),
    distributor_commission: String(s.distributor_commission),
    sort_order: String(s.sort_order ?? 0),
    active: s.active,
    api_provider: s.api_provider || "demo",
    api_endpoint: s.api_endpoint || "",
    api_enabled: !!s.api_enabled,
    api_notes: s.api_notes || "",
  };
}

function toPayload(f: ServiceForm) {
  return {
    code: f.code.trim().toUpperCase(),
    name: f.name.trim(),
    description: f.description.trim(),
    input_label: f.input_label.trim(),
    price: Number(f.price) || 0,
    retailer_commission: Number(f.retailer_commission) || 0,
    distributor_commission: Number(f.distributor_commission) || 0,
    sort_order: Math.max(0, Math.floor(Number(f.sort_order) || 0)),
    active: f.active,
    api_provider: f.api_provider,
    api_endpoint: f.api_endpoint.trim(),
    api_enabled: f.api_enabled,
    api_notes: f.api_notes.trim(),
  };
}

function ManageServices() {
  const { data: services } = useServices();
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; service: any } | null>(null);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
            <ShieldCheck className="h-3 w-3" /> Admin Console
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight lg:text-3xl">
            Manage Services
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, enable or disable services and their codes (e.g. <code className="rounded bg-muted px-1 py-0.5 text-[11px]">A2P</code>, <code className="rounded bg-muted px-1 py-0.5 text-[11px]">DL</code>, <code className="rounded bg-muted px-1 py-0.5 text-[11px]">RC</code>). No database access required.
          </p>
        </div>
        <Button onClick={() => setDialog({ mode: "create" })} className="gap-2">
          <Plus className="h-4 w-4" /> New Service
        </Button>
      </div>

      <Link
        to="/admin/sarkar-services"
        className="group flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-base font-bold">Aaple Sarkar Services</div>
            <div className="text-xs text-muted-foreground">
              Manage Income, Domicile, Caste & other certificates — pricing, extra fields, required documents and add new services.
            </div>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
      </Link>


      <div className="space-y-4">
        {(services ?? []).map((s) => (
          <ServiceRow key={s.id} service={s} onEdit={() => setDialog({ mode: "edit", service: s })} />
        ))}
        {(services ?? []).length === 0 && (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            No services configured yet. Click <b>New Service</b> to add one.
          </Card>
        )}
      </div>

      <ServiceDialog
        key={dialog ? (dialog.mode === "edit" ? dialog.service.id : "create") : "closed"}
        open={!!dialog}
        mode={dialog?.mode ?? "create"}
        initial={dialog?.mode === "edit" ? fromService(dialog.service) : EMPTY}
        serviceId={dialog?.mode === "edit" ? dialog.service.id : undefined}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function ServiceRow({ service, onEdit }: { service: any; onEdit: () => void }) {
  const updateFn = useServerFn(adminUpdateService);
  const deleteFn = useServerFn(adminDeleteService);
  const queryClient = useQueryClient();
  const [active, setActive] = useState<boolean>(service.active);
  const [apiEnabled, setApiEnabled] = useState<boolean>(!!service.api_enabled);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    setActive(service.active);
    setApiEnabled(!!service.api_enabled);
  }, [service]);

  const toggleMut = useMutation({
    mutationFn: (patch: { active?: boolean; api_enabled?: boolean }) =>
      updateFn({
        data: {
          ...toPayload(fromService(service)),
          ...patch,
          id: service.id,
        },
      }),
    onSuccess: () => {
      toast.success(`${service.name} updated`);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: any, vars) => {
      // Revert local toggle state on failure
      if (vars.active !== undefined) setActive(service.active);
      if (vars.api_enabled !== undefined) setApiEnabled(!!service.api_enabled);
      toast.error(e?.message || "Failed");
    },
  });

  const delMut = useMutation({
    mutationFn: () => deleteFn({ data: { id: service.id } }),
    onSuccess: (res: any) => {
      toast.success(res?.softDeleted ? `${service.name} deactivated (has history)` : `${service.name} removed`);
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setConfirmDel(false);
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <Card className="p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-[11px] font-bold tracking-wider text-primary">
            {service.code}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold">{service.name}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>₹{Number(service.price).toFixed(2)}</span>
              <span>·</span>
              <span>Input: {service.input_label}</span>
              <span>·</span>
              <span>Order: {service.sort_order ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              apiEnabled
                ? "gap-1 border-success/30 bg-success/10 text-success"
                : "gap-1 border-border bg-muted text-muted-foreground"
            }
          >
            {apiEnabled ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {apiEnabled ? "Live" : "Demo"}
          </Badge>
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
      </div>

      <Separator className="my-4" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <Switch
              id={`a-${service.id}`}
              checked={active}
              disabled={toggleMut.isPending}
              onCheckedChange={(v) => {
                setActive(v);
                toggleMut.mutate({ active: v });
              }}
            />
            <Label htmlFor={`a-${service.id}`}>Enable service</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`api-${service.id}`}
              checked={apiEnabled}
              disabled={toggleMut.isPending}
              onCheckedChange={(v) => {
                setApiEnabled(v);
                toggleMut.mutate({ api_enabled: v });
              }}
            />
            <Label htmlFor={`api-${service.id}`} className="flex items-center gap-1.5">
              <Plug className="h-3.5 w-3.5" /> Live API mode
            </Label>
          </div>
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
            <AlertDialogTitle>Delete {service.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              If this service has past document requests, it will be deactivated instead of permanently removed
              to preserve history.
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
  const createFn = useServerFn(adminCreateService);
  const updateFn = useServerFn(adminUpdateService);

  function up<K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  const mut = useMutation<{ ok?: boolean; id?: string }, Error>({
    mutationFn: async () => {
      const payload = toPayload(form);
      if (mode === "edit" && serviceId) {
        return updateFn({ data: { ...payload, id: serviceId } });
      }
      return createFn({ data: payload });
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? "Service updated" : "Service created");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? `Edit ${initial.name}` : "New Service"}</DialogTitle>
          <DialogDescription>
            Configure how this service appears in the portal, its pricing, and whether requests hit a live
            provider API.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => up("code", e.target.value.toUpperCase())}
                placeholder="A2P, DL, RC, RATION…"
                maxLength={20}
                required
                className="font-mono uppercase"
              />
              <p className="text-[11px] text-muted-foreground">
                Used by the backend (e.g. <code>A2P</code> for Aadhaar → PAN). A–Z, 0–9, underscore.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Display Name *</Label>
              <Input value={form.name} onChange={(e) => up("name", e.target.value)} required maxLength={80} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Input Label *</Label>
              <Input
                value={form.input_label}
                onChange={(e) => up("input_label", e.target.value)}
                placeholder="DL Number, Aadhaar Number…"
                required
                maxLength={40}
              />
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input
              value={form.description}
              onChange={(e) => up("description", e.target.value)}
              placeholder="Short description shown on cards"
              maxLength={280}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fee (₹)</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => up("price", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Retailer commission (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.retailer_commission}
                onChange={(e) => up("retailer_commission", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Distributor commission (₹)</Label>
              <Input
                type="number"
                min={0}
                value={form.distributor_commission}
                onChange={(e) => up("distributor_commission", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">API Provider</Label>
              <Select value={form.api_provider} onValueChange={(v) => up("api_provider", v)}>
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
                value={form.api_endpoint}
                onChange={(e) => up("api_endpoint", e.target.value)}
                placeholder="https://www.apizone.info/api/..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Internal notes</Label>
            <Input value={form.api_notes} onChange={(e) => up("api_notes", e.target.value)} maxLength={500} />
          </div>

          <div className="flex flex-wrap gap-5 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => up("active", v)} id="d-active" />
              <Label htmlFor="d-active">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.api_enabled} onCheckedChange={(v) => up("api_enabled", v)} id="d-api" />
              <Label htmlFor="d-api" className="flex items-center gap-1.5">
                <Plug className="h-3.5 w-3.5" /> Live API mode
              </Label>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            API keys (e.g. <code>APIZONE_API_KEY</code>) are stored as backend secrets and never shown here.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Save changes" : "Create service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Newspaper,
  ShieldCheck,
  Save,
  FileText,
  ListChecks,
  Sparkles,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import {
  adminGetGazette,
  adminSaveGazette,
  adminUploadGazetteSample,
  adminDeleteGazetteSample,
  adminListGazetteApplications,
} from "@/lib/gazette-admin.functions";
import {
  adminGetAapleSarkarDetail,
  adminUpdateAapleSarkar,
} from "@/lib/aaple-sarkar.functions";
import { FileDown, Upload, X, Clock, CreditCard, Inbox, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/gazette")({
  head: () => ({ meta: [{ title: "Gazette Certificate — Admin Editor" }] }),
  component: AdminGazette,
});

type ChangeType = {
  value: string;
  en: string;
  mr: string;
  needsOld: boolean;
  needsNew: boolean;
  active: boolean;
};
type CondField = {
  key: string;
  en: string;
  mr: string;
  type: "text" | "number" | "textarea";
  required: boolean;
  appearsFor: string[];
};
type Doc = { id: string; en: string; mr: string; required: boolean; appearsFor: string[] };

type State = {
  price: string;
  active: boolean;
  turnaround_text: string;
  payment_options: string[];
  change_types: ChangeType[];
  conditional_fields: CondField[];
  required_docs: Doc[];
};

const DEFAULT_PAYMENT_OPTIONS = ["Wallet", "UPI", "Card", "Net Banking", "Cash at Counter"];

function AdminGazette() {
  const getFn = useServerFn(adminGetGazette);
  const saveFn = useServerFn(adminSaveGazette);
  const uploadSampleFn = useServerFn(adminUploadGazetteSample);
  const deleteSampleFn = useServerFn(adminDeleteGazetteSample);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-gazette"],
    queryFn: () => getFn(),
  });

  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!data) return;
    setState({
      price: String(data.price ?? 0),
      active: !!data.active,
      turnaround_text: String((data as any).turnaround_text || ""),
      payment_options: Array.isArray((data as any).payment_options) ? (data as any).payment_options : [],
      change_types: (data.change_types || []).map((c: any) => ({
        value: String(c.value || ""),
        en: String(c.en || ""),
        mr: String(c.mr || ""),
        needsOld: c.needsOld !== false,
        needsNew: c.needsNew !== false,
        active: c.active !== false,
      })),
      conditional_fields: (data.conditional_fields || []).map((f: any) => ({
        key: String(f.key || ""),
        en: String(f.en || ""),
        mr: String(f.mr || ""),
        type: (f.type === "number" || f.type === "textarea" ? f.type : "text"),
        required: !!f.required,
        appearsFor: Array.isArray(f.appearsFor) ? f.appearsFor : [],
      })),
      required_docs: (data.required_docs || []).map((d: any) => ({
        id: String(d.id || ""),
        en: String(d.en || ""),
        mr: String(d.mr || ""),
        required: !!d.required,
        appearsFor: Array.isArray(d.appearsFor) ? d.appearsFor : [],
      })),
    });
  }, [data]);

  const mut = useMutation({
    mutationFn: () => {
      if (!state) throw new Error("Not loaded");
      return saveFn({
        data: {
          price: Number(state.price) || 0,
          active: state.active,
          turnaround_text: state.turnaround_text.trim(),
          payment_options: state.payment_options.map((p) => p.trim()).filter(Boolean),
          change_types: state.change_types.map((c) => ({
            value: c.value.trim().toLowerCase(),
            en: c.en.trim(),
            mr: c.mr.trim(),
            needsOld: !!c.needsOld,
            needsNew: !!c.needsNew,
            active: !!c.active,
          })),
          conditional_fields: state.conditional_fields.map((f) => ({
            key: f.key.trim(),
            en: f.en.trim(),
            mr: f.mr.trim(),
            type: f.type,
            required: !!f.required,
            appearsFor: f.appearsFor,
          })),
          required_docs: state.required_docs.map((d) => ({
            id: d.id.trim().toLowerCase(),
            en: d.en.trim(),
            mr: d.mr.trim(),
            required: !!d.required,
            appearsFor: d.appearsFor,
          })),
        },
      });
    },
    onSuccess: () => {
      toast.success("Gazette configuration saved");
      queryClient.invalidateQueries({ queryKey: ["admin-gazette"] });
      queryClient.invalidateQueries({ queryKey: ["sarkar-service", "gazette"] });
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  // Sample PDF upload/delete mutations
  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 8 * 1024 * 1024) throw new Error("File must be under 8 MB");
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      return uploadSampleFn({
        data: { filename: file.name, contentType: file.type || "application/pdf", base64 },
      });
    },
    onSuccess: () => {
      toast.success("Sample document uploaded");
      queryClient.invalidateQueries({ queryKey: ["admin-gazette"] });
      queryClient.invalidateQueries({ queryKey: ["gazette-sample"] });
    },
    onError: (e: any) => toast.error(e?.message || "Upload failed"),
  });

  const deleteSampleMut = useMutation({
    mutationFn: () => deleteSampleFn(),
    onSuccess: () => {
      toast.success("Sample document removed");
      queryClient.invalidateQueries({ queryKey: ["admin-gazette"] });
      queryClient.invalidateQueries({ queryKey: ["gazette-sample"] });
    },
    onError: (e: any) => toast.error(e?.message || "Remove failed"),
  });

  const changeTypeOptions = useMemo(
    () => (state?.change_types || []).filter((c) => c.value).map((c) => ({ value: c.value, en: c.en })),
    [state?.change_types],
  );

  function updateState(patch: Partial<State>) {
    setState((p) => (p ? { ...p, ...patch } : p));
  }

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center p-12 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading gazette configuration…
      </Card>
    );
  }
  if (error || !state) {
    return (
      <Card className="p-6 text-sm text-destructive">
        {(error as any)?.message || "Failed to load configuration."}
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
            <ShieldCheck className="h-3 w-3" /> Admin · Gazette Editor
          </div>
          <h1 className="mt-1.5 flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight lg:text-3xl">
            <Newspaper className="h-7 w-7 text-[oklch(0.55_0.17_40)]" /> Gazette Certificate
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit change-type options, conditional form fields and document rules. Saved changes appear on the
            public Gazette page immediately.
          </p>
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="gap-2">
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Service */}
      <Card className="space-y-5 p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <IndianRupee className="h-4 w-4" /> Pricing, Payment & Turnaround
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <IndianRupee className="h-3 w-3" /> Service Fee (₹) *
            </Label>
            <Input
              type="number"
              min={0}
              value={state.price}
              onChange={(e) => updateState({ price: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Debited from retailer wallet on submission.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Turnaround Time
            </Label>
            <Input
              placeholder="e.g. 15 – 45 days"
              value={state.turnaround_text}
              onChange={(e) => updateState({ turnaround_text: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Shown on the public Gazette page.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <Switch
              id="g-active"
              checked={state.active}
              onCheckedChange={(v) => updateState({ active: v })}
            />
            <Label htmlFor="g-active">Service is live for retailers</Label>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1.5">
            <CreditCard className="h-3 w-3" /> Accepted Payment Options
          </Label>
          <p className="text-[11.5px] text-muted-foreground">
            Click to enable. These display on the Gazette page so retailers know how customers
            can pay.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set([...DEFAULT_PAYMENT_OPTIONS, ...state.payment_options])).map((opt) => {
              const on = state.payment_options.includes(opt);
              return (
                <Badge
                  key={opt}
                  variant="outline"
                  onClick={() =>
                    updateState({
                      payment_options: on
                        ? state.payment_options.filter((p) => p !== opt)
                        : [...state.payment_options, opt],
                    })
                  }
                  className={cn(
                    "cursor-pointer text-[11px]",
                    on
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30",
                  )}
                >
                  {opt}
                </Badge>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Add custom option (e.g. Bharat QR) and press Enter"
              className="h-8 text-[12.5px]"
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const v = (e.target as HTMLInputElement).value.trim();
                if (!v) return;
                if (!state.payment_options.includes(v)) {
                  updateState({ payment_options: [...state.payment_options, v] });
                }
                (e.target as HTMLInputElement).value = "";
              }}
            />
          </div>
        </div>
      </Card>

      {/* Gazette Desk — submitted applications */}
      <div id="gazette-desk" className="scroll-mt-24">
        <GazetteDesk />
      </div>


      {/* Sample / Demo PDF */}
      <Card className="space-y-4 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <FileDown className="h-4 w-4" /> Sample / Demo Document
          </h2>
          <div className="flex items-center gap-2">
            {data?.sample_pdf_url && (
              <a
                href={data.sample_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:bg-muted/50"
              >
                <FileDown className="h-3.5 w-3.5" /> Preview
              </a>
            )}
            {data?.sample_pdf_path && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 gap-1.5"
                disabled={deleteSampleMut.isPending}
                onClick={() => deleteSampleMut.mutate()}
              >
                {deleteSampleMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            )}
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
              {uploadMut.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {data?.sample_pdf_path ? "Replace" : "Upload"} Sample
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                disabled={uploadMut.isPending}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMut.mutate(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Upload a filled sample / blank format PDF (max 8 MB). Retailers see a “Download Sample
          Form” button on the Gazette page so they know exactly what to fill.
        </p>
        {data?.sample_pdf_name ? (
          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-[12.5px] text-emerald-700 dark:text-emerald-300">
            <FileText className="h-4 w-4" />
            <span className="truncate font-medium">{data.sample_pdf_name}</span>
            <Badge variant="outline" className="ml-auto border-emerald-500/30 text-[10px]">
              Live for retailers
            </Badge>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border p-3 text-center text-[12px] text-muted-foreground">
            No sample uploaded yet.
          </div>
        )}
      </Card>



      {/* Change types */}
      <Card className="space-y-4 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Change-Type Options
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              updateState({
                change_types: [
                  ...state.change_types,
                  { value: "", en: "", mr: "", needsOld: true, needsNew: true, active: true },
                ],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add Change Type
          </Button>
        </div>
        <p className="text-[12px] text-muted-foreground">
          These appear as selectable tiles on the Gazette form. Disable an item to hide it without losing
          configured fields & documents that reference it.
        </p>
        <div className="space-y-3">
          {state.change_types.map((c, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg border p-3",
                c.active ? "border-border bg-card" : "border-border/70 bg-muted/40 opacity-80",
              )}
            >
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-[11px]">Code *</Label>
                  <Input
                    value={c.value}
                    placeholder="e.g. name"
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                      const old = c.value;
                      updateState({
                        change_types: state.change_types.map((x, idx) =>
                          idx === i ? { ...x, value: v } : x,
                        ),
                        // Re-key appearsFor references on rename
                        conditional_fields: state.conditional_fields.map((f) => ({
                          ...f,
                          appearsFor: f.appearsFor.map((a) => (a === old ? v : a)),
                        })),
                        required_docs: state.required_docs.map((d) => ({
                          ...d,
                          appearsFor: d.appearsFor.map((a) => (a === old ? v : a)),
                        })),
                      });
                    }}
                    className="font-mono"
                  />
                </div>
                <div className="sm:col-span-4 space-y-1.5">
                  <Label className="text-[11px]">English Label *</Label>
                  <Input
                    value={c.en}
                    onChange={(e) =>
                      updateState({
                        change_types: state.change_types.map((x, idx) =>
                          idx === i ? { ...x, en: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-3 space-y-1.5">
                  <Label className="text-[11px]">मराठी Label *</Label>
                  <Input
                    value={c.mr}
                    onChange={(e) =>
                      updateState({
                        change_types: state.change_types.map((x, idx) =>
                          idx === i ? { ...x, mr: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2 flex items-end justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      updateState({
                        change_types: state.change_types.filter((_, idx) => idx !== i),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px]">
                <label className="flex items-center gap-1.5">
                  <Checkbox
                    checked={c.needsOld}
                    onCheckedChange={(v) =>
                      updateState({
                        change_types: state.change_types.map((x, idx) =>
                          idx === i ? { ...x, needsOld: !!v } : x,
                        ),
                      })
                    }
                  />
                  Ask for <b>old</b> value
                </label>
                <label className="flex items-center gap-1.5">
                  <Checkbox
                    checked={c.needsNew}
                    onCheckedChange={(v) =>
                      updateState({
                        change_types: state.change_types.map((x, idx) =>
                          idx === i ? { ...x, needsNew: !!v } : x,
                        ),
                      })
                    }
                  />
                  Ask for <b>new</b> value
                </label>
                <label className="ml-auto flex items-center gap-1.5">
                  <Switch
                    checked={c.active}
                    onCheckedChange={(v) =>
                      updateState({
                        change_types: state.change_types.map((x, idx) =>
                          idx === i ? { ...x, active: !!v } : x,
                        ),
                      })
                    }
                  />
                  <span>{c.active ? "Visible" : "Hidden"}</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conditional fields */}
      <Card className="space-y-4 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <ListChecks className="h-4 w-4" /> Conditional Form Fields
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              updateState({
                conditional_fields: [
                  ...state.conditional_fields,
                  { key: "", en: "", mr: "", type: "text", required: false, appearsFor: [] },
                ],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add Field
          </Button>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Extra inputs that appear only when specific change types are selected. Leave “Appears for” empty to
          always show the field.
        </p>
        {state.conditional_fields.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No conditional fields configured.
          </div>
        )}
        <div className="space-y-3">
          {state.conditional_fields.map((f, i) => (
            <FieldEditor
              key={i}
              field={f}
              options={changeTypeOptions}
              onChange={(patch) =>
                updateState({
                  conditional_fields: state.conditional_fields.map((x, idx) =>
                    idx === i ? { ...x, ...patch } : x,
                  ),
                })
              }
              onRemove={() =>
                updateState({
                  conditional_fields: state.conditional_fields.filter((_, idx) => idx !== i),
                })
              }
            />
          ))}
        </div>
      </Card>

      {/* Required docs */}
      <Card className="space-y-4 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-4 w-4" /> Document Rules
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              updateState({
                required_docs: [
                  ...state.required_docs,
                  { id: "", en: "", mr: "", required: false, appearsFor: [] },
                ],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add Document
          </Button>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Mark documents required/optional and limit them to specific change types. Empty “Appears for” means
          the document is shown for every change type.
        </p>
        <div className="space-y-3">
          {state.required_docs.map((d, i) => (
            <DocEditor
              key={i}
              doc={d}
              options={changeTypeOptions}
              onChange={(patch) =>
                updateState({
                  required_docs: state.required_docs.map((x, idx) =>
                    idx === i ? { ...x, ...patch } : x,
                  ),
                })
              }
              onRemove={() =>
                updateState({
                  required_docs: state.required_docs.filter((_, idx) => idx !== i),
                })
              }
            />
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[12.5px] text-amber-700 dark:text-amber-300">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Changes go live for every retailer the moment you save.
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="gap-2">
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function FieldEditor({
  field,
  options,
  onChange,
  onRemove,
}: {
  field: CondField;
  options: { value: string; en: string }[];
  onChange: (patch: Partial<CondField>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-12">
        <div className="sm:col-span-3 space-y-1.5">
          <Label className="text-[11px]">Key *</Label>
          <Input
            value={field.key}
            placeholder="e.g. oldName"
            onChange={(e) => onChange({ key: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
            className="font-mono"
          />
        </div>
        <div className="sm:col-span-3 space-y-1.5">
          <Label className="text-[11px]">English Label *</Label>
          <Input value={field.en} onChange={(e) => onChange({ en: e.target.value })} />
        </div>
        <div className="sm:col-span-3 space-y-1.5">
          <Label className="text-[11px]">मराठी Label *</Label>
          <Input value={field.mr} onChange={(e) => onChange({ mr: e.target.value })} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-[11px]">Type</Label>
          <Select value={field.type} onValueChange={(v) => onChange({ type: v as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-1 flex items-end justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        <label className="flex items-center gap-1.5">
          <Checkbox
            checked={field.required}
            onCheckedChange={(v) => onChange({ required: !!v })}
          />
          Required
        </label>
        <AppearsForPicker
          value={field.appearsFor}
          options={options}
          onChange={(v) => onChange({ appearsFor: v })}
        />
      </div>
    </div>
  );
}

function DocEditor({
  doc,
  options,
  onChange,
  onRemove,
}: {
  doc: Doc;
  options: { value: string; en: string }[];
  onChange: (patch: Partial<Doc>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-12">
        <div className="sm:col-span-3 space-y-1.5">
          <Label className="text-[11px]">ID *</Label>
          <Input
            value={doc.id}
            placeholder="e.g. old_proof"
            onChange={(e) =>
              onChange({ id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })
            }
            className="font-mono"
          />
        </div>
        <div className="sm:col-span-4 space-y-1.5">
          <Label className="text-[11px]">English Label *</Label>
          <Input value={doc.en} onChange={(e) => onChange({ en: e.target.value })} />
        </div>
        <div className="sm:col-span-4 space-y-1.5">
          <Label className="text-[11px]">मराठी Label *</Label>
          <Input value={doc.mr} onChange={(e) => onChange({ mr: e.target.value })} />
        </div>
        <div className="sm:col-span-1 flex items-end justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator className="my-3" />
      <div className="flex flex-wrap items-center gap-4 text-[12px]">
        <label className="flex items-center gap-1.5">
          <Switch checked={doc.required} onCheckedChange={(v) => onChange({ required: !!v })} />
          {doc.required ? "Required" : "Optional"}
        </label>
        <AppearsForPicker
          value={doc.appearsFor}
          options={options}
          onChange={(v) => onChange({ appearsFor: v })}
        />
      </div>
    </div>
  );
}

function AppearsForPicker({
  value,
  options,
  onChange,
}: {
  value: string[];
  options: { value: string; en: string }[];
  onChange: (v: string[]) => void;
}) {
  if (!options.length) {
    return <span className="text-[11.5px] text-muted-foreground">Add change types first to scope this.</span>;
  }
  const all = value.length === 0;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Appears for:</span>
      <Badge
        variant="outline"
        onClick={() => onChange([])}
        className={cn(
          "cursor-pointer text-[10.5px]",
          all
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border text-muted-foreground hover:border-primary/30",
        )}
      >
        All
      </Badge>
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <Badge
            key={o.value}
            variant="outline"
            onClick={() =>
              onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])
            }
            className={cn(
              "cursor-pointer text-[10.5px]",
              on
                ? "border-[oklch(0.68_0.18_55)]/50 bg-[oklch(0.68_0.18_55)]/12 text-[oklch(0.55_0.17_40)]"
                : "border-border text-muted-foreground hover:border-primary/30",
            )}
          >
            {o.en || o.value}
          </Badge>
        );
      })}
    </div>
  );
}

function GazetteDesk() {
  const listFn = useServerFn(adminListGazetteApplications);
  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin-gazette-desk"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const STATUS_TONE: Record<string, string> = {
    submitted: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    under_review: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  };

  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    (apps || []).forEach((a: any) => a.status && s.add(a.status));
    return Array.from(s).sort();
  }, [apps]);

  const purposeOptions = useMemo(() => {
    const s = new Set<string>();
    (apps || []).forEach((a: any) => a.purpose && s.add(a.purpose));
    return Array.from(s).sort();
  }, [apps]);

  const filtered = useMemo(() => {
    if (!apps) return [];
    const q = search.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const to = toDate ? new Date(toDate + "T23:59:59").getTime() : null;
    return apps.filter((a: any) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (purposeFilter !== "all" && a.purpose !== purposeFilter) return false;
      if (from || to) {
        const t = new Date(a.created_at).getTime();
        if (from && t < from) return false;
        if (to && t > to) return false;
      }
      if (q) {
        const hay = [
          a.receipt_no,
          a.applicant_name,
          a.mobile,
          a.retailer_name,
          a.retailer_business,
          a.purpose,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [apps, search, statusFilter, purposeFilter, fromDate, toDate]);

  const hasFilters =
    search || statusFilter !== "all" || purposeFilter !== "all" || fromDate || toDate;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPurposeFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <Card className="space-y-4 p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Inbox className="h-4 w-4" /> Gazette Desk · Submitted Applications
        </h2>
        <Link
          to="/aaple-sarkar-requests"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Open full workflow →
        </Link>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Latest Gazette applications submitted by retailers. Click any row to manage status,
        remarks and upload the issued document on the workflow page.
      </p>

      {/* Filters */}
      <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Search
          </Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Receipt, applicant, mobile, retailer…"
            className="mt-1 h-9"
          />
        </div>
        <div>
          <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            Change Type
          </Label>
          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {purposeOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            From
          </Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 h-9"
          />
        </div>
        <div>
          <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
            To
          </Label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 h-9"
          />
        </div>
        <div className="flex items-end justify-between gap-2 sm:col-span-2 lg:col-span-6">
          <div className="text-[11.5px] text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
            <span className="font-semibold text-foreground">{apps?.length || 0}</span>{" "}
            applications
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
              <X className="mr-1 h-3.5 w-3.5" /> Clear filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
        </div>
      ) : !apps || apps.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No Gazette applications yet. Submissions from retailers will appear here in real time.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No applications match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[12.5px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Receipt</th>
                <th className="px-3 py-2 text-left">Applicant</th>
                <th className="px-3 py-2 text-left">Retailer / Distributor</th>
                <th className="px-3 py-2 text-left">Purpose</th>
                <th className="px-3 py-2 text-right">Fee</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-[11.5px]">{a.receipt_no}</td>
                  <td className="px-3 py-2">
                    <div className="font-semibold">{a.applicant_name}</div>
                    <div className="text-[11px] text-muted-foreground">{a.mobile}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{a.retailer_name}</div>
                    {a.retailer_business && (
                      <div className="text-[11px] text-muted-foreground">{a.retailer_business}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[220px] truncate" title={a.purpose}>
                    {a.purpose || "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ₹{Number(a.charged || 0).toFixed(0)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[10.5px]", STATUS_TONE[a.status] || "")}
                    >
                      {String(a.status || "").replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-[11.5px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() => setOpenId(a.id)}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GazetteManageDialog
        id={openId}
        onClose={() => setOpenId(null)}
        statusTone={STATUS_TONE}
      />
    </Card>
  );
}

function GazetteManageDialog({
  id,
  onClose,
  statusTone,
}: {
  id: string | null;
  onClose: () => void;
  statusTone: Record<string, string>;
}) {
  const open = !!id;
  const queryClient = useQueryClient();
  const getDetail = useServerFn(adminGetAapleSarkarDetail);
  const updateFn = useServerFn(adminUpdateAapleSarkar);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-gazette-detail", id],
    queryFn: () => getDetail({ data: { id: id! } }),
    enabled: open,
    staleTime: 0,
  });

  const [status, setStatus] = useState<string>("submitted");
  const [remarks, setRemarks] = useState("");
  const [resultDoc, setResultDoc] = useState<{ name: string; base64: string; contentType: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.application) {
      setStatus(data.application.status || "submitted");
      setRemarks(data.application.admin_remarks || "");
      setResultDoc(null);
    }
  }, [data]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be under 8 MB");
      return;
    }
    const buf = await file.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    const base64 = btoa(bin);
    setResultDoc({ name: file.name, base64, contentType: file.type || "application/pdf" });
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateFn({
        data: {
          id,
          status: status as any,
          adminRemarks: remarks,
          ...(resultDoc ? { resultDoc } : {}),
        },
      });
      toast.success("Application updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-gazette-desk"] }),
        refetch(),
      ]);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const app = data?.application;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4" /> Manage Gazette Application
          </DialogTitle>
          <DialogDescription>
            Update live status, add remarks and upload the issued certificate.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !app ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2">
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Receipt
                </div>
                <div className="font-mono text-sm">{app.receipt_no}</div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Current Status
                </div>
                <Badge variant="outline" className={cn("text-[10.5px]", statusTone[app.status] || "")}>
                  {String(app.status || "").replace(/_/g, " ")}
                </Badge>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Applicant
                </div>
                <div className="text-sm font-semibold">{app.applicant_name}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {app.mobile}
                  {app.email ? ` · ${app.email}` : ""}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Submitted By
                </div>
                <div className="text-sm">{data?.profile?.full_name || "—"}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {data?.profile?.business_name || ""}
                  {data?.profile?.phone ? ` · ${data.profile.phone}` : ""}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Purpose / Change Type
                </div>
                <div className="text-sm">{app.purpose || "—"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Address
                </div>
                <div className="text-[12.5px]">{app.address}</div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Fee Charged
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  ₹{Number(app.cost || 0).toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Date
                </div>
                <div className="text-sm">
                  {new Date(app.created_at).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Uploaded documents */}
            {data?.signedDocs && data.signedDocs.length > 0 && (
              <div>
                <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Applicant Documents
                </Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {data.signedDocs.map((d: any, i: number) => (
                    <a
                      key={i}
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11.5px] hover:bg-muted/40"
                    >
                      <FileText className="h-3.5 w-3.5" /> {d.name}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {data?.resultUrl && (
              <div>
                <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Previously Issued Document
                </Label>
                <a
                  href={data.resultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11.5px] text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <FileDown className="h-3.5 w-3.5" /> Download issued certificate
                </a>
              </div>
            )}

            <Separator />

            {/* Update controls */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Update Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Upload Completed Certificate
                </Label>
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  className="mt-1 h-9 text-xs"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                {resultDoc && (
                  <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                    Ready to upload: {resultDoc.name}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                Admin Remarks
              </Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Internal notes shared with the retailer…"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || isLoading || !app}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

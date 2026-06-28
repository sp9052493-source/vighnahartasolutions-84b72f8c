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
} from "@/lib/gazette-admin.functions";
import { FileDown, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  change_types: ChangeType[];
  conditional_fields: CondField[];
  required_docs: Doc[];
};

function AdminGazette() {
  const getFn = useServerFn(adminGetGazette);
  const saveFn = useServerFn(adminSaveGazette);
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
      <Card className="space-y-4 p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <IndianRupee className="h-4 w-4" /> Service Settings
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Price (₹) *</Label>
            <Input
              type="number"
              min={0}
              value={state.price}
              onChange={(e) => updateState({ price: e.target.value })}
            />
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

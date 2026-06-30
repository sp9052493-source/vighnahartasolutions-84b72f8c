import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import {
  Briefcase, CheckCircle2, FileUp, Info, Loader2, Save, Send, Trash2,
  User as UserIcon, Wallet as WalletIcon, Users as UsersIcon, Home,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  saveShopactDraft, submitShopactApplication, uploadShopactDocument,
  deleteShopactDocument, getMyShopactApplication,
} from "@/lib/shopact.functions";
import { useMe, formatINR, useServices } from "@/lib/queries";
import {
  SHOPACT_BUSINESS_TYPES, GENDERS, SHOPACT_DOC_TYPES,
  SHOPACT_STATUS_LABEL, SHOPACT_STATUS_TONE, type ShopactStatus,
} from "@/lib/shopact.shared";

const searchSchema = z.object({ id: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/shopact")({
  head: () => ({ meta: [{ title: "Shop Act Registration — Vighnaharta Solutions" }] }),
  validateSearch: searchSchema,
  component: ShopactPage,
});

type FormState = {
  owner_name: string; father_name: string; dob: string; gender: string;
  mobile: string; email: string; aadhaar_number: string; pan_number: string;
  res_address: string; res_city: string; res_district: string; res_state: string; res_pincode: string;
  business_name: string; business_type: string; business_nature: string; business_start_date: string;
  business_address: string; business_city: string; business_district: string; business_state: string; business_pincode: string;
  employees_male: string; employees_female: string; employees_other: string;
};

const EMPTY: FormState = {
  owner_name: "", father_name: "", dob: "", gender: "", mobile: "", email: "",
  aadhaar_number: "", pan_number: "",
  res_address: "", res_city: "", res_district: "", res_state: "", res_pincode: "",
  business_name: "", business_type: "", business_nature: "", business_start_date: "",
  business_address: "", business_city: "", business_district: "", business_state: "", business_pincode: "",
  employees_male: "0", employees_female: "0", employees_other: "0",
};

function toPayload(f: FormState) {
  return {
    owner_name: f.owner_name.trim() || undefined,
    father_name: f.father_name.trim() || undefined,
    dob: f.dob || undefined,
    gender: f.gender || undefined,
    mobile: f.mobile.trim() || undefined,
    email: f.email.trim() || undefined,
    aadhaar_number: f.aadhaar_number.trim() || undefined,
    pan_number: f.pan_number.trim().toUpperCase() || undefined,
    res_address: f.res_address.trim() || undefined,
    res_city: f.res_city.trim() || undefined,
    res_district: f.res_district.trim() || undefined,
    res_state: f.res_state.trim() || undefined,
    res_pincode: f.res_pincode.trim() || undefined,
    business_name: f.business_name.trim() || undefined,
    business_type: f.business_type || undefined,
    business_nature: f.business_nature.trim() || undefined,
    business_start_date: f.business_start_date || undefined,
    business_address: f.business_address.trim() || undefined,
    business_city: f.business_city.trim() || undefined,
    business_district: f.business_district.trim() || undefined,
    business_state: f.business_state.trim() || undefined,
    business_pincode: f.business_pincode.trim() || undefined,
    employees_male: Number(f.employees_male || 0),
    employees_female: Number(f.employees_female || 0),
    employees_other: Number(f.employees_other || 0),
  };
}

function fromApp(a: any): FormState {
  return {
    owner_name: a?.owner_name ?? "", father_name: a?.father_name ?? "",
    dob: a?.dob ?? "", gender: a?.gender ?? "", mobile: a?.mobile ?? "", email: a?.email ?? "",
    aadhaar_number: a?.aadhaar_number ?? "", pan_number: a?.pan_number ?? "",
    res_address: a?.res_address ?? "", res_city: a?.res_city ?? "",
    res_district: a?.res_district ?? "", res_state: a?.res_state ?? "", res_pincode: a?.res_pincode ?? "",
    business_name: a?.business_name ?? "", business_type: a?.business_type ?? "",
    business_nature: a?.business_nature ?? "", business_start_date: a?.business_start_date ?? "",
    business_address: a?.business_address ?? "", business_city: a?.business_city ?? "",
    business_district: a?.business_district ?? "", business_state: a?.business_state ?? "",
    business_pincode: a?.business_pincode ?? "",
    employees_male: String(a?.employees_male ?? 0),
    employees_female: String(a?.employees_female ?? 0),
    employees_other: String(a?.employees_other ?? 0),
  };
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const base64 = String(r.result || "").split(",")[1] || "";
      resolve({ base64, mimeType: file.type || "application/octet-stream", fileName: file.name });
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function ShopactPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: services } = useServices();
  const svc = useMemo(() => services?.find((s) => s.code === "SHOPACT"), [services]);
  const fee = Number(svc?.price ?? 499);

  const [appId, setAppId] = useState<string | undefined>(search.id);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [tab, setTab] = useState("instructions");

  const getOne = useServerFn(getMyShopactApplication);
  const detail = useQuery({
    queryKey: ["shopact-app", appId],
    queryFn: () => getOne({ data: { id: appId! } }),
    enabled: !!appId,
  });

  useEffect(() => { if (detail.data?.app) setForm(fromApp(detail.data.app)); }, [detail.data?.app]);

  const saveFn = useServerFn(saveShopactDraft);
  const saveMutation = useMutation({
    mutationFn: (payload: any) => saveFn({ data: payload }),
    onSuccess: (res) => {
      toast.success("Draft saved");
      if (!appId && res.id) {
        setAppId(res.id);
        navigate({ to: "/shopact", search: { id: res.id } });
      }
      queryClient.invalidateQueries({ queryKey: ["shopact-app", res.id] });
      queryClient.invalidateQueries({ queryKey: ["my-shopact"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not save"),
  });

  const submitFn = useServerFn(submitShopactApplication);
  const submitMutation = useMutation({
    mutationFn: () => submitFn({ data: { id: appId! } }),
    onSuccess: (res) => {
      toast.success(`Submitted! Application ${res.application_no}. ${formatINR(res.charged)} debited from wallet.`);
      queryClient.invalidateQueries();
      navigate({ to: "/shopact-applications" });
    },
    onError: (e: any) => toast.error(e?.message || "Submission failed"),
  });

  const onSaveDraft = () => saveMutation.mutate({ id: appId, ...toPayload(form) });
  const onSubmit = () => {
    if (!appId) { toast.error("Please save the draft first."); return; }
    submitMutation.mutate();
  };

  const isLocked = detail.data?.app?.status && detail.data.app.status !== "draft";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,oklch(0.25_0.08_262)_0%,oklch(0.18_0.07_262)_100%)] p-6 text-primary-foreground shadow-elegant">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[oklch(0.76_0.16_64_/_0.20)] blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[linear-gradient(135deg,oklch(0.82_0.17_64),oklch(0.62_0.16_50))] text-[oklch(0.22_0.06_60)] shadow-md">
              <Briefcase className="h-7 w-7" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[oklch(0.82_0.17_64)]">
                Labour Dept · Govt. of Maharashtra
              </div>
              <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
                Shop &amp; Establishment (Gumasta) Registration
              </h1>
              <p className="text-[12.5px] text-primary-foreground/70">
                Multi-step Shop Act application. Wallet debit: <strong>{formatINR(fee)}</strong> on final submit.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {detail.data?.app?.application_no && (
              <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
                {detail.data.app.application_no}
              </Badge>
            )}
            {detail.data?.app?.status && (
              <Badge className={SHOPACT_STATUS_TONE[detail.data.app.status as ShopactStatus]}>
                {SHOPACT_STATUS_LABEL[detail.data.app.status as ShopactStatus]}
              </Badge>
            )}
            <Link to="/shopact-applications">
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/15">
                My Applications
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full flex-wrap gap-1 bg-muted/40 p-1">
          <TabsTrigger value="instructions"><Info className="mr-1.5 h-3.5 w-3.5" />Instructions</TabsTrigger>
          <TabsTrigger value="owner"><UserIcon className="mr-1.5 h-3.5 w-3.5" />Owner</TabsTrigger>
          <TabsTrigger value="residential"><Home className="mr-1.5 h-3.5 w-3.5" />Residential</TabsTrigger>
          <TabsTrigger value="business"><Briefcase className="mr-1.5 h-3.5 w-3.5" />Business</TabsTrigger>
          <TabsTrigger value="employees"><UsersIcon className="mr-1.5 h-3.5 w-3.5" />Employees</TabsTrigger>
          <TabsTrigger value="documents"><FileUp className="mr-1.5 h-3.5 w-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="review"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Review &amp; Submit</TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="mt-4">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold">Before you start</h2>
            <ul className="mt-3 space-y-2 text-[13.5px] text-foreground/85">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Keep owner's Aadhaar and PAN ready. Name must match official records.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Provide accurate shop / establishment address with PIN code.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Upload clear copies of rent agreement, electricity bill and shop photograph.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Files must be PDF / JPG / PNG / WEBP, each under 8 MB.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Service fee <strong>{formatINR(fee)}</strong> is debited from your wallet only on final submission.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />You can save the application as a draft any time and continue later.</li>
            </ul>
            <div className="mt-5 flex items-center justify-between rounded-lg bg-muted/40 p-3 text-[13px]">
              <span className="flex items-center gap-2 text-muted-foreground"><WalletIcon className="h-4 w-4" /> Wallet balance</span>
              <span className="font-display text-base font-bold tabular-nums">{formatINR(me?.balance ?? 0)}</span>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setTab("owner")}>Start filling →</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="owner" className="mt-4">
          <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <Field label="Owner / Applicant Name *"><Input value={form.owner_name} disabled={!!isLocked} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></Field>
            <Field label="Father / Husband Name *"><Input value={form.father_name} disabled={!!isLocked} onChange={(e) => setForm({ ...form, father_name: e.target.value })} /></Field>
            <Field label="Date of Birth *"><Input type="date" value={form.dob} disabled={!!isLocked} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
            <Field label="Gender *">
              <Select value={form.gender} disabled={!!isLocked} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Mobile *"><Input maxLength={10} value={form.mobile} disabled={!!isLocked} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Email *"><Input type="email" value={form.email} disabled={!!isLocked} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Aadhaar Number *"><Input maxLength={12} value={form.aadhaar_number} disabled={!!isLocked} onChange={(e) => setForm({ ...form, aadhaar_number: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="PAN Number *"><Input maxLength={10} value={form.pan_number} disabled={!!isLocked} onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })} /></Field>
          </Card>
        </TabsContent>

        <TabsContent value="residential" className="mt-4">
          <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <Field label="Residential Address *" className="md:col-span-2"><Textarea rows={2} value={form.res_address} disabled={!!isLocked} onChange={(e) => setForm({ ...form, res_address: e.target.value })} /></Field>
            <Field label="City *"><Input value={form.res_city} disabled={!!isLocked} onChange={(e) => setForm({ ...form, res_city: e.target.value })} /></Field>
            <Field label="District *"><Input value={form.res_district} disabled={!!isLocked} onChange={(e) => setForm({ ...form, res_district: e.target.value })} /></Field>
            <Field label="State *"><Input value={form.res_state} disabled={!!isLocked} onChange={(e) => setForm({ ...form, res_state: e.target.value })} /></Field>
            <Field label="PIN Code *"><Input maxLength={6} value={form.res_pincode} disabled={!!isLocked} onChange={(e) => setForm({ ...form, res_pincode: e.target.value.replace(/\D/g, "") })} /></Field>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-4">
          <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <Field label="Business / Shop Name *"><Input value={form.business_name} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></Field>
            <Field label="Business Type *">
              <Select value={form.business_type} disabled={!!isLocked} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SHOPACT_BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Nature of Business *" className="md:col-span-2"><Input placeholder="e.g. Kirana store, Tailoring, Stationary…" value={form.business_nature} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_nature: e.target.value })} /></Field>
            <Field label="Business Start Date *"><Input type="date" value={form.business_start_date} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_start_date: e.target.value })} /></Field>
            <Field label="Shop / Business Address *" className="md:col-span-2"><Textarea rows={2} value={form.business_address} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_address: e.target.value })} /></Field>
            <Field label="City *"><Input value={form.business_city} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_city: e.target.value })} /></Field>
            <Field label="District *"><Input value={form.business_district} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_district: e.target.value })} /></Field>
            <Field label="State *"><Input value={form.business_state} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_state: e.target.value })} /></Field>
            <Field label="PIN Code *"><Input maxLength={6} value={form.business_pincode} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_pincode: e.target.value.replace(/\D/g, "") })} /></Field>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="mt-4">
          <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
            <Field label="Male Employees"><Input type="number" min={0} value={form.employees_male} disabled={!!isLocked} onChange={(e) => setForm({ ...form, employees_male: e.target.value })} /></Field>
            <Field label="Female Employees"><Input type="number" min={0} value={form.employees_female} disabled={!!isLocked} onChange={(e) => setForm({ ...form, employees_female: e.target.value })} /></Field>
            <Field label="Other Employees"><Input type="number" min={0} value={form.employees_other} disabled={!!isLocked} onChange={(e) => setForm({ ...form, employees_other: e.target.value })} /></Field>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          {!appId ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Save the application as a draft first to enable document uploads.
              <div className="mt-3">
                <Button onClick={onSaveDraft} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Draft
                </Button>
              </div>
            </Card>
          ) : (
            <DocumentsSection applicationId={appId} isLocked={!!isLocked}
              existingDocs={detail.data?.docs ?? []}
              onChange={() => queryClient.invalidateQueries({ queryKey: ["shopact-app", appId] })} />
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <Card className="space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">Review &amp; Submit</h2>
            <p className="text-[13px] text-muted-foreground">
              Re-check details across all sections. On final submission, the service fee
              <strong> {formatINR(fee)} </strong> will be debited from your wallet and a unique Application ID will be generated.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Summary label="Owner" value={form.owner_name || "—"} />
              <Summary label="Mobile / Email" value={`${form.mobile || "—"} · ${form.email || "—"}`} />
              <Summary label="Business" value={`${form.business_name || "—"} (${form.business_type || "—"})`} />
              <Summary label="Nature" value={form.business_nature || "—"} />
              <Summary label="Business Address" value={`${form.business_city || "—"}, ${form.business_district || "—"}, ${form.business_state || "—"} - ${form.business_pincode || "—"}`} />
              <Summary label="Residential Address" value={`${form.res_city || "—"}, ${form.res_district || "—"}, ${form.res_state || "—"} - ${form.res_pincode || "—"}`} />
              <Summary label="Employees" value={`M ${form.employees_male} · F ${form.employees_female} · O ${form.employees_other}`} />
              <Summary label="Documents uploaded" value={`${detail.data?.docs?.length ?? 0} / ${SHOPACT_DOC_TYPES.filter(d => d.required).length} required`} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-[13px]">
              <span className="text-muted-foreground">Wallet balance</span>
              <span className="font-display text-base font-bold tabular-nums">{formatINR(me?.balance ?? 0)}</span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur">
        <div className="text-[12px] text-muted-foreground">
          {appId ? `Application ID: ${detail.data?.app?.application_no ?? "—"}` : "Not saved yet"}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveDraft} disabled={saveMutation.isPending || !!isLocked}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={onSubmit} disabled={submitMutation.isPending || !!isLocked || !appId}>
            {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Final Submit · {formatINR(fee)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-[12px] font-semibold text-foreground/80">{label}</Label>
      {children}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="text-[13px] font-medium text-foreground/90">{value}</div>
    </div>
  );
}

function DocumentsSection({
  applicationId, isLocked, existingDocs, onChange,
}: {
  applicationId: string; isLocked: boolean;
  existingDocs: Array<{ id: string; doc_type: string; file_name: string }>;
  onChange: () => void;
}) {
  const uploadFn = useServerFn(uploadShopactDocument);
  const deleteFn = useServerFn(deleteShopactDocument);
  const byType = useMemo(() => {
    const m = new Map<string, { id: string; file_name: string }>();
    existingDocs.forEach((d) => m.set(d.doc_type, { id: d.id, file_name: d.file_name }));
    return m;
  }, [existingDocs]);
  const [progress, setProgress] = useState<Record<string, number>>({});

  async function handleUpload(docType: string, file: File) {
    if (file.size > 8 * 1024 * 1024) { toast.error("File must be under 8 MB."); return; }
    setProgress((p) => ({ ...p, [docType]: 5 }));
    try {
      const { base64, mimeType, fileName } = await fileToBase64(file);
      setProgress((p) => ({ ...p, [docType]: 35 }));
      await uploadFn({ data: { applicationId, docType, base64, mimeType, fileName } });
      setProgress((p) => ({ ...p, [docType]: 100 }));
      toast.success(`${fileName} uploaded`);
      onChange();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setTimeout(() => setProgress((p) => ({ ...p, [docType]: 0 })), 800);
    }
  }

  async function handleDelete(id: string) {
    try { await deleteFn({ data: { id } }); toast.success("Removed"); onChange(); }
    catch (e: any) { toast.error(e?.message || "Could not remove"); }
  }

  return (
    <Card className="divide-y divide-border p-0">
      {SHOPACT_DOC_TYPES.map((doc) => {
        const existing = byType.get(doc.id);
        const pct = progress[doc.id] || 0;
        return (
          <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                {doc.label} {doc.required && <Badge variant="outline" className="h-5 border-rose-300 bg-rose-50 text-[10px] text-rose-700">Required</Badge>}
              </div>
              {existing && <div className="mt-0.5 truncate text-[11.5px] text-emerald-700">Uploaded: {existing.file_name}</div>}
              {pct > 0 && pct < 100 && <Progress value={pct} className="mt-2 h-1.5 w-48" />}
            </div>
            <div className="flex items-center gap-2">
              {existing && !isLocked && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(existing.id)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                </Button>
              )}
              <FileButton disabled={isLocked} onFile={(f) => handleUpload(doc.id, f)} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function FileButton({ onFile, disabled }: { onFile: (f: File) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" className="hidden"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); if (ref.current) ref.current.value = ""; }} />
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => ref.current?.click()}>
        <FileUp className="mr-1 h-3.5 w-3.5" /> Choose file
      </Button>
    </>
  );
}

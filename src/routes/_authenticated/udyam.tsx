import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  FileUp,
  Info,
  Loader2,
  Save,
  Send,
  Trash2,
  User as UserIcon,
  Wallet as WalletIcon,
  Users as UsersIcon,
  Landmark as BankIcon,
  ChevronLeft,
  ChevronRight,
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
import { Switch } from "@/components/ui/switch";
import {
  saveUdyamDraft,
  submitUdyamApplication,
  uploadUdyamDocument,
  deleteUdyamDocument,
  getMyUdyamApplication,
  listMyUdyamApplications,
} from "@/lib/udyam.functions";
import { useMe, formatINR, useServices } from "@/lib/queries";
import {
  BUSINESS_TYPES,
  CATEGORIES,
  GENDERS,
  UDYAM_DOC_TYPES,
  UDYAM_STATUS_LABEL,
  UDYAM_STATUS_TONE,
  type UdyamStatus,
} from "@/lib/udyam.shared";

const searchSchema = z.object({ id: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/udyam")({
  head: () => ({ meta: [{ title: "Udyam Aadhaar Registration — Vighnaharta Solutions" }] }),
  validateSearch: searchSchema,
  component: UdyamPage,
});

type FormState = {
  // personal
  aadhaar_number: string;
  pan_number: string;
  name_as_aadhaar: string;
  name_as_pan: string;
  dob: string;
  mobile: string;
  email: string;
  gender: string;
  category: string;
  // business
  business_name: string;
  business_type: string;
  business_start_date: string;
  business_address: string;
  state: string;
  district: string;
  city: string;
  village: string;
  pincode: string;
  investment_amount: string;
  annual_turnover: string;
  gst_available: boolean;
  gst_number: string;
  // bank
  bank_name: string;
  ifsc: string;
  account_number: string;
  // employees
  employees_male: string;
  employees_female: string;
  employees_other: string;
};

const EMPTY: FormState = {
  aadhaar_number: "",
  pan_number: "",
  name_as_aadhaar: "",
  name_as_pan: "",
  dob: "",
  mobile: "",
  email: "",
  gender: "",
  category: "",
  business_name: "",
  business_type: "",
  business_start_date: "",
  business_address: "",
  state: "",
  district: "",
  city: "",
  village: "",
  pincode: "",
  investment_amount: "",
  annual_turnover: "",
  gst_available: false,
  gst_number: "",
  bank_name: "",
  ifsc: "",
  account_number: "",
  employees_male: "0",
  employees_female: "0",
  employees_other: "0",
};

function toPayload(f: FormState) {
  return {
    aadhaar_number: f.aadhaar_number.trim() || undefined,
    pan_number: f.pan_number.trim().toUpperCase() || undefined,
    name_as_aadhaar: f.name_as_aadhaar.trim() || undefined,
    name_as_pan: f.name_as_pan.trim() || undefined,
    dob: f.dob || undefined,
    mobile: f.mobile.trim() || undefined,
    email: f.email.trim() || undefined,
    gender: f.gender || undefined,
    category: f.category || undefined,
    business_name: f.business_name.trim() || undefined,
    business_type: f.business_type || undefined,
    business_start_date: f.business_start_date || undefined,
    business_address: f.business_address.trim() || undefined,
    state: f.state.trim() || undefined,
    district: f.district.trim() || undefined,
    city: f.city.trim() || undefined,
    village: f.village.trim() || undefined,
    pincode: f.pincode.trim() || undefined,
    investment_amount: f.investment_amount ? Number(f.investment_amount) : undefined,
    annual_turnover: f.annual_turnover ? Number(f.annual_turnover) : undefined,
    gst_available: f.gst_available,
    gst_number: f.gst_number.trim() || undefined,
    bank_name: f.bank_name.trim() || undefined,
    ifsc: f.ifsc.trim().toUpperCase() || undefined,
    account_number: f.account_number.trim() || undefined,
    employees_male: Number(f.employees_male || 0),
    employees_female: Number(f.employees_female || 0),
    employees_other: Number(f.employees_other || 0),
  };
}

function fromApp(a: any): FormState {
  return {
    aadhaar_number: a?.aadhaar_number ?? "",
    pan_number: a?.pan_number ?? "",
    name_as_aadhaar: a?.name_as_aadhaar ?? "",
    name_as_pan: a?.name_as_pan ?? "",
    dob: a?.dob ?? "",
    mobile: a?.mobile ?? "",
    email: a?.email ?? "",
    gender: a?.gender ?? "",
    category: a?.category ?? "",
    business_name: a?.business_name ?? "",
    business_type: a?.business_type ?? "",
    business_start_date: a?.business_start_date ?? "",
    business_address: a?.business_address ?? "",
    state: a?.state ?? "",
    district: a?.district ?? "",
    city: a?.city ?? "",
    village: a?.village ?? "",
    pincode: a?.pincode ?? "",
    investment_amount: a?.investment_amount != null ? String(a.investment_amount) : "",
    annual_turnover: a?.annual_turnover != null ? String(a.annual_turnover) : "",
    gst_available: !!a?.gst_available,
    gst_number: a?.gst_number ?? "",
    bank_name: a?.bank_name ?? "",
    ifsc: a?.ifsc ?? "",
    account_number: a?.account_number ?? "",
    employees_male: String(a?.employees_male ?? 0),
    employees_female: String(a?.employees_female ?? 0),
    employees_other: String(a?.employees_other ?? 0),
  };
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = String(r.result || "");
      const base64 = result.split(",")[1] || "";
      resolve({ base64, mimeType: file.type || "application/octet-stream", fileName: file.name });
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function UdyamPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: services } = useServices();
  const udyamService = useMemo(() => services?.find((s) => s.code === "UDYAM"), [services]);
  const fee = Number(udyamService?.price ?? 299);

  const [appId, setAppId] = useState<string | undefined>(search.id);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [tab, setTab] = useState("instructions");

  // load existing
  const getOne = useServerFn(getMyUdyamApplication);
  const detail = useQuery({
    queryKey: ["udyam-app", appId],
    queryFn: () => getOne({ data: { id: appId! } }),
    enabled: !!appId,
  });

  useEffect(() => {
    if (detail.data?.app) setForm(fromApp(detail.data.app));
  }, [detail.data?.app]);

  const saveFn = useServerFn(saveUdyamDraft);
  const saveMutation = useMutation({
    mutationFn: (payload: any) => saveFn({ data: payload }),
    onSuccess: (res) => {
      toast.success("Draft saved");
      if (!appId && res.id) {
        setAppId(res.id);
        navigate({ to: "/udyam", search: { id: res.id } });
      }
      queryClient.invalidateQueries({ queryKey: ["udyam-app", res.id] });
      queryClient.invalidateQueries({ queryKey: ["my-udyam"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not save"),
  });

  const submitFn = useServerFn(submitUdyamApplication);
  const submitMutation = useMutation({
    mutationFn: () => submitFn({ data: { id: appId! } }),
    onSuccess: (res) => {
      toast.success(`Submitted! Application ${res.application_no}. ₹${res.charged.toFixed(2)} debited from wallet.`);
      queryClient.invalidateQueries();
      navigate({ to: "/udyam-applications" });
    },
    onError: (e: any) => toast.error(e?.message || "Submission failed"),
  });

  const onSaveDraft = () => {
    saveMutation.mutate({ id: appId, ...toPayload(form) });
  };

  const onSubmit = () => {
    if (!appId) {
      toast.error("Please save the draft first.");
      return;
    }
    submitMutation.mutate();
  };

  const isLocked = detail.data?.app?.status && detail.data.app.status !== "draft";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,oklch(0.25_0.08_262)_0%,oklch(0.18_0.07_262)_100%)] p-6 text-primary-foreground shadow-elegant">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[oklch(0.76_0.16_64_/_0.20)] blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[linear-gradient(135deg,oklch(0.82_0.17_64),oklch(0.62_0.16_50))] text-[oklch(0.22_0.06_60)] shadow-md">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[oklch(0.82_0.17_64)]">
                MSME · Government of India
              </div>
              <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
                Udyam Aadhaar Registration
              </h1>
              <p className="text-[12.5px] text-primary-foreground/70">
                File a complete MSME Udyam application. Wallet debit: <strong>{formatINR(fee)}</strong> on final submit.
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
              <Badge className={UDYAM_STATUS_TONE[detail.data.app.status as UdyamStatus]}>
                {UDYAM_STATUS_LABEL[detail.data.app.status as UdyamStatus]}
              </Badge>
            )}
            <Link to="/udyam-applications">
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
          <TabsTrigger value="personal"><UserIcon className="mr-1.5 h-3.5 w-3.5" />Personal</TabsTrigger>
          <TabsTrigger value="business"><Building2 className="mr-1.5 h-3.5 w-3.5" />Business</TabsTrigger>
          <TabsTrigger value="bank"><BankIcon className="mr-1.5 h-3.5 w-3.5" />Bank</TabsTrigger>
          <TabsTrigger value="employees"><UsersIcon className="mr-1.5 h-3.5 w-3.5" />Employees</TabsTrigger>
          <TabsTrigger value="documents"><FileUp className="mr-1.5 h-3.5 w-3.5" />Documents</TabsTrigger>
          <TabsTrigger value="review"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Review &amp; Submit</TabsTrigger>
        </TabsList>

        {/* Instructions */}
        <TabsContent value="instructions" className="mt-4">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold">Before you start</h2>
            <ul className="mt-3 space-y-2 text-[13.5px] text-foreground/85">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Keep the applicant's Aadhaar &amp; PAN ready. Name on PAN must match official records.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Mobile number must be linked with Aadhaar for OTP based verification.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Business bank details (IFSC + account number) and proof of business address are mandatory.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Upload clear PDF / JPG / PNG copies, each under 8 MB.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Service fee <strong>{formatINR(fee)}</strong> is debited from your wallet only on final submission.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />You can save your work as a draft any time and continue later.</li>
            </ul>
            <div className="mt-5 flex items-center justify-between rounded-lg bg-muted/40 p-3 text-[13px]">
              <span className="flex items-center gap-2 text-muted-foreground"><WalletIcon className="h-4 w-4" /> Wallet balance</span>
              <span className="font-display text-base font-bold tabular-nums">{formatINR(me?.balance ?? 0)}</span>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setTab("personal")}>Start filling →</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Personal */}
        <TabsContent value="personal" className="mt-4">
          <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <Field label="Aadhaar Number *">
              <Input maxLength={12} value={form.aadhaar_number} disabled={!!isLocked}
                onChange={(e) => setForm({ ...form, aadhaar_number: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="PAN Number *">
              <Input maxLength={10} value={form.pan_number} disabled={!!isLocked}
                onChange={(e) => setForm({ ...form, pan_number: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Name as per Aadhaar *">
              <Input value={form.name_as_aadhaar} disabled={!!isLocked} onChange={(e) => setForm({ ...form, name_as_aadhaar: e.target.value })} />
            </Field>
            <Field label="Name as per PAN *">
              <Input value={form.name_as_pan} disabled={!!isLocked} onChange={(e) => setForm({ ...form, name_as_pan: e.target.value })} />
            </Field>
            <Field label="Date of Birth *">
              <Input type="date" value={form.dob} disabled={!!isLocked} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Mobile *">
              <Input maxLength={10} value={form.mobile} disabled={!!isLocked} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="Email *">
              <Input type="email" value={form.email} disabled={!!isLocked} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Gender *">
              <Select value={form.gender} disabled={!!isLocked} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Social Category *">
              <Select value={form.category} disabled={!!isLocked} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </Card>
        </TabsContent>

        {/* Business */}
        <TabsContent value="business" className="mt-4">
          <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <Field label="Business Name *">
              <Input value={form.business_name} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            </Field>
            <Field label="Business Type *">
              <Select value={form.business_type} disabled={!!isLocked} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{BUSINESS_TYPES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Business Start Date *">
              <Input type="date" value={form.business_start_date} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_start_date: e.target.value })} />
            </Field>
            <Field label="State *">
              <Input value={form.state} disabled={!!isLocked} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <Field label="District *">
              <Input value={form.district} disabled={!!isLocked} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </Field>
            <Field label="City *">
              <Input value={form.city} disabled={!!isLocked} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Village / Locality">
              <Input value={form.village} disabled={!!isLocked} onChange={(e) => setForm({ ...form, village: e.target.value })} />
            </Field>
            <Field label="PIN Code *">
              <Input maxLength={6} value={form.pincode} disabled={!!isLocked} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="Business Address *" className="md:col-span-2">
              <Textarea rows={2} value={form.business_address} disabled={!!isLocked} onChange={(e) => setForm({ ...form, business_address: e.target.value })} />
            </Field>
            <Field label="Investment in Plant &amp; Machinery (₹) *">
              <Input type="number" min={0} value={form.investment_amount} disabled={!!isLocked} onChange={(e) => setForm({ ...form, investment_amount: e.target.value })} />
            </Field>
            <Field label="Annual Turnover (₹) *">
              <Input type="number" min={0} value={form.annual_turnover} disabled={!!isLocked} onChange={(e) => setForm({ ...form, annual_turnover: e.target.value })} />
            </Field>
            <Field label="GST Available?">
              <div className="flex h-10 items-center gap-3 rounded-md border border-input bg-background px-3">
                <Switch checked={form.gst_available} disabled={!!isLocked}
                  onCheckedChange={(v) => setForm({ ...form, gst_available: v })} />
                <span className="text-sm">{form.gst_available ? "Yes" : "No"}</span>
              </div>
            </Field>
            {form.gst_available && (
              <Field label="GSTIN">
                <Input maxLength={15} value={form.gst_number} disabled={!!isLocked}
                  onChange={(e) => setForm({ ...form, gst_number: e.target.value.toUpperCase() })} />
              </Field>
            )}
          </Card>
        </TabsContent>

        {/* Bank */}
        <TabsContent value="bank" className="mt-4">
          <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <Field label="Bank Name *"><Input value={form.bank_name} disabled={!!isLocked} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></Field>
            <Field label="IFSC *"><Input maxLength={11} value={form.ifsc} disabled={!!isLocked} onChange={(e) => setForm({ ...form, ifsc: e.target.value.toUpperCase() })} /></Field>
            <Field label="Account Number *" className="md:col-span-2"><Input value={form.account_number} disabled={!!isLocked} onChange={(e) => setForm({ ...form, account_number: e.target.value.replace(/\D/g, "") })} /></Field>
          </Card>
        </TabsContent>

        {/* Employees */}
        <TabsContent value="employees" className="mt-4">
          <Card className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
            <Field label="Male Employees"><Input type="number" min={0} value={form.employees_male} disabled={!!isLocked} onChange={(e) => setForm({ ...form, employees_male: e.target.value })} /></Field>
            <Field label="Female Employees"><Input type="number" min={0} value={form.employees_female} disabled={!!isLocked} onChange={(e) => setForm({ ...form, employees_female: e.target.value })} /></Field>
            <Field label="Other Employees"><Input type="number" min={0} value={form.employees_other} disabled={!!isLocked} onChange={(e) => setForm({ ...form, employees_other: e.target.value })} /></Field>
          </Card>
        </TabsContent>

        {/* Documents */}
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
            <DocumentsSection
              applicationId={appId}
              isLocked={!!isLocked}
              existingDocs={detail.data?.docs ?? []}
              onChange={() => queryClient.invalidateQueries({ queryKey: ["udyam-app", appId] })}
            />
          )}
        </TabsContent>

        {/* Review */}
        <TabsContent value="review" className="mt-4">
          <Card className="space-y-4 p-6">
            <h2 className="font-display text-lg font-bold">Review &amp; Submit</h2>
            <p className="text-[13px] text-muted-foreground">
              Re-check the details across all sections. On final submission the service fee
              <strong> {formatINR(fee)} </strong> will be debited from your wallet and a unique Application ID will be generated.
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Summary label="Applicant" value={form.name_as_aadhaar || "—"} />
              <Summary label="Mobile / Email" value={`${form.mobile || "—"} · ${form.email || "—"}`} />
              <Summary label="Business" value={`${form.business_name || "—"} (${form.business_type || "—"})`} />
              <Summary label="Address" value={`${form.city || "—"}, ${form.district || "—"}, ${form.state || "—"} - ${form.pincode || "—"}`} />
              <Summary label="Investment / Turnover" value={`${formatINR(Number(form.investment_amount || 0))} / ${formatINR(Number(form.annual_turnover || 0))}`} />
              <Summary label="Bank" value={`${form.bank_name || "—"} · ${form.ifsc || "—"}`} />
              <Summary label="Employees" value={`M ${form.employees_male} · F ${form.employees_female} · O ${form.employees_other}`} />
              <Summary label="Documents uploaded" value={`${detail.data?.docs?.length ?? 0} / ${UDYAM_DOC_TYPES.filter(d => d.required).length} required`} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-[13px]">
              <span className="text-muted-foreground">Wallet balance</span>
              <span className="font-display text-base font-bold tabular-nums">{formatINR(me?.balance ?? 0)}</span>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sticky action bar */}
      <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur">
        <div className="text-[12px] text-muted-foreground">
          {appId ? `Application ID: ${detail.data?.app?.application_no ?? "—"}` : "Not saved yet"}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(() => {
            const STEPS = ["instructions","personal","business","bank","employees","documents","review"];
            const idx = STEPS.indexOf(tab);
            const prev = idx > 0 ? STEPS[idx - 1] : null;
            const next = idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
            return (
              <>
                <Button variant="ghost" size="sm" disabled={!prev} onClick={() => prev && setTab(prev)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <Button variant="secondary" size="sm" disabled={!next} onClick={() => next && setTab(next)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </>
            );
          })()}
          <Button variant="outline" onClick={onSaveDraft} disabled={saveMutation.isPending || !!isLocked}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {appId ? "Update Draft" : "Save Draft"}
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
  applicationId,
  isLocked,
  existingDocs,
  onChange,
}: {
  applicationId: string;
  isLocked: boolean;
  existingDocs: Array<{ id: string; doc_type: string; file_name: string }>;
  onChange: () => void;
}) {
  const uploadFn = useServerFn(uploadUdyamDocument);
  const deleteFn = useServerFn(deleteUdyamDocument);

  const byType = useMemo(() => {
    const m = new Map<string, { id: string; file_name: string }>();
    existingDocs.forEach((d) => m.set(d.doc_type, { id: d.id, file_name: d.file_name }));
    return m;
  }, [existingDocs]);

  const [progress, setProgress] = useState<Record<string, number>>({});

  async function handleUpload(docType: string, file: File) {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be under 8 MB.");
      return;
    }
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
    try {
      await deleteFn({ data: { id } });
      toast.success("Removed");
      onChange();
    } catch (e: any) {
      toast.error(e?.message || "Could not remove");
    }
  }

  return (
    <Card className="divide-y divide-border p-0">
      {UDYAM_DOC_TYPES.map((doc) => {
        const existing = byType.get(doc.id);
        const pct = progress[doc.id] || 0;
        return (
          <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[13.5px] font-semibold">
                {doc.label} {doc.required && <Badge variant="outline" className="h-5 border-rose-300 bg-rose-50 text-[10px] text-rose-700">Required</Badge>}
              </div>
              {existing && (
                <div className="mt-0.5 truncate text-[11.5px] text-emerald-700">Uploaded: {existing.file_name}</div>
              )}
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
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          if (ref.current) ref.current.value = "";
        }}
      />
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => ref.current?.click()}>
        <FileUp className="mr-1 h-3.5 w-3.5" /> Choose file
      </Button>
    </>
  );
}

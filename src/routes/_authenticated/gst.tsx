import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  FileCheck2,
  ShieldCheck,
  Wallet,
  Loader2,
  Upload,
  X,
  CheckCircle2,
  IndianRupee,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Building2,
  User,
  MapPin,
  Landmark,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useMe, formatINR } from "@/lib/queries";
import {
  getGstConfig,
  createGstApplication,
  uploadGstDocument,
  submitGstApplication,
  GST_REQUIRED_DOCS,
  GST_OPTIONAL_DOCS,
} from "@/lib/gst.functions";

export const Route = createFileRoute("/_authenticated/gst")({
  head: () => ({
    meta: [
      { title: "GST Registration — Vighnaharta Solutions" },
      {
        name: "description",
        content:
          "Apply for new GST Registration online — submit business, address, bank and signatory details with required documents.",
      },
    ],
  }),
  component: GstPage,
});

type FileItem = { name: string; base64: string; contentType: string };
const ALL_DOCS = [...GST_REQUIRED_DOCS.map((d) => ({ ...d, required: true })), ...GST_OPTIONAL_DOCS.map((d) => ({ ...d, required: false }))];

const CONSTITUTIONS = [
  { value: "proprietor", label: "Sole Proprietor" },
  { value: "partnership", label: "Partnership Firm" },
  { value: "llp", label: "LLP" },
  { value: "pvt_ltd", label: "Private Limited Company" },
  { value: "public_ltd", label: "Public Limited Company" },
  { value: "huf", label: "HUF" },
  { value: "society", label: "Society / Association" },
  { value: "trust", label: "Trust" },
  { value: "other", label: "Other" },
];

const STEPS = [
  { key: "applicant", label: "Applicant", icon: User },
  { key: "business", label: "Business", icon: Building2 },
  { key: "address", label: "Address & HSN", icon: MapPin },
  { key: "bank", label: "Bank & Signatory", icon: Landmark },
  { key: "docs", label: "Documents & Submit", icon: FileText },
] as const;

const EMPTY = {
  applicant_name: "",
  mobile: "",
  email: "",
  pan: "",
  aadhaar: "",
  business_name: "",
  trade_name: "",
  constitution: "proprietor",
  nature_of_business: "",
  commencement_date: "",
  address_line1: "",
  address_line2: "",
  city: "",
  district: "",
  state: "Maharashtra",
  pin_code: "",
  estimated_turnover: "",
  existing_registration: "",
  bank_account_name: "",
  bank_account_no: "",
  bank_ifsc: "",
  bank_name: "",
  bank_branch: "",
  signatory_name: "",
  signatory_designation: "",
  signatory_pan: "",
  signatory_mobile: "",
  signatory_email: "",
};

function readFile(file: File): Promise<FileItem> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, base64: String(r.result), contentType: file.type });
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function GstPage() {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const balance = me?.balance ?? 0;
  const queryClient = useQueryClient();
  const getConfigFn = useServerFn(getGstConfig);
  const createFn = useServerFn(createGstApplication);
  const uploadFn = useServerFn(uploadGstDocument);
  const submitFn = useServerFn(submitGstApplication);

  const { data: cfg, isLoading: cfgLoading } = useQuery({
    queryKey: ["gst-config"],
    queryFn: () => getConfigFn(),
    staleTime: 60_000,
  });

  const [form, setForm] = useState({ ...EMPTY });
  const [hsn, setHsn] = useState<{ code: string; description: string }[]>([{ code: "", description: "" }]);
  const [step, setStep] = useState(0);
  const [appId, setAppId] = useState<string | null>(null);
  const [appNo, setAppNo] = useState<string | null>(null);
  const [docMap, setDocMap] = useState<Record<string, FileItem | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadedTypes, setUploadedTypes] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ no: string; charged: number } | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((p) => ({ ...p, [k]: v }));

  const price = Number(cfg?.service_charge ?? 0);
  const govt = Number(cfg?.govt_fee ?? 0);
  const total = price + govt;

  const missingDocs = useMemo(
    () => GST_REQUIRED_DOCS.filter((d) => !uploadedTypes.has(d.id)),
    [uploadedTypes],
  );

  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.applicant_name.trim()) return "Enter applicant name";
      if (!/^[6-9]\d{9}$/.test(form.mobile)) return "Enter a valid 10-digit mobile";
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email";
      if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan)) return "Enter a valid PAN (e.g. ABCDE1234F)";
      if (!/^\d{12}$/.test(form.aadhaar)) return "Enter a valid 12-digit Aadhaar";
    }
    if (s === 1) {
      if (!form.business_name.trim()) return "Enter business / legal name";
      if (!form.constitution) return "Select constitution";
      if (!form.nature_of_business.trim()) return "Describe nature of business";
    }
    if (s === 2) {
      if (!form.address_line1.trim()) return "Enter address";
      if (!form.city.trim()) return "Enter city";
      if (!form.district.trim()) return "Enter district";
      if (!form.state.trim()) return "Enter state";
      if (!/^\d{6}$/.test(form.pin_code)) return "Enter valid 6-digit PIN";
    }
    if (s === 3) {
      // bank/signatory optional but if started must be valid-ish
      if (form.bank_ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bank_ifsc)) return "Enter a valid IFSC";
      if (form.signatory_pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.signatory_pan)) return "Enter a valid Signatory PAN";
    }
    return null;
  }

  const createMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          applicant_name: form.applicant_name.trim(),
          mobile: form.mobile,
          email: form.email.trim(),
          pan: form.pan.toUpperCase(),
          aadhaar: form.aadhaar,
          business_name: form.business_name.trim(),
          trade_name: form.trade_name.trim(),
          constitution: form.constitution as any,
          nature_of_business: form.nature_of_business.trim(),
          commencement_date: form.commencement_date || null,
          address_line1: form.address_line1.trim(),
          address_line2: form.address_line2.trim(),
          city: form.city.trim(),
          district: form.district.trim(),
          state: form.state.trim(),
          pin_code: form.pin_code,
          bank_account_name: form.bank_account_name.trim(),
          bank_account_no: form.bank_account_no.trim(),
          bank_ifsc: form.bank_ifsc.trim().toUpperCase(),
          bank_name: form.bank_name.trim(),
          bank_branch: form.bank_branch.trim(),
          signatory_name: form.signatory_name.trim(),
          signatory_designation: form.signatory_designation.trim(),
          signatory_pan: form.signatory_pan.trim().toUpperCase(),
          signatory_mobile: form.signatory_mobile.trim(),
          signatory_email: form.signatory_email.trim(),
          hsn_codes: hsn.filter((h) => h.code.trim()).map((h) => ({ code: h.code.trim(), description: h.description.trim() })),
          estimated_turnover: form.estimated_turnover ? Number(form.estimated_turnover) : null,
          existing_registration: form.existing_registration.trim(),
        },
      }),
    onSuccess: (res) => {
      setAppId(res.id);
      setAppNo(res.application_no);
      toast.success(`Draft created: ${res.application_no}`);
      setStep(4);
    },
    onError: (e: any) => toast.error(e?.message || "Could not create application"),
  });

  async function handleNext() {
    const err = validateStep(step);
    if (err) return toast.error(err);
    if (step === 3 && !appId) {
      createMut.mutate();
      return;
    }
    setStep(Math.min(step + 1, STEPS.length - 1));
  }

  async function handleFile(docId: string, file: File | null) {
    if (!appId) return toast.error("Save the application first");
    if (!file) {
      setDocMap((p) => ({ ...p, [docId]: null }));
      return;
    }
    if (file.size > 8 * 1024 * 1024) return toast.error("File must be under 8 MB");
    setUploadingId(docId);
    try {
      const fi = await readFile(file);
      await uploadFn({
        data: {
          applicationId: appId,
          docType: docId,
          filename: fi.name,
          contentType: fi.contentType,
          base64: fi.base64,
        },
      });
      setDocMap((p) => ({ ...p, [docId]: fi }));
      setUploadedTypes((s) => new Set([...s, docId]));
      toast.success(`${docId} uploaded`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploadingId(null);
    }
  }

  const submitMut = useMutation({
    mutationFn: () => submitFn({ data: { id: appId! } }),
    onSuccess: (res: any) => {
      setReceipt({ no: res.application_no, charged: Number(res.charged || 0) });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-gst"] });
      toast.success("GST application submitted");
      setConfirmOpen(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Submission failed");
      setConfirmOpen(false);
    },
  });

  function openConfirm() {
    if (!appId) return toast.error("Save the application first");
    if (missingDocs.length) return toast.error("Upload all required documents");
    if (balance < total) return toast.error(`Insufficient balance. Need ${formatINR(total)}.`);
    setConfirmOpen(true);
  }

  if (cfgLoading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cfg && !cfg.active) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-3 font-display text-2xl font-bold">GST Registration is currently unavailable</h1>
          <p className="mt-2 text-muted-foreground">Please check back later or contact support.</p>
        </Card>
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-3 font-display text-2xl font-bold">Application Submitted</h1>
          <p className="mt-1 text-muted-foreground">Your GST Registration application is now in our processing queue.</p>
          <div className="mt-6 grid gap-3 rounded-xl border border-border bg-muted/40 p-5 text-left">
            <Row label="Application No." value={receipt.no} />
            <Row label="Amount Charged" value={formatINR(receipt.charged)} />
            <Row label="Wallet Balance" value={formatINR((me?.balance ?? 0))} />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate({ to: "/gst-requests" })}>
              View My GST Applications
            </Button>
            <Button onClick={() => navigate({ to: "/dashboard" })}>Back to Dashboard</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,oklch(0.32_0.10_180)_0%,oklch(0.22_0.08_200)_100%)] p-6 text-primary-foreground shadow-elegant">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[oklch(0.76_0.16_180)]/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg,#FF9933,#ffffff,#138808)] opacity-60" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/30 backdrop-blur">
            <FileCheck2 className="h-10 w-10 text-[oklch(0.92_0.10_180)]" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em]">
              <ShieldCheck className="h-3 w-3" /> Government of India · GST Registration
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">GST Registration</h1>
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-primary-foreground/80">
              Apply for a new GSTIN. Provide business, address, bank and signatory details with supporting documents.
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              <Wallet className="h-3.5 w-3.5" /> Wallet Balance
            </div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums">{formatINR(balance)}</div>
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <InfoTile icon={IndianRupee} label="Service Charge" value={formatINR(price)} sub="Debited from wallet on submit" />
        <InfoTile icon={IndianRupee} label="Government Fee" value={formatINR(govt)} sub={govt === 0 ? "Nil for new GST registration" : "Pass-through to authority"} />
        <InfoTile icon={ShieldCheck} label="Processing Time" value={cfg?.turnaround_text || "7–15 days"} sub="After document verification" />
      </div>

      {/* Instructions */}
      <Card className="p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <FileText className="h-5 w-5 text-primary" /> Instructions & Guidelines
        </div>
        <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
          {cfg?.instructions_en?.trim() ||
            "Eligibility: Businesses crossing the GST threshold or opting for voluntary registration.\nUpload clear, legible documents (PDF or image, max 8 MB each). Mobile and email must be active for OTPs."}
        </div>
      </Card>

      {/* Stepper */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => {
            const done = i < step || (i === STEPS.length - 1 && !!receipt);
            const active = i === step;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => i < step && setStep(i)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : done
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", active ? "bg-primary text-primary-foreground" : done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
                  {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                </span>
                <Icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Steps */}
      {step === 0 && (
        <Card className="space-y-4 p-5">
          <SectionTitle title="Applicant Details" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full Name *">
              <Input value={form.applicant_name} onChange={(e) => set("applicant_name", e.target.value)} maxLength={120} />
            </Field>
            <Field label="Mobile *">
              <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" />
            </Field>
            <Field label="Email *">
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" />
            </Field>
            <Field label="PAN *">
              <Input value={form.pan} onChange={(e) => set("pan", e.target.value.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" />
            </Field>
            <Field label="Aadhaar *">
              <Input value={form.aadhaar} onChange={(e) => set("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="12 digits" />
            </Field>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4 p-5">
          <SectionTitle title="Business Details" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Legal / Business Name *">
              <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
            </Field>
            <Field label="Trade Name (if different)">
              <Input value={form.trade_name} onChange={(e) => set("trade_name", e.target.value)} />
            </Field>
            <Field label="Constitution of Business *">
              <Select value={form.constitution} onValueChange={(v) => set("constitution", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONSTITUTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date of Commencement">
              <Input type="date" value={form.commencement_date} onChange={(e) => set("commencement_date", e.target.value)} />
            </Field>
            <Field label="Nature of Business *" className="md:col-span-2">
              <Textarea value={form.nature_of_business} onChange={(e) => set("nature_of_business", e.target.value)} rows={2} placeholder="e.g. Retail trading of mobile accessories" />
            </Field>
            <Field label="Existing Registration (if any)">
              <Input value={form.existing_registration} onChange={(e) => set("existing_registration", e.target.value)} placeholder="VAT / Service Tax / etc." />
            </Field>
            <Field label="Estimated Annual Turnover (₹)">
              <Input value={form.estimated_turnover} onChange={(e) => set("estimated_turnover", e.target.value.replace(/[^\d.]/g, ""))} />
            </Field>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4 p-5">
          <SectionTitle title="Principal Place of Business" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Address Line 1 *" className="md:col-span-2">
              <Input value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} />
            </Field>
            <Field label="Address Line 2" className="md:col-span-2">
              <Input value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} />
            </Field>
            <Field label="City *">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="District *">
              <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
            </Field>
            <Field label="State *">
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="PIN Code *">
              <Input value={form.pin_code} onChange={(e) => set("pin_code", e.target.value.replace(/\D/g, "").slice(0, 6))} />
            </Field>
          </div>

          <SectionTitle title="HSN / SAC Codes" />
          <div className="space-y-2">
            {hsn.map((h, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Input className="col-span-3" placeholder="HSN/SAC code" value={h.code} onChange={(e) => setHsn((p) => p.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} />
                <Input className="col-span-8" placeholder="Description" value={h.description} onChange={(e) => setHsn((p) => p.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setHsn((p) => p.filter((_, j) => j !== i))} disabled={hsn.length === 1}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setHsn((p) => [...p, { code: "", description: "" }])}>
              + Add HSN
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4 p-5">
          <SectionTitle title="Bank Details" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Account Holder Name"><Input value={form.bank_account_name} onChange={(e) => set("bank_account_name", e.target.value)} /></Field>
            <Field label="Account Number"><Input value={form.bank_account_no} onChange={(e) => set("bank_account_no", e.target.value)} /></Field>
            <Field label="IFSC"><Input value={form.bank_ifsc} onChange={(e) => set("bank_ifsc", e.target.value.toUpperCase())} placeholder="ABCD0001234" /></Field>
            <Field label="Bank Name"><Input value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} /></Field>
            <Field label="Branch" className="md:col-span-2"><Input value={form.bank_branch} onChange={(e) => set("bank_branch", e.target.value)} /></Field>
          </div>

          <SectionTitle title="Authorised Signatory" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><Input value={form.signatory_name} onChange={(e) => set("signatory_name", e.target.value)} /></Field>
            <Field label="Designation"><Input value={form.signatory_designation} onChange={(e) => set("signatory_designation", e.target.value)} /></Field>
            <Field label="PAN"><Input value={form.signatory_pan} onChange={(e) => set("signatory_pan", e.target.value.toUpperCase().slice(0, 10))} /></Field>
            <Field label="Mobile"><Input value={form.signatory_mobile} onChange={(e) => set("signatory_mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} /></Field>
            <Field label="Email" className="md:col-span-2"><Input value={form.signatory_email} onChange={(e) => set("signatory_email", e.target.value)} type="email" /></Field>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="space-y-4 p-5">
          <SectionTitle title="Upload Documents" />
          {appNo && <Badge variant="outline">Application No. {appNo}</Badge>}
          <div className="grid gap-3 md:grid-cols-2">
            {ALL_DOCS.map((d) => {
              const file = docMap[d.id];
              const uploaded = uploadedTypes.has(d.id);
              return (
                <label
                  key={d.id}
                  className={cn(
                    "group relative flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-dashed p-3 transition-colors",
                    uploaded ? "border-emerald-500/50 bg-emerald-500/5" : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold">
                      {d.label}
                      {d.required && <span className="ml-1 text-rose-500">*</span>}
                    </div>
                    {file && <div className="truncate text-[11px] text-muted-foreground">{file.name}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadingId === d.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : uploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => handleFile(d.id, e.target.files?.[0] || null)}
                  />
                </label>
              );
            })}
          </div>

          {/* Fee summary */}
          <div className="mt-4 grid gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fee Summary</div>
              <div className="mt-2 space-y-1 text-[13px]">
                <Row label="Service Charge" value={formatINR(price)} />
                <Row label="Government Fee" value={formatINR(govt)} />
                <div className="mt-2 border-t border-border pt-2">
                  <Row label={<span className="font-bold">Total Payable</span>} value={<span className="font-display text-lg font-bold">{formatINR(total)}</span>} />
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wallet</div>
                <div className="mt-2 font-display text-2xl font-bold tabular-nums">{formatINR(balance)}</div>
              </div>
              {balance < total && (
                <Button variant="outline" className="mt-2" onClick={() => navigate({ to: "/recharge" })}>
                  Insufficient — Add Money <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {missingDocs.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12.5px] text-amber-700 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>Missing required documents: {missingDocs.map((d) => d.label).join(", ")}</div>
            </div>
          )}
        </Card>
      )}

      {/* Step controls */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || createMut.isPending}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < 4 ? (
          <Button onClick={handleNext} disabled={createMut.isPending}>
            {createMut.isPending && step === 3 ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            {step === 3 ? "Save & Continue to Documents" : "Next"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={openConfirm} disabled={missingDocs.length > 0 || balance < total}>
            Submit Application
          </Button>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>
              {formatINR(total)} will be debited from your wallet and the application will be sent for processing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1 rounded-lg border border-border bg-muted/40 p-3 text-[13px]">
            <Row label="Business" value={form.business_name} />
            <Row label="Applicant" value={form.applicant_name} />
            <Row label="PAN" value={form.pan} />
            <Row label="Total" value={formatINR(total)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitMut.isPending}>Cancel</Button>
            <Button onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>
              {submitMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Confirm & Pay {formatINR(total)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="font-display text-[15px] font-bold leading-tight">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </div>
    </Card>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="font-display text-base font-bold">{title}</div>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[12px] font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

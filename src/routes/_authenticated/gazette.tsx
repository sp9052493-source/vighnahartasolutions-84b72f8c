import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Newspaper,
  ShieldCheck,
  Wallet,
  Loader2,
  Upload,
  X,
  CheckCircle2,
  Paperclip,
  IndianRupee,
  Scale,
  FileSignature,
  Sparkles,
  ArrowRight,
  AlertCircle,
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
import { getSarkarServiceByType } from "@/lib/sarkar-services.functions";
import { getGazetteSampleUrl } from "@/lib/gazette-admin.functions";
import { FileDown } from "lucide-react";
import { submitAapleSarkarApplication } from "@/lib/aaple-sarkar.functions";
import { getDraft, deleteDraft } from "@/lib/drafts.functions";
import { SaveDraftButton, ServiceDraftsList } from "@/components/portal/DraftControls";

const gazetteSearchSchema = z.object({
  draft: fallback(z.string().uuid().optional(), undefined),
});

export const Route = createFileRoute("/_authenticated/gazette")({
  validateSearch: zodValidator(gazetteSearchSchema),
  head: () => ({
    meta: [
      { title: "Gazette Certificate — Vighnaharta Solutions" },
      {
        name: "description",
        content:
          "Apply for official Government Gazette notification — change of Name, Date of Birth, Religion, Father's Name or Address.",
      },
    ],
  }),
  component: GazettePage,
});

type FileItem = { name: string; base64: string; contentType: string };

type ChangeTypeCfg = {
  value: string;
  en: string;
  mr: string;
  needsOld: boolean;
  needsNew: boolean;
  active: boolean;
};
type ConditionalField = {
  key: string;
  en: string;
  mr: string;
  type: "text" | "number" | "textarea";
  required: boolean;
  appearsFor: string[];
};
type DocCfg = {
  id: string;
  en: string;
  mr: string;
  required: boolean;
  appearsFor: string[];
};

const FALLBACK_CHANGE_TYPES: ChangeTypeCfg[] = [
  { value: "name", en: "Change of Name", mr: "नावात बदल", needsOld: true, needsNew: true, active: true },
  { value: "dob", en: "Change of Date of Birth", mr: "जन्मतारखेत बदल", needsOld: true, needsNew: true, active: true },
  { value: "religion", en: "Change of Religion", mr: "धर्मात बदल", needsOld: true, needsNew: true, active: true },
  { value: "father", en: "Change of Father's / Husband's Name", mr: "वडील / पतीच्या नावात बदल", needsOld: true, needsNew: true, active: true },
  { value: "address", en: "Change of Address", mr: "पत्त्यात बदल", needsOld: true, needsNew: true, active: true },
  { value: "minor", en: "Minor Correction (Spelling / Surname)", mr: "लहान दुरुस्ती", needsOld: true, needsNew: true, active: true },
  { value: "other", en: "Other Personal Record Correction", mr: "इतर वैयक्तिक नोंद दुरुस्ती", needsOld: true, needsNew: true, active: true },
];

const FALLBACK_DOCS: DocCfg[] = [
  { id: "aadhaar", en: "Aadhaar Card", mr: "आधार कार्ड", required: true, appearsFor: [] },
  { id: "photo", en: "Passport Size Photo (under 2 MB)", mr: "पासपोर्ट फोटो (२ MB)", required: true, appearsFor: [] },
  { id: "declaration", en: "Signed Declaration / Affidavit", mr: "स्वाक्षरीत प्रतिज्ञापत्र", required: true, appearsFor: [] },
  { id: "old_proof", en: "Proof of Old / Current Details", mr: "जुन्या तपशीलाचा पुरावा", required: true, appearsFor: [] },
  { id: "new_proof", en: "Proof of New / Corrected Details", mr: "नवीन तपशीलाचा पुरावा", required: true, appearsFor: [] },
  { id: "address_proof", en: "Address Proof", mr: "पत्त्याचा पुरावा", required: true, appearsFor: [] },
  { id: "legal_doc", en: "Legal Document (Court / School / Marriage Cert.)", mr: "कायदेशीर कागदपत्र", required: false, appearsFor: [] },
  { id: "other", en: "Other Supporting Document", mr: "इतर सहाय्यक कागदपत्र", required: false, appearsFor: [] },
];

function readFile(file: File): Promise<FileItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, base64: String(reader.result), contentType: file.type });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  changeType: "" as string,
  oldValue: "",
  newValue: "",
  reason: "",
  salutation: "",
  applicantName: "",
  fatherName: "",
  gender: "",
  dob: "",
  age: "",
  aadhaar: "",
  mobile: "",
  email: "",
  isMinor: "no",
  address: "",
  village: "",
  taluka: "",
  district: "",
  state: "Maharashtra",
  pincode: "",
  caste: "",
  newspaperPref: "",
};

function GazettePage() {
  const { data: me } = useMe();
  const balance = me?.balance ?? 0;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { draft: draftIdFromUrl } = useSearch({ from: "/_authenticated/gazette" });
  const getSvcFn = useServerFn(getSarkarServiceByType);
  const submitFn = useServerFn(submitAapleSarkarApplication);
  const getDraftFn = useServerFn(getDraft);
  const deleteDraftFn = useServerFn(deleteDraft);
  const getSampleFn = useServerFn(getGazetteSampleUrl);

  const { data: service, isLoading: svcLoading } = useQuery({
    queryKey: ["sarkar-service", "gazette"],
    queryFn: () => getSvcFn({ data: { type: "gazette" } }),
    staleTime: 60_000,
  });

  const { data: sample } = useQuery({
    queryKey: ["gazette-sample"],
    queryFn: () => getSampleFn(),
    staleTime: 5 * 60_000,
  });

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [docMap, setDocMap] = useState<Record<string, FileItem | null>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receipt, setReceipt] = useState<{ receiptNo: string; charged: number } | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>(draftIdFromUrl);

  // Hydrate from draft when arriving with ?draft=<id>
  useEffect(() => {
    if (!draftIdFromUrl) return;
    setDraftId(draftIdFromUrl);
    let cancelled = false;
    getDraftFn({ data: { id: draftIdFromUrl } })
      .then((row) => {
        if (cancelled || !row) return;
        const data = (row.form_data || {}) as { form?: any; extra?: Record<string, string> };
        if (data.form) setForm((p) => ({ ...p, ...data.form }));
        if (data.extra) setExtra(data.extra);
        toast.success("Draft loaded — files must be re-attached");
      })
      .catch((e: any) => toast.error(e?.message || "Could not load draft"));
    return () => {
      cancelled = true;
    };
  }, [draftIdFromUrl, getDraftFn]);


  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const price = Number(service?.price ?? 799);

  // Pull dynamic config (admin-editable), with safe fallbacks.
  const cfgChangeTypes = (((service as any)?.config?.change_types ?? []) as ChangeTypeCfg[])
    .filter((c) => c && c.value && c.active !== false);
  const CHANGE_TYPES: ChangeTypeCfg[] = cfgChangeTypes.length ? cfgChangeTypes : FALLBACK_CHANGE_TYPES;
  const cfgFields = ((service?.extraFields ?? []) as ConditionalField[]).filter((f) => f && f.key);
  const cfgDocs = ((service?.requiredDocs ?? []) as DocCfg[]).filter((d) => d && d.id);
  const ALL_DOCS: DocCfg[] = cfgDocs.length ? cfgDocs : FALLBACK_DOCS;

  const selected = CHANGE_TYPES.find((c) => c.value === form.changeType);

  // Filter conditional fields & docs by the chosen change type.
  const visibleFields = cfgFields.filter(
    (f) => !f.appearsFor || f.appearsFor.length === 0 || (selected && f.appearsFor.includes(selected.value)),
  );
  const visibleDocs = ALL_DOCS.filter(
    (d) => !d.appearsFor || d.appearsFor.length === 0 || (selected && d.appearsFor.includes(selected.value)),
  );

  async function onFile(slot: string, file: File | null) {
    if (!file) return setDocMap((p) => ({ ...p, [slot]: null }));
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    const fi = await readFile(file);
    setDocMap((p) => ({ ...p, [slot]: { ...fi, name: `${slot}__${fi.name}` } }));
  }

  const missingDocs = useMemo(
    () => visibleDocs.filter((d) => d.required && !docMap[d.id]),
    [visibleDocs, docMap],
  );
  const missingFields = useMemo(
    () => visibleFields.filter((f) => f.required && !(extra[f.key] || "").trim()),
    [visibleFields, extra],
  );

  const mut = useMutation({
    mutationFn: (vars: any) => submitFn({ data: vars }),
    onSuccess: async (res: any) => {
      setReceipt({ receiptNo: res.receiptNo, charged: Number(res.charged || 0) });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-aaple-sarkar"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
      // Clean up the draft, if any
      if (draftId) {
        try {
          await deleteDraftFn({ data: { id: draftId } });
          queryClient.invalidateQueries({ queryKey: ["my-drafts"] });
        } catch {}
        setDraftId(undefined);
        navigate({ to: "/gazette", search: {} });
      }
      toast.success("Gazette application submitted");
      setConfirmOpen(false);
      setForm({ ...EMPTY_FORM });
      setExtra({});
      setDocMap({});
    },
    onError: (e: any) => {
      toast.error(e?.message || "Submission failed");
      setConfirmOpen(false);
    },
  });

  function validate() {
    if (!form.changeType) return "Select the type of change";
    if (selected?.needsOld !== false && !form.oldValue.trim()) return "Enter the current / old value";
    if (selected?.needsNew !== false && !form.newValue.trim()) return "Enter the new / corrected value";
    if (!form.reason.trim() || form.reason.trim().length < 8) return "Provide a clear reason (min 8 characters)";
    if (!form.applicantName.trim()) return "Enter applicant full name";
    if (!form.salutation) return "Select salutation";
    if (!form.gender) return "Select gender";
    if (!form.dob.trim()) return "Enter date of birth";
    if (!form.age.trim()) return "Enter age";
    if (!/^[0-9]{12}$/.test(form.aadhaar)) return "Enter a valid 12-digit Aadhaar number";
    if (!/^[0-9]{10}$/.test(form.mobile)) return "Enter a valid 10-digit mobile number";
    if (form.address.trim().length < 6) return "Enter a complete address";
    if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) return "Enter a valid 6-digit pincode";
    if (missingFields.length)
      return "Fill required fields: " + missingFields.map((f) => f.en).join(", ");
    if (missingDocs.length)
      return "Upload required documents: " + missingDocs.map((d) => d.en).join(", ");
    if (balance < price) return `Insufficient balance. Need ${formatINR(price)}.`;
    return null;
  }

  function open() {
    const err = validate();
    if (err) return toast.error(err);
    setConfirmOpen(true);
  }

  function submit() {
    const allDocs = Object.values(docMap).filter(Boolean) as FileItem[];
    const meta = selected ? `${selected.en} (${selected.mr})` : form.changeType;
    const notes = [
      `Change Type: ${meta}`,
      `Old Value: ${form.oldValue}`,
      `New Value: ${form.newValue}`,
      `Reason: ${form.reason}`,
      `Salutation: ${form.salutation}`,
      `Gender: ${form.gender}`,
      `DOB: ${form.dob}`,
      `Age: ${form.age}`,
      `Aadhaar: ${form.aadhaar}`,
      form.isMinor === "yes" ? "Minor: Yes" : null,
      form.caste ? `Caste: ${form.caste}` : null,
      form.village ? `Village: ${form.village}` : null,
      form.newspaperPref ? `Preferred Newspaper: ${form.newspaperPref}` : null,
      ...visibleFields
        .map((f) => (extra[f.key] ? `${f.en}: ${extra[f.key]}` : null)),
    ]
      .filter(Boolean)
      .join("\n");

    mut.mutate({
      serviceType: "gazette",
      serviceLabel: "Gazette Certificate",
      applicantName: form.applicantName,
      fatherName: form.fatherName,
      mobile: form.mobile,
      email: form.email,
      address: form.address,
      district: form.district,
      taluka: form.taluka,
      pincode: form.pincode,
      purpose: meta,
      notes,
      documents: allDocs.slice(0, 8),
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,oklch(0.32_0.10_50)_0%,oklch(0.22_0.08_45)_100%)] p-6 text-primary-foreground shadow-elegant">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[oklch(0.76_0.16_64)]/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg,#FF9933,#ffffff,#138808)] opacity-60" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/30 backdrop-blur">
            <Newspaper className="h-10 w-10 text-[oklch(0.92_0.10_75)]" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em]">
              <ShieldCheck className="h-3 w-3" /> Government of India · Gazette Notification
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Gazette Certificate</h1>
            <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-primary-foreground/80">
              Official publication for change of <b>Name</b>, <b>Date of Birth</b>, <b>Religion</b>,{" "}
              <b>Father's Name</b>, <b>Address</b> and other personal record corrections.
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

      {/* Quick info strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <InfoTile icon={Scale} label="Issued By" value="Department of Publication" sub="Government of India" />
        <InfoTile icon={FileSignature} label="Turnaround" value="15 – 45 days" sub="After document verification" />
        <InfoTile
          icon={IndianRupee}
          label="Service Fee"
          value={svcLoading ? "—" : formatINR(price)}
          sub="Debited from wallet on submit"
        />
      </div>

      {sample?.url && (
        <a
          href={sample.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between gap-3 rounded-xl border border-[oklch(0.68_0.18_55)]/30 bg-[oklch(0.68_0.18_55)]/5 p-4 transition-colors hover:border-[oklch(0.68_0.18_55)]/60 hover:bg-[oklch(0.68_0.18_55)]/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[linear-gradient(135deg,oklch(0.68_0.18_55),oklch(0.55_0.17_40))] text-white">
              <FileDown className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[oklch(0.55_0.17_40)]">
                Sample / Demo Document
              </div>
              <div className="text-[13.5px] font-semibold leading-tight">
                Download {sample.name || "sample form"}
              </div>
              <div className="text-[11.5px] text-muted-foreground">
                Reference filled-format issued by Gazette office.
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[oklch(0.55_0.17_40)] transition-transform group-hover:translate-x-1" />
        </a>
      )}

      {/* 1 — Type of Change */}
      <Card className="p-5 shadow-card">
        <SectionHeading n={1} title="Type of Change" subtitle="Select what needs to be officially published." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHANGE_TYPES.map((c) => {
            const active = form.changeType === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => set("changeType", c.value)}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-elegant",
                  active
                    ? "border-[oklch(0.68_0.18_55)] bg-[oklch(0.68_0.18_55)]/8 ring-2 ring-[oklch(0.68_0.18_55)]/40"
                    : "border-border hover:border-[oklch(0.68_0.18_55)]/40",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-[linear-gradient(135deg,oklch(0.68_0.18_55),oklch(0.55_0.17_40))] text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold leading-tight">{c.en}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">{c.mr}</div>
                </div>
                {active && (
                  <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-[oklch(0.68_0.18_55)]" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {selected && (
        <Card className="p-5 shadow-card">
          <SectionHeading n={2} title="Change Details" subtitle={`Specify the change for: ${selected.en}`} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {selected.needsOld !== false && (
              <Field label="Current / Old Value" req hint="As per existing records">
                <Input
                  value={form.oldValue}
                  onChange={(e) => set("oldValue", e.target.value)}
                  placeholder="e.g. Ramesh Kumar Patil"
                />
              </Field>
            )}
            {selected.needsNew !== false && (
              <Field label="New / Corrected Value" req hint="To be published in Gazette">
                <Input
                  value={form.newValue}
                  onChange={(e) => set("newValue", e.target.value)}
                  placeholder="e.g. Ram Patil"
                />
              </Field>
            )}
            <div className="sm:col-span-2">
              <Field label="Reason for Change" req>
                <Textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  placeholder="State the genuine reason — e.g. spelling correction, marriage, religion conversion, court order, etc."
                />
              </Field>
            </div>
            {visibleFields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                <Field label={f.en} req={f.required} hint={f.mr}>
                  {f.type === "textarea" ? (
                    <Textarea
                      rows={3}
                      value={extra[f.key] || ""}
                      onChange={(e) => setExtra((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : "text"}
                      value={extra[f.key] || ""}
                      onChange={(e) => setExtra((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Applicant */}
      <Card className="p-5 shadow-card">
        <SectionHeading n={3} title="Applicant Personal Details" subtitle="Match exactly with Aadhaar." />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Salutation" req>
            <Select value={form.salutation} onValueChange={(v) => set("salutation", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Shri / Smt / Kumari" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Shri">Shri (श्री)</SelectItem>
                <SelectItem value="Smt">Smt (सौ.)</SelectItem>
                <SelectItem value="Kumari">Kumari (कु.)</SelectItem>
                <SelectItem value="Dr">Dr (डॉ.)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Full Name (as on Aadhaar)" req>
              <Input
                value={form.applicantName}
                onChange={(e) => set("applicantName", e.target.value)}
                placeholder="Full name"
              />
            </Field>
          </div>
          <Field label="Father's / Husband's Name">
            <Input
              value={form.fatherName}
              onChange={(e) => set("fatherName", e.target.value)}
              placeholder="Father / Husband name"
            />
          </Field>
          <Field label="Gender" req>
            <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Is the applicant a minor?">
            <Select value={form.isMinor} onValueChange={(v) => set("isMinor", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes (under 18)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date of Birth" req>
            <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
          </Field>
          <Field label="Age (years)" req>
            <Input
              type="number"
              min={0}
              max={120}
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
            />
          </Field>
          <Field label="Caste / Category">
            <Input
              value={form.caste}
              onChange={(e) => set("caste", e.target.value)}
              placeholder="Open / OBC / SC / ST / VJNT"
            />
          </Field>
          <Field label="Aadhaar / UID Number" req>
            <Input
              inputMode="numeric"
              maxLength={12}
              value={form.aadhaar}
              onChange={(e) => set("aadhaar", e.target.value.replace(/\D/g, ""))}
              placeholder="12-digit number"
            />
          </Field>
          <Field label="Mobile Number" req>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="optional"
            />
          </Field>
        </div>
      </Card>

      {/* Address */}
      <Card className="p-5 shadow-card">
        <SectionHeading n={4} title="Address Details" subtitle="Permanent residential address." />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Field label="Full Address (Flat / Block / Street)" req>
              <Textarea
                rows={2}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Village">
            <Input value={form.village} onChange={(e) => set("village", e.target.value)} />
          </Field>
          <Field label="Taluka">
            <Input value={form.taluka} onChange={(e) => set("taluka", e.target.value)} />
          </Field>
          <Field label="District">
            <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
          </Field>
          <Field label="Pincode">
            <Input
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="Preferred Newspaper" hint="Optional">
            <Input
              value={form.newspaperPref}
              onChange={(e) => set("newspaperPref", e.target.value)}
              placeholder="e.g. Loksatta"
            />
          </Field>
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-5 shadow-card">
        <SectionHeading
          n={5}
          title="Upload Documents"
          subtitle="PDF or image, up to 5 MB each. Required documents are highlighted."
        />
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {visibleDocs.map((d) => {
            const file = docMap[d.id];
            return (
              <li
                key={d.id}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
                  file
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : d.required
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-muted/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      file ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {file ? <CheckCircle2 className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold">{d.en}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-1.5 py-0 text-[10px]",
                          d.required
                            ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {d.required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted-foreground">{d.mr}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {file && (
                    <button
                      type="button"
                      onClick={() => onFile(d.id, null)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:bg-muted/50">
                    <Upload className="h-3.5 w-3.5" />
                    {file ? "Replace" : "Attach"}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => onFile(d.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Drafts for this service */}
      <ServiceDraftsList serviceKey="gazette" resumeHref={(id) => `/gazette?draft=${id}`} />

      {/* Payment + submit */}
      <Card className="flex flex-col gap-4 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="h-9 w-9 rounded-lg bg-primary/10 p-2 text-primary" />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Wallet</div>
            <div className="font-display text-lg font-bold tabular-nums">{formatINR(balance)}</div>
          </div>
          <div className="ml-4 border-l border-border pl-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Service Fee</div>
            <div className="font-display text-lg font-bold tabular-nums text-[oklch(0.55_0.17_40)]">
              {formatINR(price)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <SaveDraftButton
            serviceKey="gazette"
            serviceLabel="Gazette Certificate"
            draftId={draftId}
            size="default"
            buildPayload={() => ({
              customer_name: form.applicantName || form.mobile || null,
              summary: selected ? `${selected.en}${form.newValue ? ` → ${form.newValue}` : ""}` : "Gazette draft",
              form_data: { form, extra },
            })}
            onSaved={(row) => setDraftId(row.id)}
          />
          <Button
            onClick={open}
            disabled={mut.isPending || svcLoading}
            size="lg"
            className="gap-2 bg-[linear-gradient(135deg,oklch(0.68_0.18_55),oklch(0.55_0.17_40))] hover:opacity-95"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
            Pay &amp; Submit Application
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Gazette Application</DialogTitle>
            <DialogDescription>
              {formatINR(price)} will be debited from your wallet immediately on submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <Row label="Service" value="Gazette Certificate" />
              <Row label="Change Type" value={selected?.en ?? "—"} />
              <Row label="Applicant" value={form.applicantName} />
              <Row label="Fee" value={formatINR(price)} bold />
              <Row label="Balance after" value={formatINR(Math.max(0, balance - price))} />
            </div>
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-[12px] text-amber-700 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Once submitted, details cannot be edited. Please verify the change before paying.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={mut.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={mut.isPending} className="gap-2">
              {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm &amp; Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Application Submitted
            </DialogTitle>
            <DialogDescription>
              Track status under <b>Aaple Sarkar → My Applications</b>.
            </DialogDescription>
          </DialogHeader>
          {receipt && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <Row label="Receipt Number" value={receipt.receiptNo} bold />
              <Row label="Amount Charged" value={formatINR(receipt.charged)} />
              <Row label="Status" value="Submitted" />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setReceipt(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionHeading({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,oklch(0.68_0.18_55),oklch(0.55_0.17_40))] text-sm font-bold text-white">
        {n}
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({
  label,
  req,
  hint,
  children,
}: {
  label: string;
  req?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1 text-xs font-semibold">
        {label}
        {req && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[10.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Newspaper;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4 shadow-card">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[oklch(0.68_0.18_55)]/10 text-[oklch(0.55_0.17_40)]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="font-display text-base font-bold leading-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </div>
    </Card>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="mt-1.5 flex items-center justify-between text-sm first:mt-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", bold ? "font-bold text-primary" : "font-semibold")}>{value}</span>
    </div>
  );
}

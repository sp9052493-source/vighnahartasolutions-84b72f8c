import { useState, useRef, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Landmark,
  Loader2,
  Upload,
  X,
  FileText,
  CheckCircle2,
  Languages,
  Download,
  Eye,
  Clock,
  Wallet,
  IndianRupee,
  ShieldCheck,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  submitAapleSarkarApplication,
  listMyAapleSarkar,
  getAapleSarkarDetail,
} from "@/lib/aaple-sarkar.functions";
import { listSarkarServices } from "@/lib/sarkar-services.functions";
import { translateToMarathi } from "@/lib/translate.functions";
import {
  AAPLE_SARKAR_LOGO,
  STATUS_META,
  TX,
  t,
  type Lang,
  type SarkarService,
  type StatusKey,
} from "@/lib/aaple-sarkar.shared";
import { useMe, formatINR } from "@/lib/queries";


export const Route = createFileRoute("/_authenticated/aaple-sarkar")({
  head: () => ({ meta: [{ title: "Aaple Sarkar — Vighnaharta Solutions" }] }),
  component: AapleSarkar,
});

type FileItem = { name: string; base64: string; contentType: string };

function readFile(file: File): Promise<FileItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, base64: String(reader.result), contentType: file.type });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AapleSarkar() {
  const [lang, setLang] = useState<Lang>("en");
  const L = (k: keyof typeof TX) => t(k, lang);
  const { data: me } = useMe();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[oklch(0.27_0.08_262)] via-[oklch(0.3_0.09_262)] to-[oklch(0.22_0.07_262)] p-6 text-primary-foreground shadow-elegant">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[oklch(0.76_0.16_64)]/25 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <img
            src={AAPLE_SARKAR_LOGO}
            alt="Aaple Sarkar"
            className="h-20 w-auto shrink-0 rounded-xl bg-white p-2 shadow-lg"
          />
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.22em]">
              <ShieldCheck className="h-3 w-3" /> Government of Maharashtra
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{L("title")}</h1>
            <p className="mt-1.5 max-w-2xl text-[13.5px] font-medium leading-relaxed text-primary-foreground/75">
              {L("subtitle")}
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              <Wallet className="h-3.5 w-3.5" /> {L("walletBalance")}
            </div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums">
              {formatINR(me?.balance ?? 0)}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="apply">
        <TabsList>
          <TabsTrigger value="apply">{L("apply")}</TabsTrigger>
          <TabsTrigger value="mine">{L("myApps")}</TabsTrigger>
        </TabsList>
        <TabsContent value="apply" className="mt-5">
          <ApplyForm lang={lang} setLang={setLang} balance={me?.balance ?? 0} />
        </TabsContent>
        <TabsContent value="mine" className="mt-5">
          <MyApplications lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const EMPTY_FORM = {
  applicantName: "",
  applicantNameMr: "",
  fatherName: "",
  fatherNameMr: "",
  mobile: "",
  email: "",
  address: "",
  addressMr: "",
  district: "",
  taluka: "",
  pincode: "",
  purpose: "",
  notes: "",
};

function ApplyForm({
  lang,
  setLang,
  balance,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  balance: number;
}) {
  const L = (k: keyof typeof TX) => t(k, lang);
  const queryClient = useQueryClient();
  const submitFn = useServerFn(submitAapleSarkarApplication);
  const translateFn = useServerFn(translateToMarathi);
  const formRef = useRef<HTMLDivElement>(null);

  const [service, setService] = useState<SarkarService | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [docMap, setDocMap] = useState<Record<string, FileItem | null>>({});
  const [receipt, setReceipt] = useState<{ receiptNo: string; status: string; charged: number } | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (service && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      setDocMap({});
      setExtras({});
    }
  }, [service]);

  const translate = useMutation({
    mutationFn: () =>
      translateFn({
        data: {
          fields: {
            applicantName: form.applicantName,
            fatherName: form.fatherName,
            address: form.address,
          },
        },
      }),
    onSuccess: (res: any) => {
      const tr = res?.translations ?? {};
      setForm((p) => ({
        ...p,
        applicantNameMr: tr.applicantName || p.applicantNameMr,
        fatherNameMr: tr.fatherName || p.fatherNameMr,
        addressMr: tr.address || p.addressMr,
      }));
      toast.success(lang === "en" ? "Translated to Marathi" : "मराठीत भाषांतर झाले");
    },
    onError: (e: any) => toast.error(e?.message || "Translation failed"),
  });

  const mutation = useMutation({
    mutationFn: (vars: any) => submitFn({ data: vars }),
    onSuccess: (res: any) => {
      setReceipt({ receiptNo: res.receiptNo, status: res.status, charged: Number(res.charged || 0) });
      queryClient.invalidateQueries({ queryKey: ["my-aaple-sarkar"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
      toast.success(lang === "en" ? "Application submitted & paid" : "अर्ज सादर व शुल्क भरले");
      setForm({ ...EMPTY_FORM });
      setFiles([]);
      setDocMap({});
      setExtras({});
      setService(null);
      setConfirmOpen(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Could not submit application");
      setConfirmOpen(false);
    },
  });

  async function onSlotFile(slotId: string, file: File | null) {
    if (!file) {
      setDocMap((p) => ({ ...p, [slotId]: null }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(lang === "en" ? "File must be under 5 MB" : "फाईल ५ MB पेक्षा कमी असावी");
      return;
    }
    const fi = await readFile(file);
    setDocMap((p) => ({ ...p, [slotId]: { ...fi, name: `${slotId}__${fi.name}` } }));
  }

  async function onExtraFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    const tooBig = list.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error(lang === "en" ? "Each file must be under 5 MB" : "प्रत्येक फाईल ५ MB पेक्षा कमी असावी");
      return;
    }
    const read = await Promise.all(list.map(readFile));
    setFiles((p) => [...p, ...read].slice(0, 6));
    e.target.value = "";
  }

  const missingRequiredDocs = useMemo(() => {
    if (!service) return [];
    return service.requiredDocs.filter((d) => d.required && !docMap[d.id]);
  }, [service, docMap]);

  const missingRequiredExtras = useMemo(() => {
    if (!service) return [];
    return service.extraFields.filter((f) => f.required && !(extras[f.key] || "").trim());
  }, [service, extras]);

  function validateAndOpen() {
    if (!service) {
      toast.error(lang === "en" ? "Please select a service" : "कृपया सेवा निवडा");
      return;
    }
    if (!form.applicantName.trim() || !/^[0-9]{10}$/.test(form.mobile) || form.address.trim().length < 4) {
      toast.error(lang === "en" ? "Fill name, valid mobile and address" : "नाव, वैध मोबाईल व पत्ता भरा");
      return;
    }
    if (missingRequiredExtras.length) {
      toast.error(
        (lang === "en" ? "Missing: " : "हरवले: ") +
          missingRequiredExtras.map((f) => (lang === "en" ? f.en : f.mr)).join(", "),
      );
      return;
    }
    if (missingRequiredDocs.length) {
      toast.error(
        (lang === "en" ? "Upload required documents: " : "आवश्यक कागदपत्रे अपलोड करा: ") +
          missingRequiredDocs.map((d) => (lang === "en" ? d.en : d.mr)).join(", "),
      );
      return;
    }
    if (balance < (service.price || 0)) {
      toast.error(
        lang === "en"
          ? `Insufficient balance. Need ${formatINR(service.price)}.`
          : `अपुरी शिल्लक. आवश्यक ${formatINR(service.price)}.`,
      );
      return;
    }
    setConfirmOpen(true);
  }

  function doSubmit() {
    if (!service) return;
    const slotFiles = Object.values(docMap).filter(Boolean) as FileItem[];
    const allDocs = [...slotFiles, ...files].slice(0, 8);

    const extraNotes = service.extraFields
      .filter((f) => (extras[f.key] || "").trim())
      .map((f) => `${f.en}: ${extras[f.key]}`)
      .join(" | ");

    mutation.mutate({
      serviceType: service.type,
      serviceLabel: service.en,
      applicantName: form.applicantName,
      applicantNameMr: form.applicantNameMr,
      fatherName: form.fatherName,
      mobile: form.mobile,
      email: form.email,
      address: form.address,
      district: form.district,
      taluka: form.taluka,
      pincode: form.pincode,
      purpose: form.purpose,
      notes: [
        form.notes,
        extraNotes && `Service details — ${extraNotes}`,
        form.fatherNameMr && `वडील/पती (मराठी): ${form.fatherNameMr}`,
        form.addressMr && `पत्ता (मराठी): ${form.addressMr}`,
      ]
        .filter(Boolean)
        .join("\n"),
      documents: allDocs,
    });
  }

  return (
    <div className="space-y-6">
      {/* Service selection */}
      <Card className="p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{L("selectService")}</h2>
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <ShieldCheck className="h-3 w-3" /> Verified portal
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SARKAR_SERVICES.map((s) => {
            const active = service?.type === s.type;
            return (
              <button
                key={s.type}
                type="button"
                onClick={() => setService(s)}
                className={cn(
                  "group relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-elegant",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-primary-foreground shadow-sm",
                      s.tone,
                    )}
                  >
                    <Landmark className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold tabular-nums text-accent-foreground">
                    <IndianRupee className="h-3 w-3" />
                    {s.price}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight">{lang === "en" ? s.en : s.mr}</div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    {lang === "en" ? s.mr : s.en}
                  </div>
                </div>
                {active && (
                  <CheckCircle2 className="absolute right-2 top-2 h-5 w-5 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {!service && (
        <Card className="border-dashed p-8 text-center text-sm text-muted-foreground shadow-card">
          {L("chooseService")}
        </Card>
      )}

      {service && (
        <div ref={formRef} className="space-y-6">
          {/* Selected service banner */}
          <Card className="flex flex-col gap-3 border-primary/30 bg-primary/5 p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-primary-foreground", service.tone)}>
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-base font-semibold">
                  {lang === "en" ? service.en : service.mr}
                </div>
                <div className="text-xs text-muted-foreground">
                  {lang === "en" ? service.descEn : service.descMr}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {L("serviceFee")}
                </div>
                <div className="font-display text-xl font-bold text-primary tabular-nums">
                  {formatINR(service.price)}
                </div>
              </div>
            </div>
          </Card>

          {/* Applicant Details */}
          <Card className="p-5 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold">{L("applicantDetails")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{L("translateHint")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setLang(lang === "en" ? "mr" : "en")}
                >
                  <Languages className="h-4 w-4" />
                  {lang === "en" ? "मराठी" : "English"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => translate.mutate()}
                  disabled={translate.isPending || !form.applicantName.trim()}
                >
                  {translate.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Languages className="h-4 w-4" />
                  )}
                  {translate.isPending ? L("translating") : L("translateBtn")}
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={L("name")} req>
                <Input value={form.applicantName} onChange={(e) => set("applicantName", e.target.value)} />
              </Field>
              <Field label={L("nameMr")}>
                <Input value={form.applicantNameMr} onChange={(e) => set("applicantNameMr", e.target.value)} />
              </Field>
              <Field label={L("father")}>
                <Input value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} />
              </Field>
              <Field label={L("fatherMr")}>
                <Input value={form.fatherNameMr} onChange={(e) => set("fatherNameMr", e.target.value)} />
              </Field>
              <Field label={L("mobile")} req>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label={L("email")}>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label={L("purpose")}>
                <Input value={form.purpose} onChange={(e) => set("purpose", e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={L("address")} req>
                  <Textarea rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={L("addressMr")}>
                  <Textarea rows={2} value={form.addressMr} onChange={(e) => set("addressMr", e.target.value)} />
                </Field>
              </div>
              <Field label={L("district")}>
                <Input value={form.district} onChange={(e) => set("district", e.target.value)} />
              </Field>
              <Field label={L("taluka")}>
                <Input value={form.taluka} onChange={(e) => set("taluka", e.target.value)} />
              </Field>
              <Field label={L("pincode")}>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={L("notes")}>
                  <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </Field>
              </div>
            </div>
          </Card>

          {/* Service-specific fields */}
          {service.extraFields.length > 0 && (
            <Card className="p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold">{L("serviceDetails")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {lang === "en"
                  ? `Specific details required for ${service.en}.`
                  : `${service.mr} साठी आवश्यक विशिष्ट माहिती.`}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {service.extraFields.map((f) => (
                  <Field
                    key={f.key}
                    label={`${lang === "en" ? f.en : f.mr} / ${lang === "en" ? f.mr : f.en}`}
                    req={f.required}
                  >
                    {f.type === "textarea" ? (
                      <Textarea
                        rows={2}
                        value={extras[f.key] || ""}
                        onChange={(e) => setExtras((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        type={f.type === "number" ? "number" : "text"}
                        value={extras[f.key] || ""}
                        onChange={(e) => setExtras((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </Card>
          )}

          {/* Documents checklist */}
          <Card className="p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">{L("uploadDocs")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{L("uploadHint")}</p>
            <ul className="mt-4 space-y-2.5">
              {service.requiredDocs.map((d) => {
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
                          <span className="text-sm font-semibold">
                            {lang === "en" ? d.en : d.mr}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-1.5 py-0 text-[10px]",
                              d.required
                                ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300"
                                : "border-border text-muted-foreground",
                            )}
                          >
                            {d.required ? L("required") : L("optional")}
                          </Badge>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {lang === "en" ? d.mr : d.en}
                          {file && (
                            <span className="ml-2 text-emerald-600 dark:text-emerald-300">
                              · {L("uploaded")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {file && (
                        <button
                          type="button"
                          onClick={() => onSlotFile(d.id, null)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-primary/40 hover:bg-muted/50">
                        <Upload className="h-3.5 w-3.5" />
                        {file ? (lang === "en" ? "Replace" : "बदला") : L("attach")}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => onSlotFile(d.id, e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Extra docs */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                {lang === "en" ? "Add additional documents (optional)" : "अतिरिक्त कागदपत्रे जोडा (पर्यायी)"}
              </summary>
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/40">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {lang === "en" ? "Click to upload extra files" : "अतिरिक्त फायली अपलोड करा"}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={onExtraFiles}
                />
              </label>
              {files.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </Card>

          {/* Payment summary + submit */}
          <Card className="flex flex-col gap-4 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-9 w-9 rounded-lg bg-primary/10 p-2 text-primary" />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {L("walletBalance")}
                </div>
                <div className="font-display text-lg font-bold tabular-nums">{formatINR(balance)}</div>
              </div>
              <div className="ml-4 border-l border-border pl-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {L("serviceFee")}
                </div>
                <div className="font-display text-lg font-bold tabular-nums text-primary">
                  {formatINR(service.price)}
                </div>
              </div>
            </div>
            <Button
              onClick={validateAndOpen}
              disabled={mutation.isPending}
              size="lg"
              className="gap-2"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <IndianRupee className="h-4 w-4" />
              )}
              {L("submit")}
            </Button>
          </Card>
        </div>
      )}

      {/* Confirm pay dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lang === "en" ? "Confirm Payment" : "पेमेंटची पुष्टी करा"}
            </DialogTitle>
            <DialogDescription>
              {lang === "en"
                ? "The service fee will be debited from your wallet immediately on submission."
                : "अर्ज सादर केल्यावर सेवा शुल्क आपल्या वॉलेटमधून त्वरित कापले जाईल."}
            </DialogDescription>
          </DialogHeader>
          {service && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{L("service")}</span>
                  <span className="font-semibold">{lang === "en" ? service.en : service.mr}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{L("serviceFee")}</span>
                  <span className="font-bold text-primary tabular-nums">{formatINR(service.price)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {lang === "en" ? "Balance after" : "त्यानंतर शिल्लक"}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatINR(Math.max(0, balance - service.price))}
                  </span>
                </div>
              </div>
              {balance < service.price && (
                <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {lang === "en" ? "Insufficient wallet balance." : "वॉलेटमध्ये अपुरी शिल्लक."}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={mutation.isPending}>
              {lang === "en" ? "Cancel" : "रद्द"}
            </Button>
            <Button onClick={doSubmit} disabled={mutation.isPending || (service && balance < service.price) || false}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lang === "en" ? "Pay & Submit" : "शुल्क भरून सादर करा"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> {L("receiptTitle")}
            </DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-center">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{L("receiptNo")}</div>
                <div className="mt-1 font-display text-2xl font-bold text-primary">{receipt.receiptNo}</div>
                {receipt.charged > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {lang === "en" ? "Debited from wallet: " : "वॉलेटमधून कापले: "}
                    <span className="font-semibold text-foreground">{formatINR(receipt.charged)}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {lang === "en"
                  ? "Save this receipt number. Status updates appear automatically in My Applications."
                  : "हा पावती क्रमांक जतन करा. स्थिती अद्यतने माझे अर्ज मध्ये आपोआप दिसतील."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {req && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function MyApplications({ lang }: { lang: Lang }) {
  const L = (k: keyof typeof TX) => t(k, lang);
  const listFn = useServerFn(listMyAapleSarkar);
  const { data: apps, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["my-aaple-sarkar"],
    queryFn: () => listFn(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const [detailId, setDetailId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!apps?.length) {
    return <Card className="p-8 text-center text-sm text-muted-foreground shadow-card">{L("noApps")}</Card>;
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {L("liveUpdates")}
        </div>
        <span>
          {lang === "en" ? "Updated " : "अद्यतनित "}
          {new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <Card className="overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{L("receiptNo")}</th>
                <th className="px-4 py-3">{L("service")}</th>
                <th className="px-4 py-3">{L("status")}</th>
                <th className="px-4 py-3">{lang === "en" ? "Fee" : "शुल्क"}</th>
                <th className="px-4 py-3">{L("date")}</th>
                <th className="px-4 py-3 text-right">{L("viewDetails")}</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a: any) => {
                const meta = STATUS_META[a.status as StatusKey];
                return (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{a.receipt_no}</td>
                    <td className="px-4 py-3">{a.service_label}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={meta.badge}>
                        {lang === "en" ? meta.en : meta.mr}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">
                      {formatINR(Number(a.cost || 0))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setDetailId(a.id)}>
                        <Eye className="h-4 w-4" /> {L("viewDetails")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <DetailDialog id={detailId} lang={lang} onClose={() => setDetailId(null)} />
    </>
  );
}

const STATUS_FLOW: StatusKey[] = ["submitted", "under_review", "approved", "completed"];

function DetailDialog({ id, lang, onClose }: { id: string | null; lang: Lang; onClose: () => void }) {
  const L = (k: keyof typeof TX) => t(k, lang);
  const detailFn = useServerFn(getAapleSarkarDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["aaple-sarkar-detail", id],
    queryFn: () => detailFn({ data: { id: id! } }),
    enabled: !!id,
    refetchInterval: id ? 30_000 : false,
  });

  const app = data?.application as any;
  const meta = app ? STATUS_META[app.status as StatusKey] : null;

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{app?.receipt_no || L("viewDetails")}</DialogTitle>
        </DialogHeader>
        {isLoading || !app ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 py-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{app.service_label}</span>
              {meta && (
                <Badge variant="outline" className={meta.badge}>
                  {lang === "en" ? meta.en : meta.mr}
                </Badge>
              )}
            </div>

            {app.status !== "rejected" && (
              <div className="flex items-center justify-between">
                {STATUS_FLOW.map((s) => {
                  const reached = STATUS_META[app.status as StatusKey].step >= STATUS_META[s].step;
                  return (
                    <div key={s} className="flex flex-1 flex-col items-center text-center">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs",
                          reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {reached ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <span className="mt-1 text-[10px] leading-tight text-muted-foreground">
                        {lang === "en" ? STATUS_META[s].en : STATUS_META[s].mr}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Info label={L("name")} value={app.applicant_name} />
              <Info label={L("mobile")} value={app.mobile} />
              <Info label={L("serviceFee")} value={formatINR(Number(app.cost || 0))} />
              {app.district && <Info label={L("district")} value={app.district} />}
              {app.taluka && <Info label={L("taluka")} value={app.taluka} />}
              <div className="col-span-2">
                <Info label={L("address")} value={app.address} />
              </div>
            </dl>

            {data?.signedDocs?.length ? (
              <div>
                <div className="mb-2 text-sm font-semibold">{L("documents")}</div>
                <ul className="space-y-2">
                  {data.signedDocs.map((d: any, i: number) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{d.name}</span>
                      {d.url && (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Download className="h-4 w-4" /> {L("download")}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {data?.resultUrl && (
              <a
                href={data.resultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
              >
                <Download className="h-4 w-4" /> {L("issuedDoc")}
              </a>
            )}

            {app.admin_remarks && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                <div className="mb-1 font-semibold">{L("remarks")}</div>
                <p className="text-muted-foreground">{app.admin_remarks}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

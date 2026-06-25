import { useState } from "react";
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  submitAapleSarkarApplication,
  listMyAapleSarkar,
  getAapleSarkarDetail,
} from "@/lib/aaple-sarkar.functions";
import {
  AAPLE_SARKAR_LOGO,
  SARKAR_SERVICES,
  STATUS_META,
  TX,
  t,
  type Lang,
  type SarkarService,
  type StatusKey,
} from "@/lib/aaple-sarkar.shared";

export const Route = createFileRoute("/_authenticated/aaple-sarkar")({
  head: () => ({ meta: [{ title: "Aaple Sarkar — Sevakart Portal" }] }),
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-card sm:flex-row sm:items-center">
        <img
          src={AAPLE_SARKAR_LOGO}
          alt="Aaple Sarkar"
          className="h-16 w-auto shrink-0 rounded-md bg-white p-1 shadow-sm"
        />
        <div>
          <h1 className="font-display text-2xl font-bold">{L("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{L("subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="apply">
        <TabsList>
          <TabsTrigger value="apply">{L("apply")}</TabsTrigger>
          <TabsTrigger value="mine">{L("myApps")}</TabsTrigger>
        </TabsList>
        <TabsContent value="apply" className="mt-5">
          <ApplyForm lang={lang} setLang={setLang} />
        </TabsContent>
        <TabsContent value="mine" className="mt-5">
          <MyApplications lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApplyForm({ lang }: { lang: Lang }) {
  const L = (k: keyof typeof TX) => t(k, lang);
  const queryClient = useQueryClient();
  const submitFn = useServerFn(submitAapleSarkarApplication);

  const [service, setService] = useState<SarkarService | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [receipt, setReceipt] = useState<{ receiptNo: string; status: string } | null>(null);
  const [form, setForm] = useState({
    applicantName: "",
    applicantNameMr: "",
    fatherName: "",
    mobile: "",
    email: "",
    address: "",
    district: "",
    taluka: "",
    pincode: "",
    purpose: "",
    notes: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (vars: any) => submitFn({ data: vars }),
    onSuccess: (res: any) => {
      setReceipt({ receiptNo: res.receiptNo, status: res.status });
      queryClient.invalidateQueries({ queryKey: ["my-aaple-sarkar"] });
      toast.success(lang === "en" ? "Application submitted" : "अर्ज सादर झाला");
      setForm({
        applicantName: "",
        applicantNameMr: "",
        fatherName: "",
        mobile: "",
        email: "",
        address: "",
        district: "",
        taluka: "",
        pincode: "",
        purpose: "",
        notes: "",
      });
      setFiles([]);
      setService(null);
    },
    onError: (e: any) => toast.error(e?.message || "Could not submit application"),
  });

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    const tooBig = list.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error(lang === "en" ? "Each file must be under 5 MB" : "प्रत्येक फाईल ५ MB पेक्षा कमी असावी");
      return;
    }
    const read = await Promise.all(list.map(readFile));
    setFiles((p) => [...p, ...read].slice(0, 8));
    e.target.value = "";
  }

  function submit() {
    if (!service) {
      toast.error(lang === "en" ? "Please select a service" : "कृपया सेवा निवडा");
      return;
    }
    if (!form.applicantName.trim() || !/^[0-9]{10}$/.test(form.mobile) || form.address.trim().length < 4) {
      toast.error(lang === "en" ? "Fill name, valid mobile and address" : "नाव, वैध मोबाईल व पत्ता भरा");
      return;
    }
    mutation.mutate({
      serviceType: service.type,
      serviceLabel: service.en,
      ...form,
      documents: files,
    });
  }

  return (
    <div className="space-y-6">
      {/* Service selection */}
      <Card className="p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold">{L("selectService")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SARKAR_SERVICES.map((s) => {
            const active = service?.type === s.type;
            return (
              <button
                key={s.type}
                type="button"
                onClick={() => setService(s)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-primary-foreground",
                    s.tone,
                  )}
                >
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight">{lang === "en" ? s.en : s.mr}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {lang === "en" ? s.mr : s.en}
                  </div>
                </div>
                {active && <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Details */}
      <Card className="p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold">{L("applicantDetails")}</h2>
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
              <Textarea
                rows={2}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
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

      {/* Documents */}
      <Card className="p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold">{L("uploadDocs")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{L("uploadHint")}</p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/40">
          <Upload className="h-7 w-7 text-muted-foreground" />
          <span className="text-sm font-medium">
            {lang === "en" ? "Click to upload files" : "फायली अपलोड करण्यासाठी क्लिक करा"}
          </span>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={onFiles}
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
      </Card>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={mutation.isPending} size="lg" className="gap-2">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {L("submit")}
        </Button>
      </div>

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
              </div>
              <p className="text-sm text-muted-foreground">
                {lang === "en"
                  ? "Save this receipt number to track your application status under My Applications."
                  : "अर्जाची स्थिती पाहण्यासाठी हा पावती क्रमांक जतन करा — माझे अर्ज मध्ये पहा."}
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
  const { data: apps, isLoading } = useQuery({
    queryKey: ["my-aaple-sarkar"],
    queryFn: () => listFn(),
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
      <Card className="overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{L("receiptNo")}</th>
                <th className="px-4 py-3">{L("service")}</th>
                <th className="px-4 py-3">{L("status")}</th>
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

            {/* Live status timeline */}
            {app.status !== "rejected" && (
              <div className="flex items-center justify-between">
                {STATUS_FLOW.map((s, i) => {
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
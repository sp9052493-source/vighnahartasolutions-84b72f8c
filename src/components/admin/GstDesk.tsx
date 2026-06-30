import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Download,
  Upload,
  FileText,
  MessageSquare,
  ShieldCheck,
  Clock,
  X,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminListGstApplications,
  adminGetGstApplication,
  adminUpdateGstStatus,
  adminAddGstRemark,
  adminUploadGstResult,
  GST_STATUSES,
  type GstStatus,
} from "@/lib/gst.functions";
import { formatINR } from "@/lib/queries";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: GstStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "query_raised", label: "Query" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "Hold" },
];

const STATUS_TONE: Record<string, string> = {
  new: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  in_progress: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  query_raised: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  completed: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200",
  on_hold: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
};

function readFile(file: File) {
  return new Promise<{ name: string; base64: string; contentType: string }>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, base64: String(r.result), contentType: file.type });
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function GstDesk() {
  const listFn = useServerFn(adminListGstApplications);
  const [tab, setTab] = useState<GstStatus | "all">("all");
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin-gst-list", tab, q, district, dateFrom, dateTo],
    queryFn: () =>
      listFn({
        data: {
          status: tab === "all" ? undefined : tab,
          q: q || undefined,
          district: district || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        } as any,
      }),
  });

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: rows?.length || 0 };
    GST_STATUSES.forEach((s) => (m[s] = 0));
    (rows || []).forEach((r: any) => { m[r.status] = (m[r.status] || 0) + 1; });
    return m;
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">GST Desk</h1>
          <p className="text-[13px] text-muted-foreground">Manage every GST Registration application end-to-end.</p>
        </div>
        <Badge variant="outline" className="text-[11px]"><ShieldCheck className="mr-1 h-3 w-3" /> Admin only</Badge>
      </div>

      <Card className="p-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {t.label} <Badge variant="secondary" className="ml-2 h-4 text-[10px]">{counts[t.value] ?? 0}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Card>

      <Card className="p-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search app no / applicant / mobile / business" className="pl-9" />
          </div>
          <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" />
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
        ) : !rows?.length ? (
          <div className="p-10 text-center text-muted-foreground">No applications match the current filters.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Application</th>
                <th className="px-4 py-2 text-left">Applicant / Business</th>
                <th className="px-4 py-2 text-left">Retailer</th>
                <th className="px-4 py-2 text-left">District</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Charged</th>
                <th className="px-4 py-2 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r: any) => (
                <tr key={r.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedId(r.id)}>
                  <td className="px-4 py-3 font-medium">{r.application_no}</td>
                  <td className="px-4 py-3">{r.applicant_name}<div className="text-[11px] text-muted-foreground">{r.business_name}</div></td>
                  <td className="px-4 py-3">{r.retailer_name}<div className="text-[11px] text-muted-foreground">{r.retailer_business}</div></td>
                  <td className="px-4 py-3">{r.district}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={STATUS_TONE[r.status] || ""}>{r.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(Number(r.total_charged || 0))}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <DetailSheet id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function DetailSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const getFn = useServerFn(adminGetGstApplication);
  const updateFn = useServerFn(adminUpdateGstStatus);
  const remarkFn = useServerFn(adminAddGstRemark);
  const uploadFn = useServerFn(adminUploadGstResult);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gst", id],
    queryFn: () => getFn({ data: { id: id! } }),
    enabled: !!id,
  });

  const [status, setStatus] = useState<GstStatus>("pending");
  const [remarks, setRemarks] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [arnNo, setArnNo] = useState("");
  const [gstin, setGstin] = useState("");

  const updateMut = useMutation({
    mutationFn: () => updateFn({ data: { id: id!, status, remarks: remarks || undefined, internalNote: internalNote || undefined } }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-gst-list"] }); qc.invalidateQueries({ queryKey: ["admin-gst", id] }); setRemarks(""); setInternalNote(""); },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  const remarkMut = useMutation({
    mutationFn: ({ msg, internal }: { msg: string; internal: boolean }) =>
      remarkFn({ data: { id: id!, message: msg, internal } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-gst", id] }); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const uploadMut = useMutation({
    mutationFn: async ({ kind, file }: { kind: "certificate" | "arn" | "ack" | "other"; file: File }) => {
      if (file.size > 8 * 1024 * 1024) throw new Error("File must be under 8 MB");
      const fi = await readFile(file);
      return uploadFn({
        data: {
          id: id!,
          kind,
          filename: fi.name,
          contentType: fi.contentType,
          base64: fi.base64,
          arnNo: arnNo || undefined,
          gstin: gstin || undefined,
        },
      });
    },
    onSuccess: () => { toast.success("Uploaded"); qc.invalidateQueries({ queryKey: ["admin-gst", id] }); qc.invalidateQueries({ queryKey: ["admin-gst-list"] }); setArnNo(""); setGstin(""); },
    onError: (e: any) => toast.error(e?.message || "Upload failed"),
  });

  return (
    <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{data?.app?.application_no || "GST Application"}</SheetTitle>
        </SheetHeader>

        {isLoading || !data ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="mt-4 space-y-5">
            <Card className="space-y-2 p-4 text-[13px]">
              <Row k="Business" v={data.app.business_name} />
              <Row k="Applicant" v={`${data.app.applicant_name} · ${data.app.mobile}`} />
              <Row k="Email" v={data.app.email} />
              <Row k="PAN" v={data.app.pan} />
              <Row k="Constitution" v={data.app.constitution} />
              <Row k="Nature" v={data.app.nature_of_business} />
              <Row k="Address" v={`${data.app.address_line1}, ${data.app.address_line2 || ""}`} />
              <Row k="City/District" v={`${data.app.city}, ${data.app.district}, ${data.app.state} - ${data.app.pin_code}`} />
              <Row k="Bank" v={`${data.app.bank_name || "—"} · ${data.app.bank_account_no || ""} · ${data.app.bank_ifsc || ""}`} />
              <Row k="Signatory" v={`${data.app.signatory_name || "—"} (${data.app.signatory_designation || "—"})`} />
              <Row k="Retailer Wallet" v={formatINR(Number(data.wallet?.balance ?? 0))} />
              <Row k="Charged" v={formatINR(Number(data.app.total_charged || 0))} />
              {data.app.gstin && <Row k="GSTIN" v={data.app.gstin} />}
              {data.app.arn_no && <Row k="ARN" v={data.app.arn_no} />}
            </Card>

            <Card className="space-y-2 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.docs.map((d: any) => (
                  <a key={d.id} href={d.url || "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 hover:bg-muted/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-semibold">{d.doc_type}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{d.file_name}</div>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </Card>

            <Card className="space-y-3 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Update Status</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={status} onValueChange={(v) => setStatus(v as GstStatus)}>
                  <SelectTrigger><SelectValue placeholder="New status" /></SelectTrigger>
                  <SelectContent>
                    {GST_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>
                  {updateMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Apply
                </Button>
              </div>
              <Textarea placeholder="Remarks visible to retailer (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
              <Textarea placeholder="Internal note (admin only)" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} />
            </Card>

            <Card className="space-y-3 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Upload Result</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="ARN No (optional)" value={arnNo} onChange={(e) => setArnNo(e.target.value)} />
                <Input placeholder="GSTIN (optional)" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["certificate", "arn", "ack", "other"] as const).map((kind) => (
                  <label key={kind} className="cursor-pointer">
                    <div className="flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-border p-3 hover:border-primary/50">
                      <span className="text-[12.5px] font-semibold capitalize">{kind === "ack" ? "Acknowledgement" : kind}</span>
                      {uploadMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMut.mutate({ kind, file: e.target.files[0] })} />
                  </label>
                ))}
              </div>
            </Card>

            {data.app.internal_notes && (
              <Card className="p-4">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Internal Notes</div>
                <pre className="whitespace-pre-wrap font-mono text-[11.5px] text-muted-foreground">{data.app.internal_notes}</pre>
              </Card>
            )}

            <Card className="p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</div>
              <ol className="space-y-2">
                {data.events.map((e: any) => (
                  <li key={e.id} className="flex gap-2 text-[12.5px]">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="font-semibold">{e.event_type.replace("_", " ")}{e.to_status && <span className="text-muted-foreground"> → {e.to_status}</span>}</div>
                      {e.message && <div className="text-muted-foreground whitespace-pre-wrap">{e.message}</div>}
                      <div className="text-[10.5px] text-muted-foreground">{new Date(e.created_at).toLocaleString("en-IN")} · {e.actor_role}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11.5px] uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Briefcase, Download, FileSpreadsheet, FileText, Loader2, RefreshCcw, Search, Upload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adminListShopactApplications, adminGetShopactApplication,
  adminUpdateShopactStatus, adminUploadShopactCertificate,
  getShopactDocumentUrl, getShopactCertificateUrl,
} from "@/lib/shopact.functions";
import {
  SHOPACT_STATUSES, SHOPACT_STATUS_LABEL, SHOPACT_STATUS_TONE, type ShopactStatus,
} from "@/lib/shopact.shared";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/queries";

const CARDS: Array<{ key: ShopactStatus; label: string; tone: string }> = [
  { key: "submitted", label: "Pending", tone: "bg-amber-500/15 text-amber-700" },
  { key: "processing", label: "Under Review", tone: "bg-blue-500/15 text-blue-700" },
  { key: "need_more_documents", label: "Need Docs", tone: "bg-orange-500/15 text-orange-700" },
  { key: "approved", label: "Approved", tone: "bg-emerald-500/15 text-emerald-700" },
  { key: "rejected", label: "Rejected", tone: "bg-rose-500/15 text-rose-700" },
];

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

export function ShopActDesk() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const listFn = useServerFn(adminListShopactApplications);
  const list = useQuery({
    queryKey: ["admin-shopact", statusFilter, search],
    queryFn: () => listFn({
      data: {
        status: statusFilter === "all" ? undefined : (statusFilter as ShopactStatus),
        q: search || undefined,
      },
    }),
  });

  useEffect(() => {
    const channel = supabase.channel("admin-shopact")
      .on("postgres_changes", { event: "*", schema: "public", table: "shopact_applications" },
        () => queryClient.invalidateQueries({ queryKey: ["admin-shopact"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const counts = list.data?.counts ?? {};
  const rows = list.data?.rows ?? [];
  const totalRevenue = rows.reduce((a: number, r: any) => a + Number(r.total_charged || 0), 0);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.map((r: any) => ({
      Application: r.application_no, Business: r.business_name, Owner: r.owner_name,
      Mobile: r.mobile, Aadhaar: r.aadhaar_number, PAN: r.pan_number,
      District: r.business_district, State: r.business_state,
      Status: SHOPACT_STATUS_LABEL[r.status as ShopactStatus],
      Charged: Number(r.total_charged || 0),
      Created: new Date(r.created_at).toLocaleString("en-IN"),
    })));
    XLSX.utils.book_append_sheet(wb, ws, "ShopAct");
    XLSX.writeFile(wb, `shopact-applications-${Date.now()}.xlsx`);
  }

  async function exportPDF() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Shop Act Applications", 14, 14);
    autoTable(doc, {
      startY: 18,
      head: [["App No", "Business", "Owner", "Mobile", "District", "Status", "Charged", "Created"]],
      body: rows.map((r: any) => [
        r.application_no, r.business_name || "", r.owner_name || "", r.mobile || "",
        r.business_district || "",
        SHOPACT_STATUS_LABEL[r.status as ShopactStatus],
        formatINR(Number(r.total_charged || 0)),
        new Date(r.created_at).toLocaleDateString("en-IN"),
      ]),
      styles: { fontSize: 8 },
    });
    doc.save(`shopact-applications-${Date.now()}.pdf`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Shop Act Desk</h1>
          <p className="text-[13px] text-muted-foreground">Process, verify and issue Shop &amp; Establishment registrations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={exportPDF}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
          <Button variant="outline" onClick={() => window.print()}><FileText className="mr-1.5 h-4 w-4" /> Print</Button>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-shopact"] })}>
            <RefreshCcw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {CARDS.map((c) => (
          <Card key={c.key}
            className={`cursor-pointer p-4 transition hover:-translate-y-0.5 hover:shadow-md ${statusFilter === c.key ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(c.key)}>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-display text-3xl font-extrabold tabular-nums">{counts[c.key] ?? 0}</div>
            <Badge variant="outline" className={`mt-2 ${c.tone}`}>{c.label}</Badge>
          </Card>
        ))}
        <Card className="p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Revenue</div>
          <div className="mt-1 font-display text-2xl font-extrabold tabular-nums">{formatINR(totalRevenue)}</div>
          <Badge variant="outline" className="mt-2 bg-emerald-500/15 text-emerald-700">Collected</Badge>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, mobile, Aadhaar, PAN, application ID…" className="pl-9"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {SHOPACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{SHOPACT_STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left">Application</th>
              <th className="px-4 py-2 text-left">Business</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Mobile</th>
              <th className="px-4 py-2 text-left">District</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Charged</th>
              <th className="px-4 py-2 text-right">Created</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.isLoading && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Loading…</td></tr>}
            {!list.isLoading && !rows.length && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No applications.</td></tr>}
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.application_no}</td>
                <td className="px-4 py-3">{r.business_name || "—"}</td>
                <td className="px-4 py-3">{r.owner_name || "—"}</td>
                <td className="px-4 py-3">{r.mobile || "—"}</td>
                <td className="px-4 py-3">{r.business_district || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={SHOPACT_STATUS_TONE[r.status as ShopactStatus]}>
                    {SHOPACT_STATUS_LABEL[r.status as ShopactStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(Number(r.total_charged || 0))}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setActiveId(r.id)}>Open</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Sheet open={!!activeId} onOpenChange={(o) => !o && setActiveId(null)}>
        <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Application</SheetTitle>
          </SheetHeader>
          {activeId && <DetailPanel id={activeId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailPanel({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const getOne = useServerFn(adminGetShopactApplication);
  const detail = useQuery({ queryKey: ["admin-shopact-detail", id], queryFn: () => getOne({ data: { id } }) });
  const app = detail.data?.app;
  const docs = detail.data?.docs ?? [];
  const events = detail.data?.events ?? [];

  const [status, setStatus] = useState<ShopactStatus>("submitted");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (app?.status) setStatus(app.status as ShopactStatus);
    setRemarks(app?.remarks ?? "");
  }, [app?.id]);

  const updateFn = useServerFn(adminUpdateShopactStatus);
  const updateMutation = useMutation({
    mutationFn: () => updateFn({ data: { applicationId: id, status, remarks } }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-shopact-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-shopact"] });
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  const docUrlFn = useServerFn(getShopactDocumentUrl);
  const certUrlFn = useServerFn(getShopactCertificateUrl);
  const certUploadFn = useServerFn(adminUploadShopactCertificate);

  async function openDoc(docId: string) {
    try {
      const { url } = await docUrlFn({ data: { id: docId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) { toast.error(e?.message || "Could not open"); }
  }

  async function openCert() {
    try {
      const { url } = await certUrlFn({ data: { applicationId: id } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) { toast.error(e?.message || "Not available"); }
  }

  async function uploadCert(file: File) {
    try {
      const { base64, mimeType, fileName } = await fileToBase64(file);
      await certUploadFn({ data: { applicationId: id, base64, mimeType, fileName } });
      toast.success("Certificate uploaded");
      queryClient.invalidateQueries({ queryKey: ["admin-shopact-detail", id] });
    } catch (e: any) { toast.error(e?.message || "Upload failed"); }
  }

  if (detail.isLoading || !app)
    return <div className="p-6 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="font-display text-lg font-bold">{app.application_no}</div>
          <Badge variant="outline" className={SHOPACT_STATUS_TONE[app.status as ShopactStatus]}>
            {SHOPACT_STATUS_LABEL[app.status as ShopactStatus]}
          </Badge>
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">
          Created {new Date(app.created_at).toLocaleString("en-IN")}
          {app.submitted_at && ` · Submitted ${new Date(app.submitted_at).toLocaleString("en-IN")}`}
        </div>
      </div>

      <Section title="Owner">
        <KV k="Name" v={app.owner_name} />
        <KV k="Father / Husband" v={app.father_name} />
        <KV k="DOB / Gender" v={`${app.dob || "—"} / ${app.gender || "—"}`} />
        <KV k="Mobile / Email" v={`${app.mobile || "—"} · ${app.email || "—"}`} />
        <KV k="Aadhaar / PAN" v={`${app.aadhaar_number || "—"} · ${app.pan_number || "—"}`} />
      </Section>

      <Section title="Residential">
        <KV k="Address" v={`${app.res_address || ""}, ${app.res_city || ""}, ${app.res_district || ""}, ${app.res_state || ""} - ${app.res_pincode || ""}`} />
      </Section>

      <Section title="Business">
        <KV k="Name" v={app.business_name} />
        <KV k="Type / Nature" v={`${app.business_type || "—"} · ${app.business_nature || "—"}`} />
        <KV k="Start date" v={app.business_start_date} />
        <KV k="Address" v={`${app.business_address || ""}, ${app.business_city || ""}, ${app.business_district || ""}, ${app.business_state || ""} - ${app.business_pincode || ""}`} />
      </Section>

      <Section title="Employees">
        <KV k="Male / Female / Other" v={`${app.employees_male} / ${app.employees_female} / ${app.employees_other}`} />
      </Section>

      <Section title="Documents">
        <div className="col-span-2 space-y-2">
          {docs.length === 0 && <div className="text-[12.5px] text-muted-foreground">No documents uploaded.</div>}
          {docs.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-[13px]">
              <div className="min-w-0">
                <div className="font-semibold capitalize">{d.doc_type.replace(/_/g, " ")}</div>
                <div className="truncate text-[11.5px] text-muted-foreground">{d.file_name}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openDoc(d.id)}>
                <Download className="mr-1 h-3.5 w-3.5" /> Open
              </Button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Update Status">
        <div className="col-span-2 space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="min-w-[180px] flex-1">
              <Label className="mb-1.5 block text-[12px] font-semibold">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ShopactStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHOPACT_STATUSES.filter((s) => s !== "draft").map((s) =>
                    <SelectItem key={s} value={s}>{SHOPACT_STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-[12px] font-semibold">Remarks</Label>
            <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Status &amp; Notify Retailer
          </Button>
        </div>
      </Section>

      <Section title="Final Certificate">
        <div className="col-span-2">
          <CertSlot label="Shop Act Certificate" existing={!!app.certificate_url} onOpen={openCert} onUpload={uploadCert} />
        </div>
      </Section>

      <Section title="Activity Log">
        <div className="col-span-2 space-y-2">
          {events.map((e: any) => (
            <div key={e.id} className="rounded-md border border-border bg-muted/20 px-3 py-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize">{e.event_type.replace(/_/g, " ")}</span>
                <span className="text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleString("en-IN")}</span>
              </div>
              {(e.from_status || e.to_status) && (
                <div className="text-[11.5px] text-muted-foreground">
                  {e.from_status ? `${SHOPACT_STATUS_LABEL[e.from_status as ShopactStatus]} → ` : ""}
                  {e.to_status ? SHOPACT_STATUS_LABEL[e.to_status as ShopactStatus] : ""}
                </div>
              )}
              {e.note && <div className="mt-0.5 text-foreground/85">{e.note}</div>}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: any }) {
  return (
    <div className="rounded-md bg-muted/30 px-2.5 py-1.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{k}</div>
      <div className="text-[13px] text-foreground/90">{v ?? "—"}</div>
    </div>
  );
}
function CertSlot({ label, existing, onOpen, onUpload }: { label: string; existing: boolean; onOpen: () => void; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="mb-2 text-[12px] font-semibold">{label}</div>
      <div className="flex flex-wrap gap-2">
        <input ref={ref} type="file" className="hidden"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); if (ref.current) ref.current.value = ""; }} />
        <Button size="sm" variant="outline" onClick={() => ref.current?.click()}>
          <Upload className="mr-1 h-3.5 w-3.5" /> {existing ? "Replace" : "Upload"}
        </Button>
        {existing && (
          <Button size="sm" variant="ghost" onClick={onOpen}>
            <Download className="mr-1 h-3.5 w-3.5" /> Open
          </Button>
        )}
      </div>
    </div>
  );
}

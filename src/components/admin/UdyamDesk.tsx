import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  Upload,
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
  adminListUdyamApplications,
  adminGetUdyamApplication,
  adminUpdateUdyamStatus,
  adminUploadUdyamCertificate,
  getUdyamDocumentUrl,
  getUdyamStoredFileUrl,
} from "@/lib/udyam.functions";
import {
  UDYAM_STATUSES,
  UDYAM_STATUS_LABEL,
  UDYAM_STATUS_TONE,
  type UdyamStatus,
} from "@/lib/udyam.shared";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/queries";

const DASHBOARD_CARDS: Array<{ key: UdyamStatus | "pending"; label: string; tone: string }> = [
  { key: "submitted", label: "Pending", tone: "bg-amber-500/15 text-amber-700" },
  { key: "processing", label: "Under Review", tone: "bg-blue-500/15 text-blue-700" },
  { key: "approved", label: "Approved", tone: "bg-emerald-500/15 text-emerald-700" },
  { key: "rejected", label: "Rejected", tone: "bg-rose-500/15 text-rose-700" },
  { key: "completed", label: "Completed", tone: "bg-emerald-600/15 text-emerald-800" },
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

export function UdyamDesk() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const listFn = useServerFn(adminListUdyamApplications);
  const list = useQuery({
    queryKey: ["admin-udyam", statusFilter, search],
    queryFn: () =>
      listFn({
        data: {
          status: statusFilter === "all" ? undefined : (statusFilter as UdyamStatus),
          q: search || undefined,
        },
      }),
  });

  // Realtime: refresh on any change
  useEffect(() => {
    const channel = supabase
      .channel("admin-udyam")
      .on("postgres_changes", { event: "*", schema: "public", table: "udyam_applications" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-udyam"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const counts = list.data?.counts ?? {};
  const rows = list.data?.rows ?? [];

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      rows.map((r: any) => ({
        Application: r.application_no,
        Business: r.business_name,
        Applicant: r.name_as_aadhaar,
        Mobile: r.mobile,
        Aadhaar: r.aadhaar_number,
        PAN: r.pan_number,
        District: r.district,
        State: r.state,
        Status: UDYAM_STATUS_LABEL[r.status as UdyamStatus],
        Charged: Number(r.total_charged || 0),
        Created: new Date(r.created_at).toLocaleString("en-IN"),
      })),
    );
    XLSX.utils.book_append_sheet(wb, ws, "Udyam");
    XLSX.writeFile(wb, `udyam-applications-${Date.now()}.xlsx`);
  }

  async function exportPDF() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Udyam Aadhaar Applications", 14, 14);
    autoTable(doc, {
      startY: 18,
      head: [["App No", "Business", "Applicant", "Mobile", "District", "Status", "Charged", "Created"]],
      body: rows.map((r: any) => [
        r.application_no,
        r.business_name || "",
        r.name_as_aadhaar || "",
        r.mobile || "",
        r.district || "",
        UDYAM_STATUS_LABEL[r.status as UdyamStatus],
        formatINR(Number(r.total_charged || 0)),
        new Date(r.created_at).toLocaleDateString("en-IN"),
      ]),
      styles: { fontSize: 8 },
    });
    doc.save(`udyam-applications-${Date.now()}.pdf`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Udyam Aadhaar Desk</h1>
          <p className="text-[13px] text-muted-foreground">Process, verify and issue Udyam registrations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={exportPDF}><FileText className="mr-1.5 h-4 w-4" /> PDF</Button>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-udyam"] })}>
            <RefreshCcw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {DASHBOARD_CARDS.map((c) => (
          <Card
            key={c.key}
            className={`cursor-pointer p-4 transition hover:-translate-y-0.5 hover:shadow-md ${statusFilter === c.key ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(c.key)}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-display text-3xl font-extrabold tabular-nums">{counts[c.key] ?? 0}</div>
            <Badge variant="outline" className={`mt-2 ${c.tone}`}>{c.label}</Badge>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, Aadhaar, PAN, application ID…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {UDYAM_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{UDYAM_STATUS_LABEL[s]}</SelectItem>
              ))}
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
              <th className="px-4 py-2 text-left">Applicant</th>
              <th className="px-4 py-2 text-left">Mobile</th>
              <th className="px-4 py-2 text-left">District</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-right">Charged</th>
              <th className="px-4 py-2 text-right">Created</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.isLoading && (
              <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!list.isLoading && !rows.length && (
              <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No applications.</td></tr>
            )}
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{r.application_no}</td>
                <td className="px-4 py-3">{r.business_name || "—"}</td>
                <td className="px-4 py-3">{r.name_as_aadhaar || "—"}</td>
                <td className="px-4 py-3">{r.mobile || "—"}</td>
                <td className="px-4 py-3">{r.district || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={UDYAM_STATUS_TONE[r.status as UdyamStatus]}>
                    {UDYAM_STATUS_LABEL[r.status as UdyamStatus]}
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
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Application
            </SheetTitle>
          </SheetHeader>
          {activeId && <DetailPanel id={activeId} onClose={() => setActiveId(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailPanel({ id, onClose }: { id: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const getOne = useServerFn(adminGetUdyamApplication);
  const detail = useQuery({ queryKey: ["admin-udyam-detail", id], queryFn: () => getOne({ data: { id } }) });
  const app = detail.data?.app;
  const docs = detail.data?.docs ?? [];
  const events = detail.data?.events ?? [];

  const [status, setStatus] = useState<UdyamStatus>("submitted");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (app?.status) setStatus(app.status as UdyamStatus);
    setRemarks(app?.remarks ?? "");
  }, [app?.id]);

  const updateFn = useServerFn(adminUpdateUdyamStatus);
  const updateMutation = useMutation({
    mutationFn: () => updateFn({ data: { applicationId: id, status, remarks } }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-udyam-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-udyam"] });
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  const docUrlFn = useServerFn(getUdyamDocumentUrl);
  const fileUrlFn = useServerFn(getUdyamStoredFileUrl);
  const certUploadFn = useServerFn(adminUploadUdyamCertificate);

  async function openDoc(docId: string) {
    try {
      const { url } = await docUrlFn({ data: { id: docId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message || "Could not open");
    }
  }

  async function openStored(kind: "certificate" | "acknowledgement") {
    try {
      const { url } = await fileUrlFn({ data: { applicationId: id, kind } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message || "Not available");
    }
  }

  async function uploadCert(kind: "certificate" | "acknowledgement", file: File) {
    try {
      const { base64, mimeType, fileName } = await fileToBase64(file);
      await certUploadFn({ data: { applicationId: id, kind, base64, mimeType, fileName } });
      toast.success(`${kind} uploaded`);
      queryClient.invalidateQueries({ queryKey: ["admin-udyam-detail", id] });
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    }
  }

  if (detail.isLoading || !app) return <div className="p-6 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="font-display text-lg font-bold">{app.application_no}</div>
          <Badge variant="outline" className={UDYAM_STATUS_TONE[app.status as UdyamStatus]}>
            {UDYAM_STATUS_LABEL[app.status as UdyamStatus]}
          </Badge>
        </div>
        <div className="mt-1 text-[12px] text-muted-foreground">
          Created {new Date(app.created_at).toLocaleString("en-IN")}
          {app.submitted_at && ` · Submitted ${new Date(app.submitted_at).toLocaleString("en-IN")}`}
        </div>
      </div>

      <Section title="Personal">
        <KV k="Aadhaar" v={app.aadhaar_number} />
        <KV k="PAN" v={app.pan_number} />
        <KV k="Name (Aadhaar)" v={app.name_as_aadhaar} />
        <KV k="Name (PAN)" v={app.name_as_pan} />
        <KV k="DOB" v={app.dob} />
        <KV k="Mobile" v={app.mobile} />
        <KV k="Email" v={app.email} />
        <KV k="Gender / Category" v={`${app.gender || "—"} / ${app.category || "—"}`} />
      </Section>

      <Section title="Business">
        <KV k="Name" v={app.business_name} />
        <KV k="Type" v={app.business_type} />
        <KV k="Start date" v={app.business_start_date} />
        <KV k="Address" v={`${app.business_address || ""}, ${app.city || ""}, ${app.district || ""}, ${app.state || ""} - ${app.pincode || ""}`} />
        <KV k="Investment / Turnover" v={`${formatINR(Number(app.investment_amount || 0))} / ${formatINR(Number(app.annual_turnover || 0))}`} />
        <KV k="GST" v={app.gst_available ? `Yes (${app.gst_number || "—"})` : "No"} />
      </Section>

      <Section title="Bank">
        <KV k="Bank" v={app.bank_name} />
        <KV k="IFSC" v={app.ifsc} />
        <KV k="Account" v={app.account_number} />
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
                <div className="font-semibold capitalize">{d.doc_type.replace("_", " ")}</div>
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
              <Select value={status} onValueChange={(v) => setStatus(v as UdyamStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UDYAM_STATUSES.filter((s) => s !== "draft").map((s) => (
                    <SelectItem key={s} value={s}>{UDYAM_STATUS_LABEL[s]}</SelectItem>
                  ))}
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

      <Section title="Certificate &amp; Acknowledgement">
        <div className="col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CertSlot
            label="Acknowledgement"
            existing={!!app.acknowledgement_url}
            onOpen={() => openStored("acknowledgement")}
            onUpload={(f) => uploadCert("acknowledgement", f)}
          />
          <CertSlot
            label="Udyam Certificate"
            existing={!!app.certificate_url}
            onOpen={() => openStored("certificate")}
            onUpload={(f) => uploadCert("certificate", f)}
          />
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
                  {e.from_status ? `${UDYAM_STATUS_LABEL[e.from_status as UdyamStatus]} → ` : ""}
                  {e.to_status ? UDYAM_STATUS_LABEL[e.to_status as UdyamStatus] : ""}
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
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            if (ref.current) ref.current.value = "";
          }}
        />
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

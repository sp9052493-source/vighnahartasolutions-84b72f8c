import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMyGstApplication, uploadGstDocument, GST_REQUIRED_DOCS, GST_OPTIONAL_DOCS } from "@/lib/gst.functions";
import { formatINR } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/gst/$id")({
  head: () => ({ meta: [{ title: "GST Application — Vighnaharta Solutions" }] }),
  component: GstDetailPage,
});

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

const ALL_LABELS: Record<string, string> = Object.fromEntries(
  [...GST_REQUIRED_DOCS, ...GST_OPTIONAL_DOCS].map((d) => [d.id, d.label]),
);
ALL_LABELS["admin_certificate"] = "GST Certificate";
ALL_LABELS["admin_arn"] = "ARN Acknowledgement";
ALL_LABELS["admin_ack"] = "Acknowledgement";
ALL_LABELS["admin_other"] = "Supporting Document";

function readFile(file: File) {
  return new Promise<{ name: string; base64: string; contentType: string }>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, base64: String(r.result), contentType: file.type });
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function GstDetailPage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getMyGstApplication);
  const uploadFn = useServerFn(uploadGstDocument);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-gst", id],
    queryFn: () => getFn({ data: { id } }),
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.app?.status;
      return ["pending", "in_progress", "query_raised"].includes(s) ? 30_000 : false;
    },
  });

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const uploadMut = useMutation({
    mutationFn: async ({ docType, file }: { docType: string; file: File }) => {
      if (file.size > 8 * 1024 * 1024) throw new Error("File must be under 8 MB");
      const fi = await readFile(file);
      return uploadFn({
        data: { applicationId: id, docType, filename: fi.name, contentType: fi.contentType, base64: fi.base64 },
      });
    },
    onMutate: ({ docType }) => setUploadingType(docType),
    onSettled: () => setUploadingType(null),
    onSuccess: () => {
      toast.success("Document uploaded");
      queryClient.invalidateQueries({ queryKey: ["my-gst", id] });
    },
    onError: (e: any) => toast.error(e?.message || "Upload failed"),
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const { app, docs, events } = data;
  const canEdit = ["new", "query_raised"].includes(app.status);
  const adminDocs = docs.filter((d: any) => d.doc_type.startsWith("admin_"));
  const retailerDocs = docs.filter((d: any) => !d.doc_type.startsWith("admin_"));
  const uploadedTypes = new Set(retailerDocs.map((d: any) => d.doc_type));

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center gap-2">
        <Link to="/gst-requests"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button></Link>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Application</div>
            <h1 className="font-display text-2xl font-bold">{app.application_no}</h1>
            <div className="text-[13px] text-muted-foreground">{app.business_name} · {app.applicant_name}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={STATUS_TONE[app.status]} variant="outline">{app.status.replace("_", " ")}</Badge>
            <div className="text-[12px] text-muted-foreground">Charged {formatINR(Number(app.total_charged || 0))}</div>
            {app.gstin && <div className="text-[12px]"><b>GSTIN:</b> {app.gstin}</div>}
            {app.arn_no && <div className="text-[12px]"><b>ARN:</b> {app.arn_no}</div>}
          </div>
        </div>
        {app.admin_remarks && (
          <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-[13px] text-blue-800 dark:text-blue-200">
            <div className="mb-1 font-semibold">Admin Remarks</div>
            <div className="whitespace-pre-wrap">{app.admin_remarks}</div>
          </div>
        )}
      </Card>

      {/* Admin-issued documents */}
      {adminDocs.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 font-display text-lg font-bold">Issued Documents</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {adminDocs.map((d: any) => (
              <a key={d.id} href={d.url || "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 hover:bg-emerald-500/10">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">{ALL_LABELS[d.doc_type] || d.doc_type}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{d.file_name}</div>
                  </div>
                </div>
                <Download className="h-4 w-4 text-emerald-700" />
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Documents */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-lg font-bold">Documents Submitted</div>
          {canEdit && <Badge variant="outline">You can re-upload while {app.status === "query_raised" ? "query is raised" : "in draft"}</Badge>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...GST_REQUIRED_DOCS, ...GST_OPTIONAL_DOCS].map((d) => {
            const existing = retailerDocs.find((x: any) => x.doc_type === d.id);
            const required = (GST_REQUIRED_DOCS as readonly any[]).some((r) => r.id === d.id);
            const missing = required && !uploadedTypes.has(d.id);
            return (
              <div key={d.id} className={cn("flex items-center justify-between gap-3 rounded-lg border p-3", missing ? "border-rose-500/40 bg-rose-500/5" : existing ? "border-emerald-500/30 bg-emerald-500/5" : "border-border")}>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold">{d.label}{required && <span className="ml-1 text-rose-500">*</span>}</div>
                  {existing && <div className="truncate text-[11px] text-muted-foreground">{existing.file_name}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {existing?.url && (
                    <a href={existing.url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                    </a>
                  )}
                  {canEdit && (
                    <label className="cursor-pointer">
                      <Button asChild variant="ghost" size="sm">
                        <span>{uploadingType === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}</span>
                      </Button>
                      <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMut.mutate({ docType: d.id, file: e.target.files[0] })} />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {app.status === "query_raised" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-[12.5px] text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Please re-upload corrected documents per the admin remarks above.
          </div>
        )}
      </Card>

      {/* Timeline */}
      <Card className="p-5">
        <div className="mb-3 font-display text-lg font-bold">Timeline</div>
        <ol className="space-y-3">
          {events.map((e: any) => (
            <li key={e.id} className="flex gap-3">
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {e.event_type === "status_changed" ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">
                  {e.event_type.replace("_", " ")}{e.to_status && <span className="ml-2 text-muted-foreground">→ {e.to_status}</span>}
                </div>
                {e.message && <div className="text-[12.5px] text-muted-foreground whitespace-pre-wrap">{e.message}</div>}
                <div className="text-[11px] text-muted-foreground">{new Date(e.created_at).toLocaleString("en-IN")}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Landmark, Loader2, FileText, Download, Upload, X, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminListAapleSarkar,
  adminGetAapleSarkarDetail,
  adminUpdateAapleSarkar,
} from "@/lib/aaple-sarkar.functions";
import { STATUS_META, AAPLE_SARKAR_LOGO, type StatusKey } from "@/lib/aaple-sarkar.shared";

export const Route = createFileRoute("/_authenticated/aaple-sarkar-requests")({
  head: () => ({ meta: [{ title: "Aaple Sarkar Applications — Admin" }] }),
  component: AapleSarkarAdmin,
});

const STATUS_OPTIONS: StatusKey[] = [
  "submitted",
  "under_review",
  "approved",
  "completed",
  "rejected",
];

function AapleSarkarAdmin() {
  const listFn = useServerFn(adminListAapleSarkar);
  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin-aaple-sarkar"],
    queryFn: () => listFn(),
  });

  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = (apps ?? []).filter((a: any) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.receipt_no.toLowerCase().includes(q) ||
        a.applicant_name.toLowerCase().includes(q) ||
        (a.retailer_name || "").toLowerCase().includes(q) ||
        a.mobile.includes(q)
      );
    }
    return true;
  });

  const counts = STATUS_OPTIONS.reduce(
    (acc, s) => ({ ...acc, [s]: (apps ?? []).filter((a: any) => a.status === s).length }),
    {} as Record<string, number>,
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
        <img src={AAPLE_SARKAR_LOGO} alt="Aaple Sarkar" className="h-14 w-auto rounded-md bg-white p-1 shadow-sm" />
        <div>
          <h1 className="font-display text-2xl font-bold">Aaple Sarkar Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review applicant details &amp; documents, update status, attach issued certificates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUS_OPTIONS.map((s) => (
          <Card key={s} className="p-4 shadow-card">
            <div className="text-2xl font-bold">{counts[s] ?? 0}</div>
            <Badge variant="outline" className={`mt-1 ${STATUS_META[s].badge}`}>
              {STATUS_META[s].en}
            </Badge>
          </Card>
        ))}
      </div>

      <Card className="p-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search receipt, applicant, retailer or mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden shadow-card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Retailer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any) => {
                  const meta = STATUS_META[a.status as StatusKey];
                  return (
                    <tr key={a.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs font-semibold">{a.receipt_no}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.applicant_name}</div>
                        <div className="text-xs text-muted-foreground">{a.mobile}</div>
                      </td>
                      <td className="px-4 py-3">{a.service_label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.retailer_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={meta.badge}>
                          {meta.en}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => setDetailId(a.id)}>
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ManageSheet id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

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

function ManageSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const detailFn = useServerFn(adminGetAapleSarkarDetail);
  const updateFn = useServerFn(adminUpdateAapleSarkar);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-aaple-sarkar-detail", id],
    queryFn: () => detailFn({ data: { id: id! } }),
    enabled: !!id,
  });

  const app = data?.application as any;
  const [status, setStatus] = useState<StatusKey>("submitted");
  const [remarks, setRemarks] = useState("");
  const [resultDoc, setResultDoc] = useState<FileItem | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  if (app && app.id !== lastId) {
    setLastId(app.id);
    setStatus(app.status);
    setRemarks(app.admin_remarks || "");
    setResultDoc(null);
  }

  const mutation = useMutation({
    mutationFn: (vars: any) => updateFn({ data: vars }),
    onSuccess: () => {
      toast.success("Application updated");
      queryClient.invalidateQueries({ queryKey: ["admin-aaple-sarkar"] });
      queryClient.invalidateQueries({ queryKey: ["admin-aaple-sarkar-detail", id] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Could not update"),
  });

  async function onResultFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    setResultDoc(await readFile(file));
    e.target.value = "";
  }

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            {app?.receipt_no || "Application"}
          </SheetTitle>
        </SheetHeader>
        {isLoading || !app ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="font-display text-lg font-semibold">{app.service_label}</div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <Info label="Applicant" value={app.applicant_name} />
                {app.applicant_name_mr && <Info label="नाव (मराठी)" value={app.applicant_name_mr} />}
                {app.father_name && <Info label="Father/Husband" value={app.father_name} />}
                <Info label="Mobile" value={app.mobile} />
                {app.email && <Info label="Email" value={app.email} />}
                {app.purpose && <Info label="Purpose" value={app.purpose} />}
                {app.district && <Info label="District" value={app.district} />}
                {app.taluka && <Info label="Taluka" value={app.taluka} />}
                {app.pincode && <Info label="Pincode" value={app.pincode} />}
                <div className="col-span-2">
                  <Info label="Address" value={app.address} />
                </div>
                {data?.profile && (
                  <div className="col-span-2">
                    <Info
                      label="Submitted by retailer"
                      value={`${data.profile.full_name || "—"}${data.profile.phone ? " · " + data.profile.phone : ""}`}
                    />
                  </div>
                )}
                {app.notes && (
                  <div className="col-span-2">
                    <Info label="Notes" value={app.notes} />
                  </div>
                )}
              </dl>
            </div>

            {data?.signedDocs?.length ? (
              <div>
                <div className="mb-2 text-sm font-semibold">Uploaded Documents</div>
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
                          <Download className="h-4 w-4" /> Open
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            )}

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Update Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as StatusKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_META[s].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Office Remarks</Label>
                <Textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Visible to the retailer"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Issued Certificate (optional)</Label>
                {resultDoc ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{resultDoc.name}</span>
                    <button onClick={() => setResultDoc(null)} className="ml-auto text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : data?.resultUrl ? (
                  <a
                    href={data.resultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Download className="h-4 w-4" /> Current issued document
                  </a>
                ) : null}
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border py-2.5 text-sm hover:border-primary/50 hover:bg-muted/40">
                  <Upload className="h-4 w-4" /> Upload certificate
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onResultFile} />
                </label>
              </div>
              <Button
                className="w-full gap-2"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    id: app.id,
                    status,
                    adminRemarks: remarks,
                    ...(resultDoc ? { resultDoc } : {}),
                  })
                }
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
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
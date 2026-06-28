import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  FileText,
  FileDown,
  Inbox,
  ExternalLink,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { adminListGazetteApplications } from "@/lib/gazette-admin.functions";
import {
  adminGetAapleSarkarDetail,
  adminUpdateAapleSarkar,
} from "@/lib/aaple-sarkar.functions";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  submitted: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  under_review: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function GazetteDesk() {
  const listFn = useServerFn(adminListGazetteApplications);
  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin-gazette-desk"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    (apps || []).forEach((a: any) => a.status && s.add(a.status));
    return Array.from(s).sort();
  }, [apps]);

  const purposeOptions = useMemo(() => {
    const s = new Set<string>();
    (apps || []).forEach((a: any) => a.purpose && s.add(a.purpose));
    return Array.from(s).sort();
  }, [apps]);

  const filtered = useMemo(() => {
    if (!apps) return [];
    const q = search.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const to = toDate ? new Date(toDate + "T23:59:59").getTime() : null;
    return apps.filter((a: any) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (purposeFilter !== "all" && a.purpose !== purposeFilter) return false;
      if (from || to) {
        const t = new Date(a.created_at).getTime();
        if (from && t < from) return false;
        if (to && t > to) return false;
      }
      if (q) {
        const hay = [
          a.receipt_no,
          a.applicant_name,
          a.mobile,
          a.retailer_name,
          a.retailer_business,
          a.purpose,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [apps, search, statusFilter, purposeFilter, fromDate, toDate]);

  const hasFilters =
    search || statusFilter !== "all" || purposeFilter !== "all" || fromDate || toDate;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPurposeFilter("all");
    setFromDate("");
    setToDate("");
  };

  const stats = useMemo(() => {
    const list = apps || [];
    return {
      total: list.length,
      submitted: list.filter((a: any) => a.status === "submitted").length,
      review: list.filter((a: any) => a.status === "under_review").length,
      completed: list.filter((a: any) =>
        ["completed", "approved"].includes(a.status),
      ).length,
    };
  }, [apps]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-hero p-5 text-primary-foreground shadow-elegant">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
          <Inbox className="h-6 w-6 text-[oklch(0.82_0.17_64)]" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/65">
            Operations
          </div>
          <h1 className="font-display text-2xl font-extrabold leading-tight">
            Gazette Desk
          </h1>
          <p className="text-sm text-primary-foreground/75">
            Live queue of Gazette applications submitted by retailers and distributors.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: stats.total },
          { label: "New", value: stats.submitted },
          { label: "Under Review", value: stats.review },
          { label: "Completed", value: stats.completed },
        ].map((k) => (
          <Card key={k.label} className="p-4 shadow-card">
            <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              {k.label}
            </div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums">
              {k.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-4 p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <Inbox className="h-4 w-4" /> Submitted Applications
          </h2>
          <Link
            to="/aaple-sarkar-requests"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Open full workflow →
          </Link>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              Search
            </Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Receipt, applicant, mobile, retailer…"
              className="mt-1 h-9"
            />
          </div>
          <div>
            <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              Change Type
            </Label>
            <Select value={purposeFilter} onValueChange={setPurposeFilter}>
              <SelectTrigger className="mt-1 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {purposeOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              From
            </Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1 h-9"
            />
          </div>
          <div>
            <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
              To
            </Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1 h-9"
            />
          </div>
          <div className="flex items-end justify-between gap-2 sm:col-span-2 lg:col-span-6">
            <div className="text-[11.5px] text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
              <span className="font-semibold text-foreground">{apps?.length || 0}</span>{" "}
              applications
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
                <X className="mr-1 h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading applications…
          </div>
        ) : !apps || apps.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No Gazette applications yet. Submissions from retailers will appear here in real time.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No applications match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[12.5px]">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Receipt</th>
                  <th className="px-3 py-2 text-left">Applicant</th>
                  <th className="px-3 py-2 text-left">Retailer / Distributor</th>
                  <th className="px-3 py-2 text-left">Purpose</th>
                  <th className="px-3 py-2 text-right">Fee</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any) => (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-[11.5px]">{a.receipt_no}</td>
                    <td className="px-3 py-2">
                      <div className="font-semibold">{a.applicant_name}</div>
                      <div className="text-[11px] text-muted-foreground">{a.mobile}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div>{a.retailer_name}</div>
                      {a.retailer_business && (
                        <div className="text-[11px] text-muted-foreground">{a.retailer_business}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 max-w-[220px] truncate" title={a.purpose}>
                      {a.purpose || "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      ₹{Number(a.charged || 0).toFixed(0)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10.5px]", STATUS_TONE[a.status] || "")}
                      >
                        {String(a.status || "").replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-[11.5px] text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => setOpenId(a.id)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <GazetteManageDialog
          id={openId}
          onClose={() => setOpenId(null)}
          statusTone={STATUS_TONE}
        />
      </Card>
    </div>
  );
}

function GazetteManageDialog({
  id,
  onClose,
  statusTone,
}: {
  id: string | null;
  onClose: () => void;
  statusTone: Record<string, string>;
}) {
  const open = !!id;
  const queryClient = useQueryClient();
  const getDetail = useServerFn(adminGetAapleSarkarDetail);
  const updateFn = useServerFn(adminUpdateAapleSarkar);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-gazette-detail", id],
    queryFn: () => getDetail({ data: { id: id! } }),
    enabled: open,
    staleTime: 0,
  });

  const [status, setStatus] = useState<string>("submitted");
  const [remarks, setRemarks] = useState("");
  const [resultDoc, setResultDoc] = useState<{ name: string; base64: string; contentType: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.application) {
      setStatus(data.application.status || "submitted");
      setRemarks(data.application.admin_remarks || "");
      setResultDoc(null);
    }
  }, [data]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be under 8 MB");
      return;
    }
    const buf = await file.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    const base64 = btoa(bin);
    setResultDoc({ name: file.name, base64, contentType: file.type || "application/pdf" });
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updateFn({
        data: {
          id,
          status: status as any,
          adminRemarks: remarks,
          ...(resultDoc ? { resultDoc } : {}),
        },
      });
      toast.success("Application updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-gazette-desk"] }),
        refetch(),
      ]);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const app = data?.application;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4" /> Manage Gazette Application
          </DialogTitle>
          <DialogDescription>
            Update live status, add remarks and upload the issued certificate.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !app ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2">
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Receipt
                </div>
                <div className="font-mono text-sm">{app.receipt_no}</div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Current Status
                </div>
                <Badge variant="outline" className={cn("text-[10.5px]", statusTone[app.status] || "")}>
                  {String(app.status || "").replace(/_/g, " ")}
                </Badge>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Applicant
                </div>
                <div className="text-sm font-semibold">{app.applicant_name}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {app.mobile}
                  {app.email ? ` · ${app.email}` : ""}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Submitted By
                </div>
                <div className="text-sm">{data?.profile?.full_name || "—"}</div>
                <div className="text-[11.5px] text-muted-foreground">
                  {data?.profile?.business_name || ""}
                  {data?.profile?.phone ? ` · ${data.profile.phone}` : ""}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Purpose / Change Type
                </div>
                <div className="text-sm">{app.purpose || "—"}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Address
                </div>
                <div className="text-[12.5px]">{app.address}</div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Fee Charged
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  ₹{Number(app.cost || 0).toFixed(0)}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Date
                </div>
                <div className="text-sm">
                  {new Date(app.created_at).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {data?.signedDocs && data.signedDocs.length > 0 && (
              <div>
                <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Applicant Documents
                </Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {data.signedDocs.map((d: any, i: number) => (
                    <a
                      key={i}
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11.5px] hover:bg-muted/40"
                    >
                      <FileText className="h-3.5 w-3.5" /> {d.name}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {data?.resultUrl && (
              <div>
                <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Previously Issued Document
                </Label>
                <a
                  href={data.resultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11.5px] text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                >
                  <FileDown className="h-3.5 w-3.5" /> Download issued certificate
                </a>
              </div>
            )}

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Update Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Upload Completed Certificate
                </Label>
                <Input
                  type="file"
                  accept="application/pdf,image/*"
                  className="mt-1 h-9 text-xs"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                {resultDoc && (
                  <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                    Ready to upload: {resultDoc.name}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-[10.5px] uppercase tracking-wider text-muted-foreground">
                Admin Remarks
              </Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Internal notes shared with the retailer…"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || isLoading || !app}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

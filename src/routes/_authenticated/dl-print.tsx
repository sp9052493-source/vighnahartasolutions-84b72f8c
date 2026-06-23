import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  IdCard,
  Loader2,
  Download,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useMyRequests, useMe, formatINR } from "@/lib/queries";
import { processDlPrint } from "@/lib/dl.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dl-print")({
  head: () => ({ meta: [{ title: "Driving Licence Print — Sevakart Portal" }] }),
  component: DlPrint,
});

function base64ToBlobUrl(base64: string) {
  const byteChars = atob(base64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
}

function DlPrint() {
  const { data: me } = useMe();
  const { data: requests } = useMyRequests();
  const queryClient = useQueryClient();

  const [dlno, setDlno] = useState("");
  const [dob, setDob] = useState("");
  const [cardtype, setCardtype] = useState("2");
  const [pdf, setPdf] = useState<{ url: string; fileName: string; reference: string } | null>(null);
  const printRef = useRef<HTMLIFrameElement | null>(null);

  const dlRequests = (requests ?? []).filter((r) => r.service_name === "Driving License");

  const dlFn = useServerFn(processDlPrint);
  const mutation = useMutation({
    mutationFn: (vars: { dlno: string; dob: string; cardtype: "1" | "2" }) => dlFn({ data: vars }),
    onSuccess: (res: any) => {
      console.log("[DL] server response:", {
        reference: res?.reference,
        fileName: res?.fileName,
        base64Length: res?.pdfBase64?.length,
      });
      if (!res?.pdfBase64) {
        toast.error("No PDF data returned from server.");
        return;
      }
      const url = base64ToBlobUrl(res.pdfBase64);
      setPdf({ url, fileName: res.fileName, reference: res.reference });
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) toast.message("Pop-up blocked — use the preview or buttons below to view the PDF.");
      toast.success("DL PDF generated successfully");
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: (e: any) => {
      console.error("[DL] request error:", e?.message);
      toast.error(e?.message || "Request failed");
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = dlno.trim().toUpperCase();
    if (cleaned.replace(/[^A-Z0-9]/g, "").length < 5) {
      toast.error("Enter a valid driving licence number");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      toast.error("Select a valid date of birth");
      return;
    }
    setPdf(null);
    mutation.mutate({ dlno: cleaned, dob, cardtype: cardtype as "1" | "2" });
  }

  function downloadPdf() {
    if (!pdf) return;
    const a = document.createElement("a");
    a.href = pdf.url;
    a.download = pdf.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function printPdf() {
    if (!pdf || !printRef.current) return;
    printRef.current.src = pdf.url;
    printRef.current.onload = () => printRef.current?.contentWindow?.print();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)] text-primary-foreground shadow-sm">
          <IdCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Driving Licence Print</h1>
          <p className="text-sm text-muted-foreground">
            Generate a printable Driving Licence PDF. The fee is deducted from your wallet — current
            balance <span className="font-semibold text-primary">{formatINR(me?.balance ?? 0)}</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-6 shadow-card lg:col-span-3">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dlno">Driving Licence Number</Label>
              <Input
                id="dlno"
                value={dlno}
                onChange={(e) => setDlno(e.target.value.toUpperCase())}
                placeholder="e.g. MH1420110012345"
                maxLength={20}
                autoFocus
                required
                className="font-mono uppercase tracking-wider"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Card Type</Label>
                <Select value={cardtype} onValueChange={setCardtype}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">New Background</SelectItem>
                    <SelectItem value="1">Old Background</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating DL PDF…
                </>
              ) : (
                <>
                  <IdCard className="mr-2 h-4 w-4" /> Generate DL PDF
                </>
              )}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col p-6 shadow-card lg:col-span-2">
          {mutation.isPending && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Contacting DL provider…</p>
            </div>
          )}

          {!mutation.isPending && mutation.isError && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <AlertCircle className="h-9 w-9 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {(mutation.error as any)?.message || "Request failed"}
              </p>
              <p className="text-xs text-muted-foreground">No amount has been charged.</p>
            </div>
          )}

          {!mutation.isPending && pdf && (
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-success">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div className="text-sm font-medium">DL PDF ready</div>
              </div>
              <div className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground">
                Reference: <span className="font-semibold text-foreground">{pdf.reference}</span>
              </div>
              <Button onClick={() => window.open(pdf.url, "_blank", "noopener,noreferrer")} className="gap-2">
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </Button>
              <Button variant="outline" onClick={downloadPdf} className="gap-2">
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button variant="outline" onClick={printPdf} className="gap-2">
                <Printer className="h-4 w-4" /> Print PDF
              </Button>
            </div>
          )}

          {!mutation.isPending && !mutation.isError && !pdf && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
              <FileText className="h-9 w-9 opacity-40" />
              <p className="text-sm">Your generated DL PDF will appear here.</p>
            </div>
          )}
        </Card>
      </div>

      {pdf && (
        <Card className="overflow-hidden shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="font-display text-lg font-semibold">PDF Preview</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={downloadPdf} className="gap-2">
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button size="sm" variant="outline" onClick={printPdf} className="gap-2">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
          <iframe src={pdf.url} title="DL PDF preview" className="h-[640px] w-full bg-muted" />
        </Card>
      )}

      <Card className="overflow-hidden shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-semibold">DL Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">DL Number</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Cost</th>
                <th className="px-5 py-3">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dlRequests.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-mono text-xs">{r.input_value}</td>
                  <td className="px-5 py-3">
                    {r.status === "completed" ? (
                      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                        Failed
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">{formatINR(Number(r.cost))}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {dlRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                    <IdCard className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No DL requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <iframe ref={printRef} title="dl-print-frame" className="hidden" />
    </div>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Printer } from "lucide-react";

type DocRequest = {
  id: string;
  service_name: string;
  input_value: string;
  created_at: string;
  result_data: any;
};

export function DocumentDialog({
  request,
  onOpenChange,
}: {
  request: DocRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const fields: Record<string, string> = request?.result_data?.fields ?? {};
  const reference: string = request?.result_data?.reference ?? "";
  const mode: string = request?.result_data?.mode ?? "";

  function printDoc() {
    const win = window.open("", "_blank", "width=800,height=1000");
    if (!win || !request) return;
    const rows = Object.entries(fields)
      .map(
        ([k, v]) =>
          `<tr><td style="padding:10px 14px;border:1px solid #e2e5ec;color:#5b6472;font-size:13px;width:45%">${k}</td><td style="padding:10px 14px;border:1px solid #e2e5ec;font-weight:600;color:#1f2533;font-size:13px">${v}</td></tr>`,
      )
      .join("");
    win.document.write(`<!doctype html><html><head><title>${request.service_name} - ${reference}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;margin:0;padding:40px;color:#1f2533}
      .head{display:flex;align-items:center;gap:12px;border-bottom:3px solid #2b3a67;padding-bottom:16px}
      .badge{background:#2b3a67;color:#fff;width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700}
      h1{font-size:20px;margin:0}.sub{color:#6b7280;font-size:12px;margin-top:2px}
      table{border-collapse:collapse;width:100%;margin-top:24px}
      .meta{margin-top:18px;font-size:12px;color:#6b7280}
      .stamp{margin-top:28px;border:2px dashed #c4a24c;color:#9a7b28;display:inline-block;padding:8px 16px;border-radius:8px;font-weight:700;letter-spacing:1px}
      .foot{margin-top:40px;font-size:11px;color:#9aa1ad;border-top:1px solid #e2e5ec;padding-top:12px}</style></head>
      <body><div class="head"><div class="badge">SK</div><div><h1>Vighnaharta Solutions</h1><div class="sub">${request.service_name} — Document Extract</div></div></div>
      <div class="meta">Reference No: <b>${reference}</b> &nbsp;|&nbsp; Generated: ${new Date(request.created_at).toLocaleString("en-IN")}</div>
      <table>${rows}</table>
      ${mode === "DEMO" ? '<div class="stamp">DEMO / SAMPLE — NOT AN OFFICIAL DOCUMENT</div>' : ""}
      <div class="foot">This document was generated via Vighnaharta Solutions. For official records, please verify with the issuing authority.</div>
      <script>window.onload=function(){window.print();}</script></body></html>`);
    win.document.close();
  }

  return (
    <Dialog open={!!request} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {request?.service_name}
          </DialogTitle>
        </DialogHeader>
        {request && (
          <div>
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
              Reference: <span className="font-semibold text-foreground">{reference}</span>
            </div>
            <div className="mt-3 divide-y divide-border rounded-lg border border-border">
              {Object.entries(fields).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right font-medium">{v}</span>
                </div>
              ))}
            </div>
            {mode === "DEMO" && (
              <p className="mt-3 rounded-md bg-accent/15 px-3 py-2 text-xs text-accent-foreground">
                Demo mode: sample data shown. Connect a KYC provider API key to return live records.
              </p>
            )}
            <Button onClick={printDoc} className="mt-4 w-full gap-2">
              <Printer className="h-4 w-4" /> Download / Print PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
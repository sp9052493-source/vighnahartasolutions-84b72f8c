import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  CreditCard,
  IdCard,
  Fingerprint,
  Vote,
  BookUser,
  Car,
  Wheat,
  Landmark,
  FileText,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useServices, useMe, formatINR } from "@/lib/queries";
import { processDocumentRequest } from "@/lib/portal.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentDialog } from "@/components/portal/DocumentDialog";
import logo from "@/assets/vighnaharta-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/services")({
  head: () => ({ meta: [{ title: "All Services — Vighnaharta Solutions" }] }),
  component: Services,
});

type Meta = {
  icon: LucideIcon;
  tone: string;
  ring: string;
  category: string;
  issuer: string;
  docs: string[];
  tagline: string;
};

const META: Record<string, Meta> = {
  DL: {
    icon: IdCard,
    tone: "from-[oklch(0.55_0.16_255)] to-[oklch(0.38_0.13_265)]",
    ring: "ring-[oklch(0.55_0.16_255_/_0.22)]",
    category: "Transport",
    issuer: "Sarathi / Ministry of Road Transport",
    docs: ["Driving Licence Number (DL No.)", "Date of Birth"],
    tagline: "Fetch & print Driving Licence details",
  },
  RC: {
    icon: Car,
    tone: "from-[oklch(0.55_0.15_220)] to-[oklch(0.38_0.13_230)]",
    ring: "ring-[oklch(0.55_0.15_220_/_0.22)]",
    category: "Transport",
    issuer: "Vahan / RTO",
    docs: ["Vehicle Registration Number", "Chassis / Engine (last 5 digits)"],
    tagline: "Vehicle Registration Certificate print",
  },
  PAN: {
    icon: CreditCard,
    tone: "from-[oklch(0.7_0.16_55)] to-[oklch(0.55_0.16_45)]",
    ring: "ring-[oklch(0.7_0.16_55_/_0.22)]",
    category: "Income Tax",
    issuer: "NSDL / UTIITSL",
    docs: ["Aadhaar Number", "Registered Mobile (for OTP)"],
    tagline: "PAN linked to Aadhaar fetch",
  },
  AADHAAR: {
    icon: Fingerprint,
    tone: "from-[oklch(0.6_0.15_155)] to-[oklch(0.45_0.13_160)]",
    ring: "ring-[oklch(0.6_0.15_155_/_0.22)]",
    category: "UIDAI",
    issuer: "UIDAI",
    docs: ["Aadhaar / VID Number", "Registered Mobile for OTP"],
    tagline: "e-Aadhaar download & verification",
  },
  VOTER: {
    icon: Vote,
    tone: "from-[oklch(0.58_0.18_25)] to-[oklch(0.45_0.16_20)]",
    ring: "ring-[oklch(0.58_0.18_25_/_0.22)]",
    category: "Election Commission",
    issuer: "ECI / NVSP",
    docs: ["EPIC / Voter ID Number", "State of registration"],
    tagline: "Voter ID print & verification",
  },
  PASSPORT: {
    icon: BookUser,
    tone: "from-[oklch(0.5_0.13_300)] to-[oklch(0.38_0.12_295)]",
    ring: "ring-[oklch(0.5_0.13_300_/_0.22)]",
    category: "MEA",
    issuer: "Passport Seva, MEA",
    docs: ["Passport File Number", "Date of Birth"],
    tagline: "Passport application status",
  },
  RATION: {
    icon: Wheat,
    tone: "from-[oklch(0.62_0.15_85)] to-[oklch(0.48_0.13_80)]",
    ring: "ring-[oklch(0.62_0.15_85_/_0.22)]",
    category: "Food & Civil Supplies",
    issuer: "Government of Maharashtra",
    docs: ["Ration Card Number", "Aadhaar of head of family"],
    tagline: "Ration card print & member details",
  },
  AAPLE_SARKAR: {
    icon: Landmark,
    tone: "from-[oklch(0.45_0.12_265)] to-[oklch(0.32_0.10_260)]",
    ring: "ring-[oklch(0.45_0.12_265_/_0.22)]",
    category: "Aaple Sarkar",
    issuer: "Government of Maharashtra",
    docs: ["Applicant Aadhaar", "Service-specific supporting documents"],
    tagline: "Maharashtra State certificates",
  },
};

const DEFAULT_META: Meta = {
  icon: FileText,
  tone: "from-[oklch(0.45_0.10_262)] to-[oklch(0.30_0.08_262)]",
  ring: "ring-[oklch(0.45_0.10_262_/_0.22)]",
  category: "Document Service",
  issuer: "Government of India",
  docs: ["Reference number"],
  tagline: "Official document service",
};

function Services() {
  const { data: services } = useServices();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<any | null>(null);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<any | null>(null);

  const processFn = useServerFn(processDocumentRequest);
  const mutation = useMutation({
    mutationFn: (vars: { serviceId: string; inputValue: string }) => processFn({ data: vars }),
    onSuccess: (res) => {
      toast.success("Document fetched successfully");
      setActive(null);
      setValue("");
      setResult(res.request);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
    onError: (e: any) => toast.error(e?.message || "Request failed"),
  });

  const activeServices = (services ?? []).filter((s) => s.active);
  const activeMeta = active ? (META[active.code] ?? DEFAULT_META) : DEFAULT_META;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,oklch(0.25_0.08_262)_0%,oklch(0.18_0.07_262)_100%)] p-6 text-primary-foreground shadow-elegant lg:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[oklch(0.76_0.16_64_/_0.20)] blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-[linear-gradient(90deg,#FF9933_0%,#ffffff_50%,#138808_100%)] opacity-60" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-white/30">
              <img src={logo.url} alt="Vighnaharta Solutions" className="h-14 w-14 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[oklch(0.82_0.17_64)]">
                <ShieldCheck className="h-3 w-3" /> Authorised Service Portal
              </div>
              <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight">
                All Government Services
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/70">
                Single window for documents from RTO, Income Tax, UIDAI, ECI &amp; Aaple Sarkar.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-right backdrop-blur">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
              Available Services
            </div>
            <div className="font-display text-2xl font-extrabold tabular-nums">
              {activeServices.length.toString().padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeServices.map((s) => {
          const meta = META[s.code] ?? DEFAULT_META;
          const Icon = meta.icon;
          return (
            <Card
              key={s.id}
              className="group relative flex flex-col overflow-hidden border-border bg-card p-0 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant"
            >
              {/* Top accent bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${meta.tone}`} />

              {/* Header */}
              <div className="flex items-start gap-3.5 p-5 pb-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.tone} text-white shadow-md ring-4 ${meta.ring}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge
                    variant="outline"
                    className="mb-1 h-5 border-primary/20 bg-primary/5 px-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary"
                  >
                    {meta.category}
                  </Badge>
                  <h3 className="font-display text-[15px] font-extrabold leading-tight tracking-tight text-foreground">
                    {s.name}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{meta.tagline}</p>
                </div>
              </div>

              {/* Issuer */}
              <div className="mx-5 flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-1.5">
                <Landmark className="h-3 w-3 text-muted-foreground" />
                <span className="truncate text-[10.5px] font-medium text-muted-foreground">
                  Issued by <span className="font-semibold text-foreground/80">{meta.issuer}</span>
                </span>
              </div>

              {/* Required documents */}
              <div className="px-5 pt-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Required Documents
                </div>
                <ul className="mt-1.5 space-y-1">
                  {meta.docs.map((d) => (
                    <li key={d} className="flex items-start gap-1.5 text-[12px] leading-snug text-foreground/80">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[oklch(0.62_0.14_155)]" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer: price + CTA */}
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-3.5">
                <div>
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Service Fee
                  </div>
                  <div className="font-display text-lg font-extrabold tabular-nums text-foreground">
                    {formatINR(Number(s.price))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setActive(s);
                    setValue("");
                  }}
                  className="h-9 gap-1.5 bg-[linear-gradient(135deg,oklch(0.30_0.08_262),oklch(0.22_0.07_262))] px-3.5 text-[12px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-transform group-hover:scale-[1.03] hover:opacity-95"
                >
                  Apply <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
        {activeServices.length === 0 && (
          <Card className="col-span-full p-12 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-3 h-10 w-10 opacity-40" />
            No services are enabled at the moment.
          </Card>
        )}
      </div>

      {/* Apply dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${activeMeta.tone} text-white shadow-md`}
              >
                <activeMeta.icon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-left">{active?.name}</DialogTitle>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {activeMeta.issuer}
                </div>
              </div>
            </div>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!active) return;
              mutation.mutate({ serviceId: active.id, inputValue: value.trim() });
            }}
            className="space-y-4"
          >
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                You will need
              </div>
              <ul className="mt-1.5 space-y-1">
                {activeMeta.docs.map((d) => (
                  <li key={d} className="flex items-start gap-1.5 text-[12.5px] text-foreground/85">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[oklch(0.62_0.14_155)]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="num">{active?.input_label}</Label>
              <Input
                id="num"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter ${active?.input_label}`}
                autoFocus
                maxLength={40}
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Service fee (debited from wallet)</span>
              <span className="font-display text-base font-extrabold tabular-nums">
                {formatINR(Number(active?.price ?? 0))}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Wallet balance</span>
              <span className="font-semibold tabular-nums text-foreground">{formatINR(me?.balance ?? 0)}</span>
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fetch &amp; Pay
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <DocumentDialog request={result} onOpenChange={(o) => !o && setResult(null)} />
    </div>
  );
}

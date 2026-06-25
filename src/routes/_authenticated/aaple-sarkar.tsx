import { createFileRoute } from "@tanstack/react-router";
import {
  Landmark,
  ExternalLink,
  FileText,
  Home,
  Users,
  Briefcase,
  HeartPulse,
  GraduationCap,
  ScrollText,
  BadgeCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/aaple-sarkar")({
  head: () => ({ meta: [{ title: "Aaple Sarkar — Sevakart Portal" }] }),
  component: AapleSarkar,
});

const PORTAL_URL = "https://aaplesarkar.mahaonline.gov.in/en";

type SarkarService = {
  title: string;
  description: string;
  icon: typeof FileText;
  tone: string;
};

const SERVICES: SarkarService[] = [
  {
    title: "Income Certificate",
    description: "Apply for an income certificate issued by the Revenue Department.",
    icon: Briefcase,
    tone: "from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]",
  },
  {
    title: "Domicile Certificate",
    description: "Proof of permanent residence in the state of Maharashtra.",
    icon: Home,
    tone: "from-[oklch(0.6_0.15_155)] to-[oklch(0.5_0.13_160)]",
  },
  {
    title: "Caste Certificate",
    description: "Apply for SC/ST/OBC/VJNT caste certificates.",
    icon: Users,
    tone: "from-[oklch(0.7_0.16_55)] to-[oklch(0.62_0.16_45)]",
  },
  {
    title: "Age, Nationality & Domicile",
    description: "Combined certificate of age, nationality and domicile.",
    icon: BadgeCheck,
    tone: "from-[oklch(0.58_0.18_25)] to-[oklch(0.5_0.16_20)]",
  },
  {
    title: "Non-Creamy Layer",
    description: "Non-creamy layer certificate for OBC/VJNT applicants.",
    icon: ScrollText,
    tone: "from-[oklch(0.5_0.13_300)] to-[oklch(0.42_0.12_295)]",
  },
  {
    title: "Senior Citizen Certificate",
    description: "Certificate confirming senior citizen status.",
    icon: HeartPulse,
    tone: "from-[oklch(0.6_0.16_20)] to-[oklch(0.5_0.14_15)]",
  },
  {
    title: "Solvency Certificate",
    description: "Financial solvency certificate from the Revenue Department.",
    icon: FileText,
    tone: "from-[oklch(0.55_0.14_220)] to-[oklch(0.45_0.12_230)]",
  },
  {
    title: "Educational / EWS",
    description: "Educational and Economically Weaker Section certificates.",
    icon: GraduationCap,
    tone: "from-[oklch(0.6_0.13_185)] to-[oklch(0.5_0.12_190)]",
  },
];

function openPortal() {
  window.open(PORTAL_URL, "_blank", "noopener,noreferrer");
}

function AapleSarkar() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-br from-[oklch(0.5_0.13_280)] to-[oklch(0.38_0.11_265)] p-6 text-primary-foreground shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Landmark className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Aaple Sarkar</h1>
            <p className="mt-1 max-w-2xl text-sm text-primary-foreground/85">
              Government of Maharashtra Right-to-Service portal. Apply for revenue and citizen
              certificates directly through the official Aaple Sarkar service.
            </p>
          </div>
        </div>
        <Button
          onClick={openPortal}
          variant="secondary"
          className="shrink-0 gap-2 font-semibold"
        >
          Open Portal <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => (
          <Card
            key={s.title}
            className="flex flex-col p-5 shadow-card transition-shadow hover:shadow-elegant"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.tone} text-primary-foreground shadow-sm`}
            >
              <s.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description}</p>
            <Button onClick={openPortal} variant="outline" className="mt-4 gap-2">
              Apply on Aaple Sarkar <ExternalLink className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-5 text-sm text-muted-foreground shadow-card">
        Applications are processed on the official Government of Maharashtra Aaple Sarkar portal.
        Sevakart provides quick access to these services; final submission and document upload happen
        on the government site.
      </Card>
    </div>
  );
}
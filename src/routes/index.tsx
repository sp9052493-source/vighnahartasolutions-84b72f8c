import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  CreditCard,
  IdCard,
  Fingerprint,
  Vote,
  BookUser,
  Wallet,
  Users,
  FileCheck2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-portal.jpg";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vighnaharta Solutions — Government Documents Portal for Retailers" },
      {
        name: "description",
        content:
          "B2B portal to fetch Driving License, PAN, Aadhaar, Voter ID and Passport as PDF — with wallet and commission management.",
      },
      { property: "og:title", content: "Vighnaharta Solutions — Document Services Portal" },
      {
        property: "og:description",
        content: "Secure retailer & distributor portal for government document services.",
      },
      { property: "og:url", content: "https://vighnahartasolutions.lovable.app/" },
    ],
    links: [
      { rel: "canonical", href: "https://vighnahartasolutions.lovable.app/" },
      { rel: "preload", as: "image", href: heroImg, fetchpriority: "high" } as never,
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Vighnaharta Solutions",
          url: "https://vighnahartasolutions.lovable.app",
        }),
      },
    ],
  }),
  component: Index,
});

const SERVICES = [
  { icon: CreditCard, name: "Driving License", desc: "Fetch DL details and download as PDF.", tone: "from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]" },
  { icon: IdCard, name: "PAN Card", desc: "Verify and download PAN records.", tone: "from-[oklch(0.7_0.16_55)] to-[oklch(0.62_0.16_45)]" },
  { icon: Fingerprint, name: "Aadhaar", desc: "Aadhaar verification with masked output.", tone: "from-[oklch(0.6_0.15_155)] to-[oklch(0.5_0.13_160)]" },
  { icon: Vote, name: "Voter ID", desc: "EPIC details and downloadable extract.", tone: "from-[oklch(0.58_0.18_25)] to-[oklch(0.5_0.16_20)]" },
  { icon: BookUser, name: "Passport", desc: "Check passport status as PDF.", tone: "from-[oklch(0.5_0.13_300)] to-[oklch(0.42_0.12_295)]" },
];

const ROLES = [
  { icon: ShieldCheck, name: "Administrator", desc: "Creates accounts, sets pricing, manages wallets and oversees the entire network." },
  { icon: Users, name: "Distributor", desc: "Manages assigned retailers and earns commission on every request they make." },
  { icon: FileCheck2, name: "Retailer", desc: "Fetches documents for customers using a prepaid wallet balance." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-6 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/80">
              <Lock className="h-3.5 w-3.5" /> Secure · Role-based · Trusted
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight lg:text-5xl">
              Government Documents, <span className="text-accent">on demand.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-primary-foreground/75">
              A professional B2B portal for retailers and distributors to fetch Driving License, PAN,
              Aadhaar, Voter ID and Passport documents as PDF — with built-in wallet and commission
              management.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2 bg-accent-gradient text-[oklch(0.25_0.06_60)] hover:opacity-90">
                  Access Portal <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#services">
                <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10">
                  View Services
                </Button>
              </a>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Secure government documents — Driving License, PAN, Aadhaar and Passport"
              width={1024}
              height={1024}
              fetchPriority="high"
              className="mx-auto w-full max-w-md rounded-2xl shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold">Document Services</h2>
          <p className="mt-3 text-muted-foreground">Every essential government document, in one portal.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.name} className="rounded-xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-elegant">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.tone} text-primary-foreground shadow-sm`}>
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
          <div className="flex flex-col justify-center rounded-xl bg-hero p-6 text-primary-foreground shadow-card">
            <Wallet className="h-6 w-6 text-accent" />
            <h3 className="mt-4 font-display text-lg font-semibold">Wallet & Commission</h3>
            <p className="mt-1 text-sm text-primary-foreground/70">
              Prepaid wallet for every member with automatic distributor commission on each request.
            </p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold">Built for every role</h2>
            <p className="mt-3 text-muted-foreground">A clear hierarchy from administrator to retailer.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {ROLES.map((r) => (
              <div key={r.name} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{r.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="rounded-2xl bg-hero px-8 py-12 text-center text-primary-foreground shadow-elegant">
          <h2 className="font-display text-3xl font-bold">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/75">
            Sign in to your Vighnaharta Solutions account, or set up the administrator account to begin onboarding
            distributors and retailers.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-6 gap-2 bg-accent-gradient text-[oklch(0.25_0.06_60)] hover:opacity-90">
              Go to Portal <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

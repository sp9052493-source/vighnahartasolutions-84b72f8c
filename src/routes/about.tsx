import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Users, Award, Sparkles, FileCheck2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Vighnaharta Solutions" },
      { name: "description", content: `${COMPANY.brand}, a unit of ${COMPANY.legalName}, is a B2B platform helping retailers deliver PAN, Aadhaar, DL, RC, Ration Card, bill payments and other citizen services to customers across India.` },
      { property: "og:title", content: "About Us — Vighnaharta Solutions" },
      { property: "og:description", content: `${COMPANY.brand} — government documents and digital services for retailers.` },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: ShieldCheck, title: "Trust & Compliance", desc: "Every transaction is audited, encrypted and traceable to keep retailers safe." },
  { icon: Sparkles, title: "Simplicity", desc: "A clean retailer dashboard built for first-time and power users alike." },
  { icon: Users, title: "Retailer-First", desc: "We exist to help small shops earn more through digital citizen services." },
  { icon: Award, title: "Quality Service", desc: "Reliable uptime, real support, and accurate documents — every time." },
];

const SERVICES = [
  "PAN Card lookup & application support",
  "Aadhaar to PAN finder",
  "Driving Licence (DL) print",
  "Vehicle RC print",
  "Ration Card print",
  "Aaple Sarkar certificate applications",
  "Wallet recharge & bill payment assistance",
  "Distributor & retailer commission management",
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <FileCheck2 className="h-3.5 w-3.5" /> About {COMPANY.brand}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold lg:text-5xl">
            Bringing every government service to the neighbourhood retailer.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-primary-foreground/80">
            {COMPANY.brand} is a digital service platform operated by{" "}
            <strong>{COMPANY.legalName}</strong>. We give retailers a single dashboard to assist
            citizens with documents, certificates and bill payments — securely and at scale.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Who we are</h2>
            <p className="mt-4 text-muted-foreground">
              {COMPANY.legalName} is a company registered in {COMPANY.state}, India.
              Through the {COMPANY.brand} platform we equip small businesses, common service
              centres and stationery shops with the tools they need to deliver fast, accurate
              and affordable citizen services.
            </p>
            <p className="mt-3 text-muted-foreground">
              Our mission is simple: make government paperwork effortless for the citizens
              who need it most, while creating a sustainable income stream for the retailer
              serving them.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">What we offer</h2>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {SERVICES.map((s) => (
                <li key={s} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                  <FileCheck2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
          <h2 className="font-display text-2xl font-bold">Our values</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center lg:px-6">
        <h2 className="font-display text-2xl font-bold">Want to know more?</h2>
        <p className="mt-3 text-muted-foreground">
          Our team is happy to walk you through onboarding, pricing and supported services.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/contact"><Button size="lg">Contact Us</Button></Link>
          <Link to="/checkout-flow"><Button size="lg" variant="outline">How payments work</Button></Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

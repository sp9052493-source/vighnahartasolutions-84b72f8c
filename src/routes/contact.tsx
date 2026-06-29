import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Building2, User, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { COMPANY, fullAddress } from "@/lib/company";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Vighnaharta Solutions" },
      { name: "description", content: `Reach the ${COMPANY.brand} support team. Call ${COMPANY.mobile} or email ${COMPANY.email}.` },
      { property: "og:title", content: "Contact Us — Vighnaharta Solutions" },
      { property: "og:description", content: `Get in touch with ${COMPANY.legalName} — operator of ${COMPANY.brand}.` },
      { property: "og:url", content: "https://vighnahartasolutions.lovable.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://vighnahartasolutions.lovable.app/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Vighnaharta Solutions",
          url: "https://vighnahartasolutions.lovable.app/contact",
          mainEntity: {
            "@type": "LocalBusiness",
            name: COMPANY.brand,
            legalName: COMPANY.legalName,
            telephone: COMPANY.mobile,
            email: COMPANY.email,
            address: {
              "@type": "PostalAddress",
              streetAddress: `${COMPANY.addressLine1}, ${COMPANY.addressLine2}`,
              addressLocality: COMPANY.city,
              addressRegion: COMPANY.state,
              postalCode: COMPANY.pincode,
              addressCountry: "IN",
            },
            openingHours: COMPANY.supportHours,
          },
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    // Compose a mailto fallback so the message reaches support without a backend.
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const phone = String(fd.get("phone") ?? "");
    const message = String(fd.get("message") ?? "");
    const subject = encodeURIComponent(`Vighnaharta Solutions enquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
    );
    window.location.href = `mailto:${COMPANY.email}?subject=${subject}&body=${body}`;
    setTimeout(() => {
      setBusy(false);
      setSent(true);
      toast.success("Opening your email app to send the message.");
    }, 400);
  }

  const mapsSrc = `https://www.google.com/maps?q=${encodeURIComponent(COMPANY.mapsQuery)}&output=embed`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <h1 className="font-display text-3xl font-extrabold lg:text-4xl">Contact Us</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">
            We're here to help with onboarding, payments, refunds and service questions.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-3 lg:px-6">
        <div className="space-y-4 lg:col-span-1">
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">Business details</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3"><Building2 className="mt-0.5 h-4 w-4 text-primary" />
                <span><strong>Business Name:</strong> {COMPANY.legalName}</span></li>
              <li className="flex gap-3"><User className="mt-0.5 h-4 w-4 text-primary" />
                <span><strong>Brand Name:</strong> {COMPANY.brand}</span></li>
              <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-primary" />
                <span><strong>Mobile:</strong> <a className="hover:underline" href={`tel:${COMPANY.mobile}`}>{COMPANY.mobile}</a></span></li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 text-primary" />
                <span><strong>Email:</strong> <a className="hover:underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></span></li>
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span><strong>Office:</strong> {fullAddress}</span></li>
              <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 text-primary" />
                <span><strong>Hours:</strong> {COMPANY.supportHours}</span></li>
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <iframe
              title="Vighnaharta Solutions office location"
              src={mapsSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-64 w-full border-0"
              allowFullScreen
            />
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              {fullAddress}
            </div>
          </Card>
        </div>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the form and our team will get back to you within one business day.
          </p>
          {sent ? (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
              <div>
                <div className="font-semibold text-success">Thanks — we received your message.</div>
                <p className="text-muted-foreground">If your email client didn't open, please write to us directly at {COMPANY.email}.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required placeholder="Your name" />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="phone">Mobile</Label>
                <Input id="phone" name="phone" required placeholder="10-digit mobile" inputMode="tel" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required rows={5} placeholder="How can we help?" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="gap-2" disabled={busy}>
                  <Send className="h-4 w-4" /> {busy ? "Sending…" : "Send Message"}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </section>

      <SiteFooter />
    </div>
  );
}

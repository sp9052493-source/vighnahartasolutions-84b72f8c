import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, CheckCircle2, CreditCard, FileText, ListChecks, Receipt, ShieldCheck, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/checkout-flow")({
  head: () => ({
    meta: [
      { title: "Payment & Checkout Flow — Vighnaharta Solutions" },
      { name: "description", content: `Learn how wallet recharge, service selection, payment, order confirmation and invoicing work on ${COMPANY.brand}.` },
      { property: "og:title", content: "Payment & Checkout Flow — Vighnaharta Solutions" },
      { property: "og:description", content: "Step-by-step explanation of payments on Vighnaharta Solutions." },
      { property: "og:url", content: "/checkout-flow" },
    ],
    links: [{ rel: "canonical", href: "/checkout-flow" }],
  }),
  component: CheckoutFlow,
});

const STEPS = [
  { icon: Wallet, title: "1. Wallet Recharge", desc: "Log in to your Vighnaharta Solutions account, open the Wallet Recharge page, pick a quick amount or enter a custom value, then proceed to pay through Paytm Payment Gateway." },
  { icon: CreditCard, title: "2. Secure Payment", desc: "You're redirected to Paytm's secure checkout. UPI, debit / credit cards, net banking and Paytm wallet are supported. We never store your card details." },
  { icon: CheckCircle2, title: "3. Order Confirmation", desc: "On successful payment, Paytm redirects you back to the portal. Your wallet is credited automatically and a transaction entry is generated." },
  { icon: ListChecks, title: "4. Service Selection", desc: "Choose any service — PAN, DL, RC, Ration Card, Aaple Sarkar applications and more. The service fee is deducted from your wallet at the time of the request." },
  { icon: FileText, title: "5. Document Delivery", desc: "The document is fetched in real time from the official source and made available as a downloadable PDF in your dashboard." },
  { icon: Receipt, title: "6. Invoice & Receipt", desc: "Every wallet recharge and service request appears in your Transaction History with a unique reference number that doubles as a receipt for GST purposes." },
];

function CheckoutFlow() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5" /> 100% Secure Checkout
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold lg:text-4xl">
            How Payment &amp; Checkout Works
          </h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">
            Six simple steps — from recharging your wallet to receiving a delivered document with
            a downloadable invoice.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.title} className="p-6 shadow-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-2 lg:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold">Transaction status &amp; history</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                <span><strong>Live status</strong> — every wallet order shows as <em>Pending</em>, <em>Success</em> or <em>Failed</em> on the Wallet Recharge page.</span></li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                <span><strong>Failed payments</strong> never debit your wallet. Funds captured by the bank are reversed within {COMPANY.refundDays}.</span></li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                <span><strong>Receipts</strong> for every recharge and service are available in your dashboard under Transaction History.</span></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Supported payment options</h2>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="rounded-lg border border-border bg-card p-3">UPI — GPay, PhonePe, Paytm</li>
              <li className="rounded-lg border border-border bg-card p-3">Credit &amp; Debit Cards</li>
              <li className="rounded-lg border border-border bg-card p-3">Net Banking — all major banks</li>
              <li className="rounded-lg border border-border bg-card p-3">Paytm Wallet &amp; Postpaid</li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              All payments are processed via Paytm Payment Gateway. Card data is handled by Paytm under PCI-DSS;
              {" "}{COMPANY.brand} does not store any card or banking credentials.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 text-center lg:px-6">
        <h2 className="font-display text-2xl font-bold">Ready to recharge?</h2>
        <p className="mt-3 text-muted-foreground">
          Sign in to your account, top up your wallet and start delivering services in minutes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/auth"><Button size="lg" className="gap-2">Go to Member Login <ArrowRight className="h-4 w-4" /></Button></Link>
          <Link to="/refund-policy"><Button size="lg" variant="outline">Refund Policy</Button></Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

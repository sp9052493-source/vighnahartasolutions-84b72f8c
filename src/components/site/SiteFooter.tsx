import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/sevakart-logo.png";
import { COMPANY, fullAddress } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Vighnaharta Solutions logo" width={36} height={36} className="h-9 w-9 object-contain" />
            <div className="leading-tight">
              <div className="font-display text-base font-bold">{COMPANY.brand}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Powered by {COMPANY.legalName}</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Trusted B2B portal for citizen documents and digital service assistance for retailers across India.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">Company</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact Us</Link></li>
            <li><Link to="/checkout-flow" className="hover:text-foreground">How Payment Works</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">Legal</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link></li>
            <li><Link to="/refund-policy" className="hover:text-foreground">Refund &amp; Cancellation</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">Reach Us</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{fullAddress}</span></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" /><a href={`tel:${COMPANY.mobile}`} className="hover:text-foreground">{COMPANY.mobile}</a></li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${COMPANY.email}`} className="hover:text-foreground">{COMPANY.email}</a></li>
          </ul>
        </div>
      </div>

        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row lg:px-6">
            <p>© 2026 {COMPANY.brand}. Powered by {COMPANY.legalName}. All Rights Reserved.</p>
            <p>Payments are processed securely via Paytm Payment Gateway.</p>
          </div>
        </div>
    </footer>
  );
}

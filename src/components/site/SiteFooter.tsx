import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/vighnaharta-logo.png.asset.json";
import { COMPANY, fullAddress } from "@/lib/company";
import { useSiteSettings } from "@/lib/site-queries";

export function SiteFooter() {
  const { data: s } = useSiteSettings();
  const brand = s?.company_name || COMPANY.brand;
  const legal = s?.brand_tagline?.replace(/^Powered by\s*/i, "") || COMPANY.legalName;
  const phone = s?.phone || COMPANY.mobile;
  const email = s?.contact_email || COMPANY.email;
  const address = s
    ? [s.address_line1, s.address_line2, s.city, s.state, s.pincode, s.country].filter(Boolean).join(", ")
    : fullAddress;
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo.url} alt={`${brand} logo`} width={72} height={72} loading="lazy" decoding="async" className="h-16 w-16 object-contain" />
            <div className="leading-tight">
              <div className="font-display text-base font-bold">{brand}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Powered by {legal}</div>
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
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{address}</span></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" /><a href={`tel:${phone}`} className="hover:text-foreground">{phone}</a></li>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${email}`} className="hover:text-foreground">{email}</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row lg:px-6">
          <p>© {new Date().getFullYear()} {brand}. Powered by {legal}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

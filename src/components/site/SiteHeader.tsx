import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vighnaharta-logo.png.asset.json";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/checkout-flow", label: "How Payment Works" },
  { to: "/privacy-policy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/refund-policy", label: "Refunds" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo.url} alt="Vighnaharta Solutions logo" width={80} height={80} loading="eager" decoding="async" className="h-16 w-16 object-contain" />
          <div className="leading-tight">
            <div className="font-display text-base font-bold">Vighnaharta Solutions</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Powered by Vighnaharta Group Limited</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-sm font-semibold text-foreground bg-accent/50" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:block">
            <Button className="gap-2">
              Member Login <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <button
            type="button"
            aria-label="Toggle navigation"
            className="rounded-md border border-border p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-card lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-foreground bg-accent/50" }}
                activeOptions={{ exact: true }}
              >
                {n.label}
              </Link>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)} className="mt-2">
              <Button className="w-full gap-2">
                Member Login <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Users,
  Settings,
  SlidersHorizontal,
  Menu,
  LogOut,
  ShieldCheck,
  FileStack,
  Car,
  CreditCard,
  IdCard,
  Wheat,
  Landmark,
  ShieldCheck as ShieldCheckIcon,

} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, formatINR, type AppRole } from "@/lib/queries";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import logo from "@/assets/vighnaharta-logo.png.asset.json";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: AppRole[] };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "distributor", "retailer"] },
  { to: "/services", label: "Services", icon: FileStack, roles: ["distributor", "retailer"] },
  { to: "/rc-print", label: "Vehicle RC Print", icon: Car, roles: ["distributor", "retailer"] },
  { to: "/dl-print", label: "Driving Licence Print", icon: IdCard, roles: ["distributor", "retailer"] },
  { to: "/ration-print", label: "Ration Card Print", icon: Wheat, roles: ["distributor", "retailer"] },
  { to: "/aadhaar-to-pan", label: "Aadhaar to PAN", icon: CreditCard, roles: ["distributor", "retailer"] },
  { to: "/aaple-sarkar", label: "Aaple Sarkar", icon: Landmark, roles: ["distributor", "retailer"] },
  { to: "/requests", label: "My Requests", icon: FileText, roles: ["distributor", "retailer"] },
  { to: "/wallet", label: "Wallet", icon: Wallet, roles: ["admin", "distributor", "retailer"] },
  { to: "/recharge", label: "Wallet Recharge", icon: CreditCard, roles: ["distributor", "retailer"] },
  { to: "/members", label: "Members", icon: Users, roles: ["admin", "distributor"] },
  { to: "/admin", label: "Admin Control", icon: ShieldCheckIcon, roles: ["admin"] },
  { to: "/manage-services", label: "Service Pricing", icon: SlidersHorizontal, roles: ["admin"] },
  { to: "/aaple-sarkar-requests", label: "Aaple Sarkar Desk", icon: Landmark, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["admin", "distributor", "retailer"] },
];

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  distributor: "Distributor",
  retailer: "Retailer",
};

function NavLinks({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.filter((n) => n.roles.includes(role)).map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="relative overflow-hidden border-b border-sidebar-border/60">
      <div className="absolute inset-x-0 top-0 h-1 bg-accent-gradient" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[oklch(0.76_0.16_64_/_0.18)] blur-3xl" />
      <div className="relative flex flex-col items-center gap-3 px-5 pb-6 pt-7 text-center">
        <div className="rounded-2xl bg-white p-2 shadow-[0_8px_24px_-12px_oklch(0_0_0_/_0.6)] ring-1 ring-white/10">
          <img
            src={logo.url}
            alt="Vighnaharta Solutions logo"
            width={140}
            height={140}
            loading="eager"
            decoding="async"
            className="h-20 w-20 object-contain"
          />
        </div>
        <div className="leading-tight">
          <div className="font-display text-[1.05rem] font-extrabold tracking-tight text-sidebar-foreground">
            VIGHNAHARTA <span className="text-[oklch(0.82_0.17_64)]">SOLUTIONS</span>
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/55">
            Powered by Vighnaharta Group Ltd.
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const role = me?.role ?? "retailer";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebarBody = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,oklch(0.27_0.08_262)_0%,oklch(0.22_0.07_262)_100%)]">
      <Brand />
      <div className="mx-3 mt-4 mb-4 rounded-xl border border-sidebar-border/50 bg-[linear-gradient(135deg,oklch(0.33_0.08_262)_0%,oklch(0.28_0.08_262)_100%)] px-4 py-3 shadow-[inset_0_1px_0_oklch(1_0_0_/_0.06)]">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">Wallet Balance</div>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[oklch(0.76_0.16_64)]" />
        </div>
        <div className="font-display text-2xl font-extrabold text-[oklch(0.82_0.17_64)]">{formatINR(me?.balance ?? 0)}</div>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <NavLinks role={role} onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border/60 p-3">
        <div className="mb-2 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.76_0.16_64)] text-sm font-bold text-[oklch(0.25_0.06_60)]">
            {(me?.profile?.full_name || me?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-sidebar-foreground">{me?.profile?.full_name || me?.email}</div>
            <div className="text-[11px] uppercase tracking-wide text-sidebar-foreground/55">{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-72 shrink-0 bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">{sidebarBody}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-1 bg-accent-gradient" />
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 border-0 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebarBody}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="rounded-lg bg-white p-0.5 ring-1 ring-border">
              <img src={logo.url} alt="Vighnaharta Solutions logo" width={64} height={64} loading="eager" decoding="async" className="h-10 w-10 object-contain" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-bold">Vighnaharta Solutions</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Vighnaharta Group Ltd.</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 sm:flex">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <div className="text-right leading-tight">
                <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Wallet</div>
                <div className="text-xs font-bold text-primary">{formatINR(me?.balance ?? 0)}</div>
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,oklch(0.34_0.09_261),oklch(0.26_0.08_262))] text-sm font-bold text-primary-foreground shadow-md ring-2 ring-[oklch(0.76_0.16_64_/_0.5)]">
              {(me?.profile?.full_name || me?.email || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 animate-in fade-in duration-500">{children}</main>
      </div>
    </div>
  );
}
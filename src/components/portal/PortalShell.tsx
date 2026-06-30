import { useEffect, useState, type ReactNode } from "react";
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
  FileStack,
  FileClock,
  Car,
  CreditCard,
  IdCard,
  Wheat,
  Landmark,
  Newspaper,
  FileCheck2,
  Building2,
  Briefcase,
  Utensils,
  ShieldCheck as ShieldCheckIcon,
  Search,
  Plus,
  Bell,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, formatINR, type AppRole } from "@/lib/queries";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import logo from "@/assets/vighnaharta-logo.png.asset.json";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: AppRole[] };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "distributor", "retailer"] },
      { to: "/services", label: "All Services", icon: FileStack, roles: ["distributor", "retailer"] },
    ],
  },
  {
    label: "Document Services",
    items: [
      { to: "/rc-print", label: "Vehicle RC Print", icon: Car, roles: ["distributor", "retailer"] },
      { to: "/dl-print", label: "Driving Licence", icon: IdCard, roles: ["distributor", "retailer"] },
      { to: "/ration-print", label: "Ration Card", icon: Wheat, roles: ["distributor", "retailer"] },
      { to: "/aadhaar-to-pan", label: "Aadhaar → PAN", icon: CreditCard, roles: ["distributor", "retailer"] },
      { to: "/pan-details", label: "PAN Details", icon: IdCard, roles: ["distributor", "retailer"] },
      { to: "/aaple-sarkar", label: "Aaple Sarkar", icon: Landmark, roles: ["distributor", "retailer"] },
      { to: "/gazette", label: "Gazette Certificate", icon: Newspaper, roles: ["distributor", "retailer"] },
      { to: "/gst", label: "GST Registration", icon: FileCheck2, roles: ["distributor", "retailer"] },
      { to: "/gst-requests", label: "My GST Applications", icon: FileText, roles: ["distributor", "retailer"] },
      { to: "/udyam", label: "Udyam Aadhaar", icon: Building2, roles: ["distributor", "retailer"] },
      { to: "/udyam-applications", label: "My Udyam Applications", icon: FileText, roles: ["distributor", "retailer"] },
      { to: "/shopact", label: "Shop Act Registration", icon: Briefcase, roles: ["distributor", "retailer"] },
      { to: "/shopact-applications", label: "My Shop Act Applications", icon: FileText, roles: ["distributor", "retailer"] },
      { to: "/fssai", label: "Food License (FSSAI)", icon: Utensils, roles: ["distributor", "retailer"] },
      { to: "/fssai-applications", label: "My Food License Applications", icon: FileText, roles: ["distributor", "retailer"] },
    ],
  },
  {
    label: "Accounts & Wallet",
    items: [
      { to: "/requests", label: "My Requests", icon: FileText, roles: ["distributor", "retailer"] },
      { to: "/drafts", label: "Drafts", icon: FileClock, roles: ["distributor", "retailer"] },
      { to: "/wallet", label: "Wallet", icon: Wallet, roles: ["admin", "distributor", "retailer"] },
      { to: "/recharge", label: "Add Money", icon: CreditCard, roles: ["distributor", "retailer"] },
      { to: "/members", label: "Members", icon: Users, roles: ["admin", "distributor"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin", label: "Admin Control", icon: ShieldCheckIcon, roles: ["admin"] },
      { to: "/manage-services", label: "Service Pricing", icon: SlidersHorizontal, roles: ["admin"] },
      { to: "/aaple-sarkar-requests", label: "Aaple Sarkar Desk", icon: Landmark, roles: ["admin"] },
      { to: "/admin/gst-desk", label: "GST Desk", icon: FileCheck2, roles: ["admin"] },
      { to: "/admin/gst", label: "GST Settings", icon: SlidersHorizontal, roles: ["admin"] },
      { to: "/admin/udyam", label: "Udyam Aadhaar Desk", icon: Building2, roles: ["admin"] },
      { to: "/admin/udyam-settings", label: "Udyam Settings", icon: SlidersHorizontal, roles: ["admin"] },
      { to: "/admin/shopact", label: "Shop Act Desk", icon: Briefcase, roles: ["admin"] },
      { to: "/admin/shopact-settings", label: "Shop Act Settings", icon: SlidersHorizontal, roles: ["admin"] },
      { to: "/admin/fssai", label: "Food License Desk", icon: Utensils, roles: ["admin"] },
      { to: "/admin/fssai-settings", label: "Food License Settings", icon: SlidersHorizontal, roles: ["admin"] },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/settings", label: "Settings", icon: Settings, roles: ["admin", "distributor", "retailer"] }],
  },
];

const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  distributor: "Distributor",
  retailer: "Retailer",
};

function NavGroups({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-5 px-3 pb-6">
      {NAV_GROUPS.map((group) => {
        const visible = group.items.filter((i) => i.roles.includes(role));
        if (!visible.length) return null;
        return (
          <div key={group.label}>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40">
              {group.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {visible.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all duration-200",
                      active
                        ? "bg-[oklch(0.33_0.08_262)] text-sidebar-foreground shadow-[inset_0_1px_0_oklch(1_0_0_/_0.06)]"
                        : "text-sidebar-foreground/70 hover:bg-[oklch(0.31_0.08_262)] hover:text-sidebar-foreground hover:translate-x-[2px]",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[oklch(0.76_0.16_64)] transition-all duration-300",
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                      )}
                    />
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active && "text-[oklch(0.82_0.17_64)]")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/60" />}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function TricolorRibbon() {
  return (
    <div className="flex h-1 w-full">
      <div className="h-full flex-1 bg-[#FF9933]" />
      <div className="h-full flex-1 bg-white" />
      <div className="h-full flex-1 bg-[#138808]" />
    </div>
  );
}

function Brand() {
  return (
    <div className="relative overflow-hidden">
      <TricolorRibbon />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,oklch(0.76_0.16_64_/_0.18),transparent_60%)]" />
      <div className="relative flex items-center gap-3 px-5 py-5">
        <div className="rounded-xl bg-white p-1.5 shadow-[0_10px_30px_-15px_oklch(0_0_0_/_0.8)] ring-1 ring-white/20">
          <img
            src={logo.url}
            alt="Vighnaharta Solutions"
            width={120}
            height={120}
            loading="eager"
            decoding="async"
            className="h-12 w-12 object-contain"
          />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="font-display text-[15px] font-extrabold tracking-tight text-sidebar-foreground">
            VIGHNAHARTA
          </div>
          <div className="font-display text-[15px] font-extrabold leading-tight tracking-tight text-[oklch(0.82_0.17_64)]">
            SOLUTIONS
          </div>
          <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
            B2B Government Services
          </div>
        </div>
      </div>
    </div>
  );
}

// Wallet balance is shown once in the top header (right side) to avoid duplication.


function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function PortalShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const role = me?.role ?? "retailer";
  const now = useClock();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebarBody = (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,oklch(0.25_0.08_262)_0%,oklch(0.19_0.07_262)_100%)]">
      <Brand />

      <div className="flex-1 overflow-y-auto">
        <NavGroups role={role} onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border/40 bg-[oklch(0.18_0.07_262)] p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-[oklch(0.23_0.07_262)] px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[linear-gradient(135deg,oklch(0.82_0.17_64),oklch(0.70_0.16_50))] text-sm font-bold text-[oklch(0.22_0.06_60)] shadow-[0_4px_12px_-4px_oklch(0.76_0.16_64_/_0.6)]">
            {(me?.profile?.full_name || me?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-sidebar-foreground">{me?.profile?.full_name || me?.email}</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[oklch(0.82_0.17_64)]">{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-[oklch(0.30_0.08_262)] hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex min-h-screen w-full bg-[oklch(0.97_0.005_250)]">
      <aside className="hidden w-[280px] shrink-0 lg:block">
        <div className="sticky top-0 h-screen overflow-hidden border-r border-[oklch(0.20_0.07_262_/_0.4)]">{sidebarBody}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TricolorRibbon />
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md">
          <div className="flex h-[68px] items-center gap-3 px-4 lg:px-7">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] border-0 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {sidebarBody}
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="rounded-lg bg-white p-0.5 ring-1 ring-border">
                <img src={logo.url} alt="Vighnaharta Solutions" width={48} height={48} className="h-8 w-8 object-contain" />
              </div>
            </div>

            {/* Command-bar search */}
            <div className="relative hidden max-w-md flex-1 md:flex">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services, requests, members…"
                className="h-11 rounded-lg border-border bg-[oklch(0.96_0.006_250)] pl-10 pr-16 text-[13.5px] shadow-none transition-colors focus-visible:border-primary focus-visible:bg-background"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
                ⌘K
              </kbd>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Date / time chip */}
              <div className="hidden h-11 flex-col justify-center rounded-lg border border-border bg-[oklch(0.97_0.005_250)] px-3.5 text-right leading-tight xl:flex">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{dateStr}</div>
                <div className="font-display text-[13px] font-bold tabular-nums text-foreground">{timeStr} IST</div>
              </div>

              {/* Balance pill — single source of truth for wallet balance */}
              <Link
                to="/recharge"
                className="group hidden h-11 items-center gap-2.5 rounded-lg border border-[oklch(0.76_0.16_64_/_0.35)] bg-[linear-gradient(135deg,oklch(0.98_0.02_85),oklch(0.95_0.05_75))] px-3 transition-all hover:shadow-md sm:flex"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[oklch(0.76_0.16_64)] text-[oklch(0.22_0.06_60)]">
                  <Wallet className="h-3.5 w-3.5" />
                </div>
                <div className="text-right leading-tight">
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[oklch(0.45_0.10_60)]">Wallet Balance</div>
                  <div className="font-display text-[14px] font-extrabold tabular-nums text-[oklch(0.30_0.08_60)]">{formatINR(me?.balance ?? 0)}</div>
                </div>
                <span className="ml-1 flex h-7 w-7 items-center justify-center rounded-md bg-[oklch(0.30_0.08_262)] text-[oklch(0.92_0.05_85)] transition-transform group-hover:scale-105">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </Link>


              {/* Notifications */}
              <Button variant="outline" size="icon" className="relative h-11 w-11 rounded-lg border-border bg-background">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[oklch(0.76_0.16_64)] ring-2 ring-card" />
              </Button>

              {/* User chip */}
              <div className="flex h-11 items-center gap-2.5 rounded-lg border border-border bg-card pl-1 pr-3.5 transition-all hover:border-primary/40 hover:shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[linear-gradient(135deg,oklch(0.34_0.09_261),oklch(0.22_0.07_262))] text-xs font-bold text-primary-foreground ring-1 ring-[oklch(0.76_0.16_64_/_0.5)]">
                  {(me?.profile?.full_name || me?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left leading-tight sm:block">
                  <div className="max-w-[150px] truncate text-[12.5px] font-bold uppercase tracking-wide text-foreground">
                    {me?.profile?.full_name || me?.email?.split("@")[0]}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[oklch(0.50_0.10_60)]">
                    {ROLE_LABEL[role]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main key={useRouterState({ select: (s) => s.location.pathname })} className="flex-1 px-4 py-6 lg:px-8 lg:py-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}

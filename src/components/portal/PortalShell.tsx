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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, formatINR, type AppRole } from "@/lib/queries";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import logo from "@/assets/sevakart-logo.png";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: AppRole[] };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "distributor", "retailer"] },
  { to: "/services", label: "Services", icon: FileStack, roles: ["distributor", "retailer"] },
  { to: "/rc-print", label: "Vehicle RC Print", icon: Car, roles: ["distributor", "retailer"] },
  { to: "/dl-print", label: "Driving Licence Print", icon: IdCard, roles: ["distributor", "retailer"] },
  { to: "/ration-print", label: "Ration Card Print", icon: Wheat, roles: ["distributor", "retailer"] },
  { to: "/aadhaar-to-pan", label: "Aadhaar to PAN", icon: CreditCard, roles: ["distributor", "retailer"] },
  { to: "/requests", label: "My Requests", icon: FileText, roles: ["distributor", "retailer"] },
  { to: "/wallet", label: "Wallet", icon: Wallet, roles: ["admin", "distributor", "retailer"] },
  { to: "/recharge", label: "Wallet Recharge", icon: CreditCard, roles: ["distributor", "retailer"] },
  { to: "/members", label: "Members", icon: Users, roles: ["admin", "distributor"] },
  { to: "/manage-services", label: "Service Pricing", icon: SlidersHorizontal, roles: ["admin"] },
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
    <div className="flex items-center gap-2.5 px-5 py-5">
      <img src={logo} alt="Sevakart logo" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
      <div className="leading-tight">
        <div className="font-display text-lg font-bold text-sidebar-foreground">Sevakart</div>
        <div className="text-xs uppercase tracking-wider text-sidebar-foreground/60">Govt Documents Portal</div>
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
    <div className="flex h-full flex-col">
      <Brand />
      <div className="mx-3 mb-4 rounded-lg bg-sidebar-accent/60 px-4 py-3">
        <div className="text-[11px] uppercase tracking-wide text-sidebar-foreground/55">Wallet Balance</div>
        <div className="font-display text-xl font-bold text-sidebar-primary">{formatINR(me?.balance ?? 0)}</div>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <NavLinks role={role} onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-2">
          <div className="truncate text-sm font-medium text-sidebar-foreground">{me?.profile?.full_name || me?.email}</div>
          <div className="text-xs text-sidebar-foreground/60">{ROLE_LABEL[role]}</div>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4.5 w-4.5" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">{sidebarBody}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebarBody}
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="Sevakart logo" width={34} height={34} className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-bold">Sevakart</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-xs text-muted-foreground">Wallet</div>
              <div className="text-sm font-semibold text-primary">{formatINR(me?.balance ?? 0)}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {(me?.profile?.full_name || me?.email || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, Lock, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Sevakart Portal" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  }

  async function register(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: String(fd.get("fullName")).trim() },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Administrator account created. Signing you in...");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-hero p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-gradient text-[oklch(0.25_0.06_60)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-bold">Sevakart Portal</div>
            <div className="text-xs uppercase tracking-wider text-primary-foreground/60">
              Government Documents Services
            </div>
          </div>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight">
            A secure gateway for retailers & distributors
          </h2>
          <p className="mt-4 max-w-md text-primary-foreground/75">
            Fetch Driving License, PAN, Aadhaar, Voter ID and Passport documents — with wallet,
            commission and full request history in one professional dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
          <Lock className="h-4 w-4" /> Bank-grade security · Role-based access
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground lg:hidden">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold">Sevakart Portal</span>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="register">First-time Setup</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <h1 className="mt-6 text-xl font-bold">Member Login</h1>
              <p className="mb-5 text-sm text-muted-foreground">
                Admins, distributors and retailers sign in here.
              </p>
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">Email</Label>
                  <Input id="si-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pass">Password</Label>
                  <Input id="si-pass" name="password" type="password" required autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <h1 className="mt-6 text-xl font-bold">Create Administrator</h1>
              <p className="mb-5 text-sm text-muted-foreground">
                One-time setup. The first account becomes the administrator. Distributor and retailer
                accounts are created from inside the admin dashboard.
              </p>
              <form onSubmit={register} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="r-name">Full name</Label>
                  <Input id="r-name" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-email">Email</Label>
                  <Input id="r-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-pass">Password</Label>
                  <Input id="r-pass" name="password" type="password" minLength={6} required autoComplete="new-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Admin Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
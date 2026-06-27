import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Lock, Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/sevakart-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Vighnaharta Solutions" }] }),
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

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-hero p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Vighnaharta Solutions logo" width={76} height={76} className="h-[4.5rem] w-[4.5rem] object-contain" />
          <div>
            <div className="font-display text-2xl font-bold">Vighnaharta Solutions</div>
            <div className="text-sm uppercase tracking-wider text-primary-foreground/60">
              Powered by Vighnaharta Group Limited
            </div>
          </div>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            A secure gateway for retailers & distributors
          </h2>
          <p className="mt-4 max-w-md text-lg text-primary-foreground/75">
            Fetch Driving License, PAN, Aadhaar, Voter ID and Passport documents — with wallet,
            commission and full request history in one professional dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2 text-base text-primary-foreground/60">
          <Lock className="h-5 w-5" /> Bank-grade security · Role-based access
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-base text-muted-foreground lg:hidden">
            <ArrowLeft className="h-5 w-5" /> Back to home
          </Link>
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <img src={logo} alt="Vighnaharta Solutions logo" width={52} height={52} className="h-12 w-12 object-contain" />
            <span className="font-display text-2xl font-bold">Vighnaharta Solutions</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold">Member Login</h1>
          <p className="mb-6 text-base text-muted-foreground">
            Admins, distributors and retailers sign in here.
          </p>
          <form onSubmit={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="si-email" className="text-base">Email</Label>
              <Input id="si-email" name="email" type="email" required autoComplete="email" className="h-11 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="si-pass" className="text-base">Password</Label>
              <Input id="si-pass" name="password" type="password" required autoComplete="current-password" className="h-11 text-base" />
            </div>
            <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
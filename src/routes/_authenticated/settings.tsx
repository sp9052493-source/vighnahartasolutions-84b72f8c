import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Sevakart Portal" }] }),
  component: Settings,
});

function Settings() {
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me?.profile) {
      setFullName(me.profile.full_name ?? "");
      setPhone(me.profile.phone ?? "");
      setBusiness(me.profile.business_name ?? "");
    }
  }, [me?.profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() || null, business_name: business.trim() || null })
      .eq("id", me.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile details.</p>
      </div>
      <Card className="p-6 shadow-card">
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={me?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fn">Full name</Label>
            <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bn">Business name</Label>
              <Input id="bn" value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={160} />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
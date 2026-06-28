import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { getSiteSettings, adminUpdateSiteSettings } from "@/lib/site.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/admin/site")({
  head: () => ({ meta: [{ title: "Site & Brand — Admin" }] }),
  component: AdminSite,
});

function AdminSite() {
  const getFn = useServerFn(getSiteSettings);
  const updateFn = useServerFn(adminUpdateSiteSettings);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["site-settings"], queryFn: () => getFn() });

  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (data) setForm({ ...data, social: data.social || {} });
  }, [data]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setSocial = (k: string, v: string) => setForm((f: any) => ({ ...f, social: { ...f.social, [k]: v } }));

  const mut = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          company_name: form.company_name,
          brand_tagline: form.brand_tagline,
          contact_email: form.contact_email,
          support_email: form.support_email,
          phone: form.phone,
          whatsapp: form.whatsapp,
          address_line1: form.address_line1,
          address_line2: form.address_line2,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: form.country,
          gst_number: form.gst_number,
          business_hours: form.business_hours,
          logo_url: form.logo_url,
          favicon_url: form.favicon_url,
          social: form.social || {},
        },
      }),
    onSuccess: () => {
      toast.success("Site settings updated");
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  if (isLoading || !data) {
    return (
      <Card className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="space-y-6"
    >
      <Card className="p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Brand</h2>
        <p className="text-sm text-muted-foreground">Shown across the public site and portal.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Company / brand name *">
            <Input value={form.company_name || ""} onChange={(e) => set("company_name", e.target.value)} required />
          </Field>
          <Field label="Tagline">
            <Input value={form.brand_tagline || ""} onChange={(e) => set("brand_tagline", e.target.value)} />
          </Field>
          <Field label="Logo URL">
            <Input value={form.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Favicon URL">
            <Input value={form.favicon_url || ""} onChange={(e) => set("favicon_url", e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Contact</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Primary email *">
            <Input type="email" value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value)} required />
          </Field>
          <Field label="Support email *">
            <Input type="email" value={form.support_email || ""} onChange={(e) => set("support_email", e.target.value)} required />
          </Field>
          <Field label="Phone *">
            <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} required />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp || ""} onChange={(e) => set("whatsapp", e.target.value)} />
          </Field>
          <Field label="Business hours">
            <Input value={form.business_hours || ""} onChange={(e) => set("business_hours", e.target.value)} />
          </Field>
          <Field label="GST number">
            <Input value={form.gst_number || ""} onChange={(e) => set("gst_number", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Registered address</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Address line 1 *" full>
            <Input value={form.address_line1 || ""} onChange={(e) => set("address_line1", e.target.value)} required />
          </Field>
          <Field label="Address line 2" full>
            <Input value={form.address_line2 || ""} onChange={(e) => set("address_line2", e.target.value)} />
          </Field>
          <Field label="City *">
            <Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} required />
          </Field>
          <Field label="State *">
            <Input value={form.state || ""} onChange={(e) => set("state", e.target.value)} required />
          </Field>
          <Field label="Pincode *">
            <Input value={form.pincode || ""} onChange={(e) => set("pincode", e.target.value)} required />
          </Field>
          <Field label="Country *">
            <Input value={form.country || ""} onChange={(e) => set("country", e.target.value)} required />
          </Field>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Social links</h2>
        <Separator className="my-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          {["facebook", "instagram", "twitter", "youtube", "linkedin"].map((k) => (
            <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
              <Input
                value={form.social?.[k] || ""}
                onChange={(e) => setSocial(k, e.target.value)}
                placeholder="https://..."
              />
            </Field>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" className="gap-2 shadow-elegant" disabled={mut.isPending}>
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

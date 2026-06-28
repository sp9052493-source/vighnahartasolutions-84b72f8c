import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, TrendingUp, FileText, Wallet, CalendarDays, CheckCircle2, Mail, KeyRound, Upload, ImageIcon } from "lucide-react";
import { adminMemberDetail, adminUpdateUser } from "@/lib/admin.functions";
import {
  adminChangeUserEmail,
  adminResetUserPassword,
  adminUploadUserAsset,
} from "@/lib/admin-user.functions";
import {
  adminListUserPricing,
  adminUpsertUserPricing,
  adminClearUserPricing,
} from "@/lib/user-pricing.functions";
import { formatINR } from "@/lib/queries";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export function MemberDetailSheet({
  member,
  open,
  onOpenChange,
  distributors,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  distributors: { id: string; full_name: string }[];
}) {
  const detailFn = useServerFn(adminMemberDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["member-detail", member?.id],
    enabled: !!member?.id && open,
    queryFn: () => detailFn({ data: { userId: member!.id } }),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            {member?.full_name || member?.email}
            {member && (
              <Badge variant="outline" className="capitalize">
                {member.role}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="text-base">{member?.email}</SheetDescription>
        </SheetHeader>

        {isLoading || !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="performance" className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="performance">Stats</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-4">
              <PerformanceTab data={data} />
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <DetailsTab
                member={member!}
                profile={data.profile}
                distributors={distributors}
                onSaved={() => onOpenChange(false)}
              />
            </TabsContent>

            <TabsContent value="pricing" className="mt-4">
              <PricingTab userId={member!.id} />
            </TabsContent>

            <TabsContent value="account" className="mt-4">
              <AccountTab member={member!} profile={data.profile} />
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <ActivityTab data={data} />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}

function PerformanceTab({ data }: { data: any }) {
  const maxCount = Math.max(1, ...data.months.map((m: any) => m.count));
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Wallet} label="Wallet balance" value={formatINR(data.balance)} />
        <Stat icon={FileText} label="Total requests" value={String(data.stats.totalRequests)} />
        <Stat icon={CalendarDays} label="This month" value={String(data.stats.monthRequests)} />
        <Stat icon={CheckCircle2} label="Completed" value={String(data.stats.completed)} />
        <Stat icon={TrendingUp} label="Total spent" value={formatINR(data.stats.totalSpent)} />
        <Stat icon={TrendingUp} label="Spent this month" value={formatINR(data.stats.monthSpent)} />
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Monthly activity (last 6 months)</h4>
        <div className="flex items-end gap-2">
          {data.months.map((m: any) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-xs font-medium text-muted-foreground">{m.count}</div>
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${8 + (m.count / maxCount) * 80}px` }}
              />
              <div className="text-xs text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {data.byService.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Requests by service</h4>
          <div className="space-y-2">
            {data.byService.map((s: any) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.name}</span>
                <Badge variant="outline">{s.count}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailsTab({
  member,
  profile,
  distributors,
  onSaved,
}: {
  member: Member;
  profile: any;
  distributors: { id: string; full_name: string }[];
  onSaved: () => void;
}) {
  const updateFn = useServerFn(adminUpdateUser);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fullName: profile?.full_name || "",
    phone: profile?.phone || "",
    businessName: profile?.business_name || "",
    parentId: profile?.parent_id || "",
  });

  useEffect(() => {
    setForm({
      fullName: profile?.full_name || "",
      phone: profile?.phone || "",
      businessName: profile?.business_name || "",
      parentId: profile?.parent_id || "",
    });
  }, [profile]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          userId: member.id,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          businessName: form.businessName.trim(),
          parentId: member.role === "retailer" ? form.parentId || "" : "",
        },
      }),
    onSuccess: () => {
      toast.success("Details updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["member-detail", member.id] });
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Full name</Label>
        <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Business name</Label>
        <Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
      </div>
      {member.role === "retailer" && (
        <div className="space-y-2">
          <Label>Assigned distributor (commission)</Label>
          <Select value={form.parentId} onValueChange={(v) => set("parentId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {distributors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={mut.isPending}>
        {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save details
      </Button>
    </form>
  );
}

function AccountTab({ member, profile }: { member: Member; profile: any }) {
  const emailFn = useServerFn(adminChangeUserEmail);
  const pwFn = useServerFn(adminResetUserPassword);
  const uploadFn = useServerFn(adminUploadUserAsset);
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(member.email);
  const [pw, setPw] = useState("");

  const emailMut = useMutation({
    mutationFn: () => emailFn({ data: { userId: member.id, email: email.trim() } }),
    onSuccess: () => {
      toast.success("Email updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const pwMut = useMutation({
    mutationFn: () => pwFn({ data: { userId: member.id, password: pw } }),
    onSuccess: () => {
      toast.success("Password reset. Share with the user securely.");
      setPw("");
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  async function uploadAsset(field: "photo_url" | "kyc_aadhaar_url" | "kyc_pan_url", file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5 MB");
      return;
    }
    const base64 = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1] || "");
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    try {
      await uploadFn({ data: { userId: member.id, field, filename: file.name, contentType: file.type, base64 } });
      toast.success("Uploaded");
      queryClient.invalidateQueries({ queryKey: ["member-detail", member.id] });
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4" /> Change email</h4>
        <div className="mt-3 flex gap-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <Button onClick={() => emailMut.mutate()} disabled={emailMut.isPending || !email.trim()}>
            {emailMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4" /> Reset password</h4>
        <div className="mt-3 flex gap-2">
          <Input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 6 chars)" type="text" />
          <Button onClick={() => pwMut.mutate()} disabled={pwMut.isPending || pw.length < 6}>
            {pwMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Reset
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><ImageIcon className="h-4 w-4" /> Profile photo</h4>
        <AssetRow label="Profile photo" url={profile?.photo_url} onPick={(f) => uploadAsset("photo_url", f)} accept="image/*" />
      </div>

      <div className="rounded-lg border border-border p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><Upload className="h-4 w-4" /> KYC documents</h4>
        <AssetRow label="Aadhaar" url={profile?.kyc_aadhaar_url} onPick={(f) => uploadAsset("kyc_aadhaar_url", f)} accept="image/*,application/pdf" />
        <AssetRow label="PAN" url={profile?.kyc_pan_url} onPick={(f) => uploadAsset("kyc_pan_url", f)} accept="image/*,application/pdf" />
      </div>
    </div>
  );
}

function AssetRow({ label, url, onPick, accept }: { label: string; url?: string; onPick: (f: File) => void; accept: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary hover:underline">
            View uploaded file
          </a>
        ) : (
          <div className="text-xs text-muted-foreground">Not uploaded</div>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <Button size="sm" variant="outline" onClick={() => ref.current?.click()}>
        <Upload className="mr-1 h-3.5 w-3.5" /> {url ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}

function ActivityTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-sm font-semibold">Recent requests</h4>
        <div className="divide-y divide-border rounded-lg border border-border">
          {data.recentRequests.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">No requests yet.</div>
          )}
          {data.recentRequests.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
              <div>
                <div className="font-medium">{r.service_name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.input_value} · {new Date(r.created_at).toLocaleDateString("en-IN")}
                </div>
              </div>
              <span className="font-medium">{formatINR(Number(r.cost))}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">Wallet transactions</h4>
        <div className="divide-y divide-border rounded-lg border border-border">
          {data.transactions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">No transactions yet.</div>
          )}
          {data.transactions.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
              <div>
                <div className="font-medium capitalize">{t.type}</div>
                <div className="text-xs text-muted-foreground">
                  {t.description} · {new Date(t.created_at).toLocaleDateString("en-IN")}
                </div>
              </div>
              <span
                className={Number(t.amount) >= 0 ? "font-medium text-success" : "font-medium text-destructive"}
              >
                {Number(t.amount) >= 0 ? "+" : ""}
                {formatINR(Number(t.amount))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function PricingTab({ userId }: { userId: string }) {
  const listFn = useServerFn(
    require("@/lib/user-pricing.functions").adminListUserPricing,
  );
  const upsertFn = useServerFn(
    require("@/lib/user-pricing.functions").adminUpsertUserPricing,
  );
  const clearFn = useServerFn(
    require("@/lib/user-pricing.functions").adminClearUserPricing,
  );
  const qc = useQueryClient();
  const { data: rows, isLoading } = useQuery({
    queryKey: ["user-pricing", userId],
    queryFn: () => listFn({ data: { userId } }),
  });
  const [edits, setEdits] = useState<Record<string, { price: string; commission: string }>>({});

  const setVal = (id: string, key: "price" | "commission", v: string) =>
    setEdits((p) => ({ ...p, [id]: { ...(p[id] || { price: "", commission: "" }), [key]: v } }));

  const save = useMutation({
    mutationFn: async (vars: { serviceId: string; price: number; commission: number }) =>
      upsertFn({
        data: {
          userId,
          serviceId: vars.serviceId,
          price: vars.price,
          distributorCommission: vars.commission,
        },
      }),
    onSuccess: () => {
      toast.success("Custom price saved");
      qc.invalidateQueries({ queryKey: ["user-pricing", userId] });
      setEdits({});
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const reset = useMutation({
    mutationFn: (serviceId: string) => clearFn({ data: { userId, serviceId } }),
    onSuccess: () => {
      toast.success("Reset to default");
      qc.invalidateQueries({ queryKey: ["user-pricing", userId] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const grouped = new Map<string, any[]>();
  for (const r of rows || []) {
    const k = r.category || "Other";
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(r);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed">
        <div className="font-semibold text-primary">Confidential pricing</div>
        <div className="text-muted-foreground">
          Set what this member pays per service. Only admins can see these prices — the member sees
          only the final charge on their wallet. Leave blank to use the default service price.
        </div>
      </div>

      {Array.from(grouped.entries()).map(([cat, items]) => (
        <div key={cat} className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {cat}
          </div>
          <div className="space-y-2">
            {items.map((r) => {
              const e = edits[r.service_id];
              const currentPrice =
                e?.price ?? (r.override_price != null ? String(r.override_price) : "");
              const currentComm =
                e?.commission ??
                (r.override_commission != null ? String(r.override_commission) : "");
              const dirty = e !== undefined;
              return (
                <div
                  key={r.service_id}
                  className="rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.name}</div>
                      {r.name_mr && (
                        <div className="truncate text-xs text-muted-foreground">{r.name_mr}</div>
                      )}
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Default {formatINR(r.default_price)} · Commission{" "}
                        {formatINR(r.default_commission)}
                      </div>
                    </div>
                    {r.override_price != null && (
                      <Badge
                        variant="outline"
                        className="border-primary/30 bg-primary/10 text-primary"
                      >
                        Custom
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Custom price (₹)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={currentPrice}
                        onChange={(ev) => setVal(r.service_id, "price", ev.target.value)}
                        placeholder={String(r.default_price)}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Distributor commission (₹)</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={currentComm}
                        onChange={(ev) => setVal(r.service_id, "commission", ev.target.value)}
                        placeholder={String(r.default_commission)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    {r.override_price != null && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => reset.mutate(r.service_id)}
                        disabled={reset.isPending}
                      >
                        Reset to default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={!dirty || save.isPending || currentPrice === ""}
                      onClick={() =>
                        save.mutate({
                          serviceId: r.service_id,
                          price: Number(currentPrice),
                          commission: Number(currentComm || 0),
                        })
                      }
                    >
                      {save.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Save
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

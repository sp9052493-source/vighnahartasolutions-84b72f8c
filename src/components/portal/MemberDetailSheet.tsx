import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, TrendingUp, FileText, Wallet, CalendarDays, CheckCircle2 } from "lucide-react";
import { adminMemberDetail, adminUpdateUser } from "@/lib/admin.functions";
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
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
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { UserPlus, Wallet, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, formatINR } from "@/lib/queries";
import {
  adminListUsers,
  adminCreateUser,
  adminAdjustWallet,
  adminSetUserStatus,
} from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Members — Sevakart Portal" }] }),
  component: Members,
});

function Members() {
  const { data: me } = useMe();
  if (me?.role === "admin") return <AdminMembers />;
  return <DistributorMembers parentId={me?.id} />;
}

const ROLE_BADGE: Record<string, string> = {
  admin: "border-primary/30 bg-primary/10 text-primary",
  distributor: "border-accent/40 bg-accent/15 text-accent-foreground",
  retailer: "border-border bg-muted text-muted-foreground",
};

function AdminMembers() {
  const listFn = useServerFn(adminListUsers);
  const createFn = useServerFn(adminCreateUser);
  const adjustFn = useServerFn(adminAdjustWallet);
  const statusFn = useServerFn(adminSetUserStatus);
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });

  const [createOpen, setCreateOpen] = useState(false);
  const [topup, setTopup] = useState<{ id: string; name: string } | null>(null);
  const [amount, setAmount] = useState("");

  const distributors = (users ?? []).filter((u) => u.role === "distributor");

  const createMut = useMutation({
    mutationFn: (vars: any) => createFn({ data: vars }),
    onSuccess: () => {
      toast.success("Account created");
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not create account"),
  });

  const adjustMut = useMutation({
    mutationFn: (vars: { userId: string; amount: number; description: string }) => adjustFn({ data: vars }),
    onSuccess: () => {
      toast.success("Wallet updated");
      setTopup(null);
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const statusMut = useMutation({
    mutationFn: (vars: { userId: string; status: "active" | "suspended" }) => statusFn({ data: vars }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">Create and manage retailer & distributor accounts.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> New Account
        </Button>
      </div>

      <Card className="overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {(users ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <div className="font-medium">{u.full_name || "—"}</div>
                    {u.business_name && <div className="text-xs text-muted-foreground">{u.business_name}</div>}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className={`capitalize ${ROLE_BADGE[u.role]}`}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 font-medium">{formatINR(u.balance)}</td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={
                        u.status === "active"
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      {u.role !== "admin" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => setTopup({ id: u.id, name: u.full_name || u.email })}
                          >
                            <Wallet className="h-4 w-4" /> Top up
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              statusMut.mutate({
                                userId: u.id,
                                status: u.status === "active" ? "suspended" : "active",
                              })
                            }
                          >
                            {u.status === "active" ? (
                              <Ban className="h-4 w-4 text-destructive" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateAccountDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        distributors={distributors}
        onSubmit={(v) => createMut.mutate(v)}
        pending={createMut.isPending}
      />

      <Dialog open={!!topup} onOpenChange={(o) => !o && setTopup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust wallet — {topup?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="amt">Amount (use a negative value to deduct)</Label>
            <Input
              id="amt"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500 or -100"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                topup &&
                adjustMut.mutate({
                  userId: topup.id,
                  amount: Number(amount),
                  description: Number(amount) >= 0 ? "Wallet top-up" : "Wallet deduction",
                })
              }
              disabled={adjustMut.isPending || !amount || Number.isNaN(Number(amount))}
            >
              {adjustMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateAccountDialog({
  open,
  onOpenChange,
  distributors,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  distributors: { id: string; full_name: string }[];
  onSubmit: (v: any) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    businessName: "",
    role: "retailer",
    parentId: "",
    openingBalance: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create new account</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              email: form.email.trim(),
              password: form.password,
              fullName: form.fullName.trim(),
              phone: form.phone.trim(),
              businessName: form.businessName.trim(),
              role: form.role,
              parentId: form.role === "retailer" ? form.parentId || "" : "",
              openingBalance: form.openingBalance ? Number(form.openingBalance) : 0,
            });
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name *</Label>
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v) => set("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retailer">Retailer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="text"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                minLength={6}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
            </div>
          </div>
          {form.role === "retailer" && (
            <div className="space-y-2">
              <Label>Assign to distributor (for commission)</Label>
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
          <div className="space-y-2">
            <Label>Opening wallet balance</Label>
            <Input
              type="number"
              value={form.openingBalance}
              onChange={(e) => set("openingBalance", e.target.value)}
              placeholder="0"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DistributorMembers({ parentId }: { parentId?: string }) {
  const { data: retailers } = useQuery({
    queryKey: ["my-retailers", parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("parent_id", parentId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Retailers</h1>
        <p className="text-sm text-muted-foreground">
          Retailers assigned to you. You earn commission on their document requests.
        </p>
      </div>
      <Card className="overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Business</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(retailers ?? []).map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 font-medium">{r.full_name}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.business_name || "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.phone || "—"}</td>
                <td className="px-5 py-3 capitalize">{r.status}</td>
              </tr>
            ))}
            {(retailers ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                  No retailers assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
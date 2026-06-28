import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileClock,
  Trash2,
  Search,
  ArrowRight,
  Loader2,
  Landmark,
  Newspaper,
  CreditCard,
  Car,
  IdCard,
  Wheat,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listDrafts, deleteDraft, type DraftRow } from "@/lib/drafts.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/drafts")({
  head: () => ({ meta: [{ title: "Application Drafts — Vighnaharta Solutions" }] }),
  component: DraftsPage,
});

// Map a draft.service_key to the page that knows how to resume it.
const RESUME_ROUTES: Record<string, { path: string; icon: any; tone: string }> = {
  gazette: { path: "/gazette", icon: Newspaper, tone: "from-[oklch(0.68_0.18_55)] to-[oklch(0.55_0.17_40)]" },
  aaple_sarkar: { path: "/aaple-sarkar", icon: Landmark, tone: "from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]" },
  pan: { path: "/aadhaar-to-pan", icon: CreditCard, tone: "from-[oklch(0.5_0.13_300)] to-[oklch(0.42_0.12_295)]" },
  rc: { path: "/rc-print", icon: Car, tone: "from-[oklch(0.6_0.15_155)] to-[oklch(0.5_0.13_160)]" },
  dl: { path: "/dl-print", icon: IdCard, tone: "from-[oklch(0.58_0.18_25)] to-[oklch(0.5_0.16_20)]" },
  ration: { path: "/ration-print", icon: Wheat, tone: "from-[oklch(0.6_0.16_20)] to-[oklch(0.5_0.14_15)]" },
};

function resumeFor(d: DraftRow) {
  // Service keys may be namespaced (e.g. "aaple_sarkar:income"); strip after the colon.
  const root = d.service_key.split(":")[0];
  const meta = RESUME_ROUTES[root] || { path: "/services", icon: FileText, tone: "from-primary to-primary" };
  return { ...meta, path: `${meta.path}?draft=${d.id}` };
}

function DraftsPage() {
  const listFn = useServerFn(listDrafts);
  const deleteFn = useServerFn(deleteDraft);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState<DraftRow | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["my-drafts"],
    queryFn: () => listFn() as Promise<DraftRow[]>,
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (d) =>
        d.service_label.toLowerCase().includes(s) ||
        (d.customer_name || "").toLowerCase().includes(s) ||
        (d.summary || "").toLowerCase().includes(s),
    );
  }, [data, q]);

  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Draft deleted");
      qc.invalidateQueries({ queryKey: ["my-drafts"] });
      setConfirm(null);
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary/70">
            <FileClock className="h-3 w-3" /> Saved Progress
          </div>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight lg:text-3xl">
            Application Drafts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick up any half-filled application exactly where you left off. Drafts are private to your
            account.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by customer or service"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <Card className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading drafts…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          {data.length === 0
            ? "No drafts yet. Inside any service form, tap Save Draft to keep your progress."
            : "No drafts match your search."}
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((d) => {
            const meta = resumeFor(d);
            const Icon = meta.icon;
            return (
              <li key={d.id}>
                <Card className="flex h-full flex-col gap-3 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-primary-foreground shadow-sm ${meta.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-display text-[15px] font-bold">
                          {d.customer_name || "Untitled draft"}
                        </h3>
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300">
                          Draft
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-[12px] font-medium text-primary">{d.service_label}</div>
                      <div className="mt-1 line-clamp-2 text-[11.5px] text-muted-foreground">
                        {d.summary || "Saved progress, ready to resume."}
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        Updated {new Date(d.updated_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirm(d)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                    <Link
                      to={meta.path as any}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:opacity-95"
                    >
                      Resume <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the saved progress for{" "}
              <b>{confirm?.customer_name || confirm?.service_label}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirm) delMut.mutate(confirm.id);
              }}
              disabled={delMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {delMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

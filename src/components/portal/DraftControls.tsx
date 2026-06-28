import { Link } from "@tanstack/react-router";
import { Save, FileClock, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveDraft, listDrafts, type DraftRow } from "@/lib/drafts.functions";

/**
 * Reusable "Save Draft" control. Drop this above any service's submit button.
 *
 * Pass:
 *  - serviceKey: stable key per service ("gazette", "aaple_sarkar:income", "pan", …)
 *  - serviceLabel: human label shown in the Drafts list ("Gazette Certificate")
 *  - draftId: current draft id (if resuming an existing one), else undefined
 *  - buildPayload: returns { customer_name, summary, form_data } at click time
 *  - onSaved: called with the saved DraftRow (use to remember the id for further saves)
 */
export function SaveDraftButton({
  serviceKey,
  serviceLabel,
  draftId,
  buildPayload,
  onSaved,
  className,
  variant = "outline",
  size = "sm",
}: {
  serviceKey: string;
  serviceLabel: string;
  draftId?: string;
  buildPayload: () => {
    customer_name?: string | null;
    summary?: string | null;
    form_data: Record<string, any>;
  };
  onSaved?: (row: DraftRow) => void;
  className?: string;
  variant?: "outline" | "default" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg" | "icon";
}) {
  const fn = useServerFn(saveDraft);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => {
      const p = buildPayload();
      return fn({
        data: {
          id: draftId,
          service_key: serviceKey,
          service_label: serviceLabel,
          customer_name: p.customer_name || null,
          summary: p.summary || null,
          form_data: p.form_data || {},
        },
      });
    },
    onSuccess: (row) => {
      toast.success("Draft saved");
      qc.invalidateQueries({ queryKey: ["my-drafts"] });
      onSaved?.(row);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save draft"),
  });

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => mut.mutate()}
      disabled={mut.isPending}
      className={className}
    >
      {mut.isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-1.5 h-4 w-4" />
      )}
      {draftId ? "Update Draft" : "Save Draft"}
    </Button>
  );
}

/**
 * Compact drafts panel — shows only drafts for the given serviceKey. Use it
 * at the top of a service page so retailers can resume in-progress work.
 */
export function ServiceDraftsList({
  serviceKey,
  resumeHref,
}: {
  serviceKey: string;
  resumeHref: (draftId: string) => string;
}) {
  const fn = useServerFn(listDrafts);
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-drafts"],
    queryFn: () => fn() as Promise<DraftRow[]>,
  });
  const drafts = data.filter((d) => d.service_key === serviceKey);

  if (isLoading || drafts.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
        <FileClock className="h-3.5 w-3.5" />
        Unfinished Drafts
        <Badge variant="outline" className="ml-auto border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-300">
          {drafts.length}
        </Badge>
      </div>
      <ul className="space-y-1.5">
        {drafts.slice(0, 5).map((d) => (
          <li
            key={d.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-[12.5px]"
          >
            <div className="min-w-0">
              <div className="truncate font-semibold">
                {d.customer_name || "Untitled draft"}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {d.summary || "Saved progress"} ·{" "}
                {new Date(d.updated_at).toLocaleString()}
              </div>
            </div>
            <Link
              to={resumeHref(d.id) as any}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[11.5px] font-semibold text-primary-foreground hover:opacity-95"
            >
              Resume →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

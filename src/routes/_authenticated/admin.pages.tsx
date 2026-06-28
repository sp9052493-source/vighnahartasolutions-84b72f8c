import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { listSitePages, adminUpsertSitePage } from "@/lib/site.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  head: () => ({ meta: [{ title: "Page Content — Admin" }] }),
  component: AdminPages,
});

const SLUGS = ["about", "privacy", "terms", "refund", "contact_intro", "hero", "footer_note"] as const;

const LABEL: Record<string, string> = {
  about: "About",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
  refund: "Refund Policy",
  contact_intro: "Contact intro",
  hero: "Home hero",
  footer_note: "Footer note",
};

function AdminPages() {
  const listFn = useServerFn(listSitePages);
  const { data } = useQuery({ queryKey: ["admin-site-pages"], queryFn: () => listFn() });
  const [active, setActive] = useState<string>("about");
  const page = (data || []).find((p: any) => p.slug === active);

  return (
    <Card className="p-2 shadow-card">
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="flex flex-wrap justify-start gap-1 bg-transparent p-2">
          {SLUGS.map((s) => (
            <TabsTrigger key={s} value={s} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> {LABEL[s]}
            </TabsTrigger>
          ))}
        </TabsList>
        {SLUGS.map((s) => (
          <TabsContent key={s} value={s} className="p-3">
            <PageEditor slug={s} initial={s === active ? page : undefined} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}

function PageEditor({ slug, initial }: { slug: string; initial: any }) {
  const upsertFn = useServerFn(adminUpsertSitePage);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: initial?.title || LABEL[slug],
    meta_description: initial?.meta_description || "",
    content_md: initial?.content_md || "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || LABEL[slug],
        meta_description: initial.meta_description || "",
        content_md: initial.content_md || "",
      });
    }
  }, [initial, slug]);

  const mut = useMutation({
    mutationFn: () => upsertFn({ data: { slug, ...form } }),
    onSuccess: () => {
      toast.success(`${LABEL[slug]} updated — live on site`);
      queryClient.invalidateQueries({ queryKey: ["admin-site-pages"] });
      queryClient.invalidateQueries({ queryKey: ["site-page", slug] });
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
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta description (SEO)</Label>
          <Input
            value={form.meta_description}
            onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
            maxLength={400}
          />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content (Markdown)</Label>
          <Textarea
            value={form.content_md}
            onChange={(e) => setForm({ ...form, content_md: e.target.value })}
            rows={20}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Use # for headings, ** for bold, - for lists. Supports tables, links & code blocks.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</Label>
          <div className="prose prose-sm max-w-none rounded-lg border border-border bg-muted/30 p-4 prose-headings:font-display">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content_md || "_Empty_"}</ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="gap-2" disabled={mut.isPending}>
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Publish
        </Button>
      </div>
    </form>
  );
}

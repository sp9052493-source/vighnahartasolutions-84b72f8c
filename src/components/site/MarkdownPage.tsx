import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LegalShell } from "./LegalShell";
import { useSitePage } from "@/lib/site-queries";

export function MarkdownPage({
  slug,
  fallbackTitle,
  fallbackBody,
}: {
  slug: string;
  fallbackTitle: string;
  fallbackBody: ReactNode;
}) {
  const { data, isLoading } = useSitePage(slug);
  const title = data?.title || fallbackTitle;
  const updated = data?.updated_at
    ? new Date(data.updated_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
    : undefined;

  return (
    <LegalShell title={title} subtitle={data?.meta_description ?? undefined} updated={updated}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data?.content_md ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content_md}</ReactMarkdown>
      ) : (
        fallbackBody
      )}
    </LegalShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { MarkdownPage } from "@/components/site/MarkdownPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Vighnaharta Solutions" },
      { name: "description", content: `Terms for using ${COMPANY.brand}.` },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: () => (
    <MarkdownPage
      slug="terms"
      fallbackTitle="Terms & Conditions"
      fallbackBody={<p>Terms content will appear here once published from the admin Control Center.</p>}
    />
  ),
});

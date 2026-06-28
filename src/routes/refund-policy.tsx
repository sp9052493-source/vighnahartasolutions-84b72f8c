import { createFileRoute } from "@tanstack/react-router";
import { MarkdownPage } from "@/components/site/MarkdownPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — Vighnaharta Solutions" },
      { name: "description", content: `Refund policy for ${COMPANY.brand}.` },
      { property: "og:url", content: "/refund-policy" },
    ],
    links: [{ rel: "canonical", href: "/refund-policy" }],
  }),
  component: () => (
    <MarkdownPage
      slug="refund"
      fallbackTitle="Refund & Cancellation Policy"
      fallbackBody={<p>Refund policy will appear here once published from the admin Control Center.</p>}
    />
  ),
});

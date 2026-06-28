import { createFileRoute } from "@tanstack/react-router";
import { MarkdownPage } from "@/components/site/MarkdownPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Vighnaharta Solutions" },
      { name: "description", content: `Privacy policy for ${COMPANY.brand}, operated by ${COMPANY.legalName}.` },
      { property: "og:title", content: "Privacy Policy — Vighnaharta Solutions" },
      { property: "og:url", content: "/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: () => (
    <MarkdownPage
      slug="privacy"
      fallbackTitle="Privacy Policy"
      fallbackBody={<p>Privacy policy content will appear here once published from the admin Control Center.</p>}
    />
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { MarkdownPage } from "@/components/site/MarkdownPage";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Vighnaharta Solutions" },
      { name: "description", content: `${COMPANY.brand}, a unit of ${COMPANY.legalName}.` },
      { property: "og:title", content: "About Us — Vighnaharta Solutions" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: () => (
    <MarkdownPage
      slug="about"
      fallbackTitle="About Us"
      fallbackBody={<p>About content will appear here once published from the admin Control Center.</p>}
    />
  ),
});

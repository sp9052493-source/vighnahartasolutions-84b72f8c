import { createFileRoute } from "@tanstack/react-router";
import { GazetteDesk } from "@/components/admin/GazetteDesk";

export const Route = createFileRoute("/_authenticated/admin/gazette-desk")({
  head: () => ({
    meta: [{ title: "Gazette Desk — Admin Operations" }],
  }),
  component: GazetteDesk,
});

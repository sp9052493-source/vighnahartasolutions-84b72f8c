import { createFileRoute } from "@tanstack/react-router";
import { FssaiDesk } from "@/components/admin/FssaiDesk";

export const Route = createFileRoute("/_authenticated/admin/fssai")({
  head: () => ({ meta: [{ title: "Food License (FSSAI) Desk — Admin Operations" }] }),
  component: FssaiDesk,
});

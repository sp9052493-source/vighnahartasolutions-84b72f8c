import { createFileRoute } from "@tanstack/react-router";
import { ShopActDesk } from "@/components/admin/ShopActDesk";

export const Route = createFileRoute("/_authenticated/admin/shopact")({
  head: () => ({ meta: [{ title: "Shop Act Desk — Admin Operations" }] }),
  component: ShopActDesk,
});

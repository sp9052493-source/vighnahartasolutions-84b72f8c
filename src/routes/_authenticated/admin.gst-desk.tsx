import { createFileRoute } from "@tanstack/react-router";
import { GstDesk } from "@/components/admin/GstDesk";

export const Route = createFileRoute("/_authenticated/admin/gst-desk")({
  head: () => ({ meta: [{ title: "GST Desk — Admin Operations" }] }),
  component: GstDesk,
});

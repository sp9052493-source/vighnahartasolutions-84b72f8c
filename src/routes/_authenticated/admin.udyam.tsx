import { createFileRoute } from "@tanstack/react-router";
import { UdyamDesk } from "@/components/admin/UdyamDesk";

export const Route = createFileRoute("/_authenticated/admin/udyam")({
  head: () => ({ meta: [{ title: "Udyam Aadhaar Desk — Admin Operations" }] }),
  component: UdyamDesk,
});

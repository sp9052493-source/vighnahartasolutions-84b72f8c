import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({ requestId: z.string().uuid("Invalid document reference") });

/**
 * Returns a short-lived signed download URL for a saved document, but only if
 * the document belongs to the calling user. Ownership is enforced by reading the
 * request through the user-scoped (RLS) client before signing with the
 * service-role storage client.
 */
export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: req, error } = await supabase
      .from("document_requests")
      .select("id, user_id, document_url, service_name")
      .eq("id", data.requestId)
      .maybeSingle();

    if (error || !req) {
      throw new Error("Document not found.");
    }
    if (req.user_id !== userId) {
      throw new Error("You do not have access to this document.");
    }
    if (!req.document_url) {
      throw new Error("No saved file is available for this request.");
    }

    const { signDocumentUrl } = await import("@/lib/documents.server");
    const url = await signDocumentUrl(req.document_url);
    return { url };
  });

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "documents";

/**
 * Uploads a generated document PDF (base64) to the private `documents` bucket
 * and returns the stored object path. Access is always brokered server-side via
 * the service-role client; the bucket is private and never publicly readable.
 *
 * Path layout: `<userId>/<fileName>` with a timestamp suffix to avoid clobbering
 * earlier copies of the same document.
 */
export async function uploadDocumentPdf(
  userId: string,
  fileName: string,
  pdfBase64: string,
): Promise<string> {
  const bytes = Buffer.from(pdfBase64, "base64");
  const safeName = fileName.replace(/[^A-Za-z0-9._-]/g, "_");
  const stamp = Date.now().toString(36);
  const path = `${userId}/${stamp}_${safeName}`;

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) {
    console.error("[DOCUMENTS] upload failed:", error.message);
    throw new Error("Could not save the generated document.");
  }
  console.log("[DOCUMENTS] stored", `path=${path} bytes=${bytes.length}`);
  return path;
}

/**
 * Creates a short-lived signed download URL for a stored document path.
 */
export async function signDocumentUrl(path: string, expiresInSeconds = 120): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds, { download: true });
  if (error || !data?.signedUrl) {
    console.error("[DOCUMENTS] sign failed:", error?.message);
    throw new Error("Could not prepare the document for download.");
  }
  return data.signedUrl;
}

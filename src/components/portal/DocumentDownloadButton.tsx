import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getDocumentDownloadUrl } from "@/lib/documents.functions";

/**
 * Downloads a previously generated document PDF from secure storage. Only shown
 * for completed requests that actually have a saved file.
 */
export function DocumentDownloadButton({
  requestId,
  hasFile,
  size = "sm",
  variant = "outline",
}: {
  requestId: string;
  hasFile: boolean;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "default";
}) {
  const [loading, setLoading] = useState(false);
  const fetchUrl = useServerFn(getDocumentDownloadUrl);

  async function handleDownload() {
    if (!hasFile) {
      toast.message("No saved file available for this request.");
      return;
    }
    setLoading(true);
    try {
      const { url } = await fetchUrl({ data: { requestId } });
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      toast.error(e?.message || "Could not download the document.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleDownload}
      disabled={loading || !hasFile}
      className="gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Download
    </Button>
  );
}

import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/error-handler";
import type { ExportFormat } from "@/lib/constants";

export async function exportDocument(documentId: string, format: ExportFormat) {
  const { data, error } = await supabase.functions.invoke<{ signedUrl: string }>(
    "export-document",
    { body: { documentId, format } },
  );
  if (error || !data) throw toAppError({ code: "EXPORT_FAILED", message: "Export failed." });
  return data.signedUrl;
}

import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/error-handler";
import type { GenerateDocumentRequest, GenerateDocumentResponse } from "@/types/api";

/**
 * Calls the generate-document Edge Function. The Gemini API key never
 * touches this file or the browser — only the authenticated Supabase JWT
 * is sent, and the Edge Function does all privileged work.
 */
export async function generateDocument(
  req: GenerateDocumentRequest,
): Promise<GenerateDocumentResponse> {
  const { data, error } = await supabase.functions.invoke<GenerateDocumentResponse>(
    "generate-document",
    { body: req },
  );

  if (error) {
    // supabase-js surfaces non-2xx responses here; the function body still
    // contains our structured error, but functions.invoke doesn't parse it
    // on error paths uniformly across versions, so we fall back safely.
    throw toAppError({ code: "GENERATION_FAILED", message: "Generation failed." });
  }
  if (!data) throw toAppError({ code: "GENERATION_FAILED", message: "Generation failed." });
  return data;
}

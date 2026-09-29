import { z } from "zod";
import { documentTypeSchema } from "./document";

// Backend-side contract for the generate-document Edge Function.
// Mirrors src/types/api.ts::GenerateDocumentRequest but is the source of truth
// for runtime validation (frontend AND edge function both import this shape).
export const generateDocumentRequestSchema = z.object({
  documentType: documentTypeSchema,
  documentId: z.string().uuid().optional(),
  input: z.record(z.string(), z.unknown()).refine((obj) => {
    // Hard cap on payload shape to prevent abuse — actual per-field validation
    // happens against the type-specific schema in documentInputSchemaByType.
    return Object.keys(obj).length <= 40;
  }, "Too many fields in submission."),
});

export const geminiSectionSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(20000),
});

export const geminiTermSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(500),
});

export const geminiResponseSchema = z.object({
  title: z.string().min(1).max(200),
  document_type: z.string().min(1).max(80),
  sections: z.array(geminiSectionSchema).min(1).max(30),
  terms: z.array(geminiTermSchema).max(50),
  warnings: z.array(z.string().max(500)).max(20),
});
export type GeminiResponse = z.infer<typeof geminiResponseSchema>;

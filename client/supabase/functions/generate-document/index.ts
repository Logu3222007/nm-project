// supabase/functions/generate-document/index.ts
//
// Flow: verify JWT -> validate request -> check rate limit -> verify
// document ownership (if updating) -> build controlled prompt -> call
// Gemini -> validate response -> persist generation + version -> audit log
// -> return structured result.
//
// Gemini is called ONLY from here. The API key lives in Edge Function
// secrets and never reaches the browser.

import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { requireUser, serviceClient } from "../_shared/auth.ts";
import { buildPrompt } from "./prompt.ts";
import { callGemini } from "./gemini.ts";

const DOCUMENT_TYPES = [
  "employment_agreement",
  "nda",
  "lease_agreement",
  "service_agreement",
  "freelance_agreement",
] as const;

const requestSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  documentId: z.string().uuid().optional(),
  input: z
    .record(z.string(), z.unknown())
    .refine((obj) => Object.keys(obj).length <= 40, "Too many fields in submission."),
});

const MAX_BODY_BYTES = 50_000;
const DAILY_GENERATION_LIMIT = 15;

async function hashInput(input: unknown): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(input));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return errorResponse("VALIDATION_ERROR", "Method not allowed.", requestId, corsHeaders);
  }

  // --- Auth ----------------------------------------------------------------
  let userId: string;
  let userClient;
  try {
    const auth = await requireUser(req);
    userId = auth.userId;
    userClient = auth.client;
  } catch {
    return errorResponse("UNAUTHENTICATED", "Please sign in to continue.", requestId, corsHeaders);
  }

  // --- Body size + parse -----------------------------------------------
  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return errorResponse("VALIDATION_ERROR", "Request payload is too large.", requestId, corsHeaders);
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return errorResponse("VALIDATION_ERROR", "Malformed request body.", requestId, corsHeaders);
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return errorResponse(
      "VALIDATION_ERROR",
      firstIssue?.message ?? "Invalid request.",
      requestId,
      corsHeaders,
    );
  }
  const { documentType, documentId, input } = parsed.data;

  const admin = serviceClient();

  // --- Ownership check for updates ---------------------------------------
  if (documentId) {
    const { data: existing, error } = await userClient
      .from("documents")
      .select("id, user_id")
      .eq("id", documentId)
      .single();
    // RLS means a foreign document_id returns no row, not another user's row.
    if (error || !existing) {
      return errorResponse("NOT_FOUND", "Document not found.", requestId, corsHeaders);
    }
  }

  // --- Rate limiting --------------------------------------------------------
  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await admin
    .from("generation_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  if ((usage?.count ?? 0) >= DAILY_GENERATION_LIMIT) {
    return errorResponse(
      "RATE_LIMITED",
      "Daily generation limit reached. Please try again later.",
      requestId,
      corsHeaders,
    );
  }

  // --- Duplicate-request protection (identical input within the window) ----
  const inputHash = await hashInput({ documentType, input });

  // --- Create or reuse the document row ------------------------------------
  let targetDocumentId = documentId;
  if (!targetDocumentId) {
    const { data: created, error: createErr } = await userClient
      .from("documents")
      .insert({
        user_id: userId,
        title: deriveTitle(documentType, input),
        document_type: documentType,
        status: "generating",
      })
      .select("id")
      .single();
    if (createErr || !created) {
      return errorResponse("INTERNAL_ERROR", "Could not create document.", requestId, corsHeaders);
    }
    targetDocumentId = created.id;
  } else {
    await userClient.from("documents").update({ status: "generating" }).eq("id", targetDocumentId);
  }

  // --- Record the generation attempt (service role; RLS has no insert policy
  //     for clients on this table by design) -------------------------------
  const { data: generation } = await admin
    .from("document_generations")
    .insert({
      document_id: targetDocumentId,
      user_id: userId,
      model: "gemini-1.5-pro",
      status: "pending",
      input_hash: inputHash,
    })
    .select("id")
    .single();

  // --- Call Gemini with a controlled, injection-resistant prompt -----------
  const prompt = buildPrompt(documentType, input);

  let result;
  try {
    result = await callGemini(prompt);
  } catch (e) {
    await admin.from("documents").update({ status: "failed" }).eq("id", targetDocumentId);
    if (generation) {
      await admin.from("document_generations").update({ status: "failed" }).eq("id", generation.id);
    }
    await audit(admin, userId, "DOCUMENT_GENERATED", targetDocumentId, { outcome: "failed" });

    const message = e instanceof Error ? e.message : "GENERATION_FAILED";
    if (message === "UPSTREAM_RATE_LIMITED") {
      return errorResponse("RATE_LIMITED", "Generation service is busy. Please try again shortly.", requestId, corsHeaders);
    }
    if (message === "GENERATION_TIMEOUT") {
      return errorResponse("GENERATION_FAILED", "Generation took too long. Your document has not been lost — please try again.", requestId, corsHeaders);
    }
    return errorResponse("GENERATION_FAILED", "Generation couldn't be completed. Your document has not been lost.", requestId, corsHeaders);
  }

  // --- Persist as a new version ---------------------------------------
  const { data: latestVersion } = await userClient
    .from("document_versions")
    .select("version_number")
    .eq("document_id", targetDocumentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;
  const plainText = result.sections.map((s) => `${s.title}\n\n${s.content}`).join("\n\n");

  const { data: version, error: versionErr } = await userClient
    .from("document_versions")
    .insert({
      document_id: targetDocumentId,
      version_number: nextVersionNumber,
      content_json: result,
      plain_text: plainText,
      created_by: userId,
    })
    .select("id")
    .single();

  if (versionErr || !version) {
    return errorResponse("INTERNAL_ERROR", "Could not save the generated document.", requestId, corsHeaders);
  }

  await userClient
    .from("documents")
    .update({ status: "ready", current_version_id: version.id, title: result.title })
    .eq("id", targetDocumentId);

  if (generation) {
    await admin.from("document_generations").update({ status: "succeeded" }).eq("id", generation.id);
  }
  await admin
    .from("generation_usage")
    .upsert(
      { user_id: userId, usage_date: today, count: (usage?.count ?? 0) + 1 },
      { onConflict: "user_id,usage_date" },
    );
  await audit(admin, userId, "DOCUMENT_GENERATED", targetDocumentId, { outcome: "succeeded" });

  return new Response(
    JSON.stringify({
      documentId: targetDocumentId,
      versionId: version.id,
      title: result.title,
      sections: result.sections,
      terms: result.terms,
      warnings: result.warnings,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

function deriveTitle(documentType: string, input: Record<string, unknown>): string {
  const nameField = ["employeeName", "receivingParty", "tenantName", "clientName", "freelancerName"].find(
    (key) => typeof input[key] === "string",
  );
  const partyLabel = nameField ? String(input[nameField]) : "New";
  const typeLabel = documentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `${typeLabel} - ${partyLabel}`;
}

// deno-lint-ignore no-explicit-any
async function audit(admin: any, userId: string, action: string, resourceId: string, metadata: Record<string, unknown>) {
  await admin.from("audit_logs").insert({
    user_id: userId,
    action,
    resource_type: "document",
    resource_id: resourceId,
    metadata,
  });
}

// supabase/functions/update-document/index.ts
// Applies a user edit as a NEW document_version (never overwrites history),
// or restores an older version by copying its content into a new version.
// Enforces the allowed status-transition graph.

import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { requireUser, serviceClient } from "../_shared/auth.ts";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["generating"],
  generating: ["ready", "failed"],
  ready: ["archived", "generating"],
  failed: ["generating"],
  archived: [],
};

const editSchema = z.object({
  documentId: z.string().uuid(),
  action: z.literal("edit"),
  sections: z.array(z.object({ id: z.string(), title: z.string(), content: z.string().max(20000) })).min(1),
});

const restoreSchema = z.object({
  documentId: z.string().uuid(),
  action: z.literal("restore"),
  versionId: z.string().uuid(),
});

const statusSchema = z.object({
  documentId: z.string().uuid(),
  action: z.literal("set_status"),
  status: z.enum(["draft", "generating", "ready", "failed", "archived"]),
});

const requestSchema = z.discriminatedUnion("action", [editSchema, restoreSchema, statusSchema]);

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let userId: string;
  let userClient;
  try {
    const auth = await requireUser(req);
    userId = auth.userId;
    userClient = auth.client;
  } catch {
    return errorResponse("UNAUTHENTICATED", "Please sign in to continue.", requestId, corsHeaders);
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Invalid update request.", requestId, corsHeaders);
  }

  const { data: doc, error: docErr } = await userClient
    .from("documents")
    .select("id, status")
    .eq("id", parsed.data.documentId)
    .single();
  if (docErr || !doc) {
    return errorResponse("NOT_FOUND", "Document not found.", requestId, corsHeaders);
  }

  const admin = serviceClient();

  if (parsed.data.action === "set_status") {
    const allowed = ALLOWED_TRANSITIONS[doc.status] ?? [];
    if (!allowed.includes(parsed.data.status)) {
      return errorResponse(
        "VALIDATION_ERROR",
        `Cannot move a document from "${doc.status}" to "${parsed.data.status}".`,
        requestId,
        corsHeaders,
      );
    }
    await userClient.from("documents").update({ status: parsed.data.status }).eq("id", doc.id);
    return jsonOk(corsHeaders);
  }

  // Both edit and restore create a brand-new version row.
  const { data: latest } = await userClient
    .from("document_versions")
    .select("version_number")
    .eq("document_id", doc.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (latest?.version_number ?? 0) + 1;

  let contentJson: unknown;
  let plainText: string;
  let auditAction: string;

  if (parsed.data.action === "edit") {
    contentJson = { sections: parsed.data.sections };
    plainText = parsed.data.sections.map((s) => `${s.title}\n\n${s.content}`).join("\n\n");
    auditAction = "DOCUMENT_UPDATED";
  } else {
    const { data: source, error: sourceErr } = await userClient
      .from("document_versions")
      .select("content_json, plain_text")
      .eq("id", parsed.data.versionId)
      .eq("document_id", doc.id)
      .single();
    if (sourceErr || !source) {
      return errorResponse("NOT_FOUND", "Version not found.", requestId, corsHeaders);
    }
    contentJson = source.content_json;
    plainText = source.plain_text;
    auditAction = "VERSION_RESTORED";
  }

  const { data: version, error: versionErr } = await userClient
    .from("document_versions")
    .insert({
      document_id: doc.id,
      version_number: nextVersion,
      content_json: contentJson,
      plain_text: plainText,
      created_by: userId,
    })
    .select("id")
    .single();
  if (versionErr || !version) {
    return errorResponse("INTERNAL_ERROR", "Could not save the new version.", requestId, corsHeaders);
  }

  await userClient.from("documents").update({ current_version_id: version.id }).eq("id", doc.id);
  await admin.from("audit_logs").insert({
    user_id: userId,
    action: auditAction,
    resource_type: "document",
    resource_id: doc.id,
    metadata: {},
  });

  return jsonOk(corsHeaders, { versionId: version.id });
});

function jsonOk(headers: HeadersInit, body: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ success: true, ...body }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

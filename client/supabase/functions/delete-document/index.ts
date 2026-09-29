// supabase/functions/delete-document/index.ts
// Deletes a document the caller owns. Versions/generations/exports cascade
// via FK constraints. Ownership is enforced by RLS on the scoped client —
// there is no separate "is this mine" check to get wrong.

import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/errors.ts";
import { requireUser, serviceClient } from "../_shared/auth.ts";

const requestSchema = z.object({ documentId: z.string().uuid() });

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
    return errorResponse("VALIDATION_ERROR", "A valid documentId is required.", requestId, corsHeaders);
  }

  const { error } = await userClient.from("documents").delete().eq("id", parsed.data.documentId);
  if (error) {
    return errorResponse("INTERNAL_ERROR", "Could not delete the document.", requestId, corsHeaders);
  }

  const admin = serviceClient();
  await admin.from("audit_logs").insert({
    user_id: userId,
    action: "DOCUMENT_DELETED",
    resource_type: "document",
    resource_id: parsed.data.documentId,
    metadata: {},
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

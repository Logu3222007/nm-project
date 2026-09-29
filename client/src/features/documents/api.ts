import { supabase } from "@/lib/supabase";
import { toAppError } from "@/lib/error-handler";
import type { Database } from "@/types/database";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export interface DocumentListParams {
  search?: string;
  documentType?: string;
  status?: string;
  sort?: "newest" | "oldest" | "updated";
  page?: number;
  pageSize?: number;
}

export async function listDocuments(params: DocumentListParams = {}) {
  const { search, documentType, status, sort = "updated", page = 0, pageSize = 20 } = params;

  let query = supabase.from("documents").select("*", { count: "exact" });

  if (search) query = query.ilike("title", `%${search}%`);
  if (documentType) query = query.eq("document_type", documentType);
  if (status) query = query.eq("status", status);

  if (sort === "newest") query = query.order("created_at", { ascending: false });
  else if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else query = query.order("updated_at", { ascending: false });

  query = query.range(page * pageSize, page * pageSize + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw toAppError({ code: "UNKNOWN", message: error.message });
  return { documents: (data ?? []) as DocumentRow[], total: count ?? 0 };
}

export async function getDocument(id: string) {
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
  // RLS ensures this returns nothing (PGRST116) for another user's document,
  // which we surface as NOT_FOUND rather than leaking existence.
  if (error) throw toAppError({ code: "NOT_FOUND", message: "Document not found." });
  return data as DocumentRow;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw toAppError({ code: "UNKNOWN", message: error.message });
}

export async function getDocumentVersions(documentId: string) {
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("document_id", documentId)
    .order("version_number", { ascending: false });
  if (error) throw toAppError({ code: "UNKNOWN", message: error.message });
  return data ?? [];
}

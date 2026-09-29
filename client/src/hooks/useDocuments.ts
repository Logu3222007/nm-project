import { useQuery } from "@tanstack/react-query";
import { listDocuments, type DocumentListParams } from "@/features/documents/api";

export function useDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => listDocuments(params),
  });
}

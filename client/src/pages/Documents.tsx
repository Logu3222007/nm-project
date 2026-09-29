import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useDocuments } from "@/hooks/useDocuments";
import { useDebounce } from "@/hooks/useDebounce";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUSES } from "@/lib/constants";
import type { DocumentType, DocumentStatus } from "@/lib/constants";

export default function Documents() {
  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "oldest" | "updated">("updated");
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, refetch } = useDocuments({
    search: debouncedSearch || undefined,
    documentType: documentType || undefined,
    status: status || undefined,
    sort,
  });

  const hasFilters = !!(debouncedSearch || documentType || status);

  return (
    <div>
      <PageHeader
        title="My Documents"
        action={
          <Button asChild>
            <Link to="/documents/new">
              <Plus className="h-4 w-4" /> Create document
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search documents"
          />
        </div>
        <select
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          aria-label="Filter by document type"
        >
          <option value="">All types</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_TYPE_LABELS[t as DocumentType]}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          aria-label="Sort documents"
        >
          <option value="updated">Recently updated</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && data && data.documents.length === 0 && (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title={hasFilters ? "No matching documents" : "No documents yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Create your first legal document to get started."
          }
          action={
            !hasFilters && (
              <Button asChild>
                <Link to="/documents/new">Create document</Link>
              </Button>
            )
          }
        />
      )}

      {!isLoading && !isError && data && data.documents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={{
                id: doc.id,
                title: doc.title,
                documentType: doc.document_type as DocumentType,
                status: doc.status as DocumentStatus,
                updatedAt: doc.updated_at,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

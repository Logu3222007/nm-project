import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState, Skeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { listDocuments } from "@/features/documents/api";
import { useAuth } from "@/features/auth/auth-context";
import type { DocumentType, DocumentStatus } from "@/lib/constants";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["documents", { sort: "updated" as const, pageSize: 6 }],
    queryFn: () => listDocuments({ sort: "updated", pageSize: 6 }),
  });

  const displayName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  const stats = data
    ? {
        total: data.total,
        drafts: data.documents.filter((d) => d.status === "draft").length,
        ready: data.documents.filter((d) => d.status === "ready").length,
      }
    : null;

  return (
    <div>
      <PageHeader
        title={displayName ? `Welcome back, ${displayName}` : "Welcome back"}
        description="Here's what's happening with your documents."
        action={
          <Button asChild>
            <Link to="/documents/new">
              <Plus className="h-4 w-4" /> Create document
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total documents" value={stats.total} />
          <StatCard label="Drafts" value={stats.drafts} />
          <StatCard label="Ready" value={stats.ready} />
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-foreground">Recent documents</h2>
      {isLoading ? (
        <LoadingState />
      ) : data && data.documents.length > 0 ? (
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
      ) : (
        !isError && (
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="No documents yet"
            description="Create your first legal document to get started."
            action={
              <Button asChild>
                <Link to="/documents/new">Create document</Link>
              </Button>
            }
          />
        )
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

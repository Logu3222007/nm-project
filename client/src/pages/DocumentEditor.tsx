import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, RefreshCw, Save } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TermsTable } from "@/components/documents/TermsTable";
import { VersionHistory } from "@/components/documents/VersionHistory";
import { ExportMenu } from "@/components/documents/ExportMenu";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { getDocument, getDocumentVersions, deleteDocument } from "@/features/documents/api";
import { exportDocument } from "@/features/exports/api";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { LEGAL_DISCLAIMER, type DocumentStatus, type ExportFormat } from "@/lib/constants";
import type { GeneratedDocument } from "@/types/document";

export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);

  const docQuery = useQuery({
    queryKey: ["document", id],
    queryFn: () => getDocument(id!),
    enabled: !!id,
  });

  const versionsQuery = useQuery({
    queryKey: ["document-versions", id],
    queryFn: () => getDocumentVersions(id!),
    enabled: !!id,
  });

  if (docQuery.isLoading) return <LoadingState fullPage />;
  if (docQuery.isError || !docQuery.data) {
    return <ErrorState title="Document not found" description="It may have been deleted or you may not have access." />;
  }

  const doc = docQuery.data;
  const currentVersion = versionsQuery.data?.find((v) => v.id === doc.current_version_id);
  const content = currentVersion?.content_json as GeneratedDocument | undefined;

  async function handleDelete() {
    await deleteDocument(id!);
    toast("Document deleted.", "success");
    navigate("/documents");
  }

  async function handleExport(format: ExportFormat) {
    setExporting(true);
    try {
      const url = await exportDocument(id!, format);
      window.open(url, "_blank", "noopener,noreferrer");
      toast("Export completed.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Export failed.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleRestore(versionId: string) {
    // Restoring creates a NEW version copied from the selected one, rather
    // than mutating history, so version history stays append-only.
    const { error } = await supabase.functions.invoke("update-document", {
      body: { documentId: id, action: "restore", versionId },
    });
    if (error) {
      toast("Couldn't restore that version. Please try again.", "error");
      return;
    }
    toast("Version restored.", "success");
    await queryClient.invalidateQueries({ queryKey: ["document-versions", id] });
    await queryClient.invalidateQueries({ queryKey: ["document", id] });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <PageHeader
          title={doc.title}
          action={
            <div className="flex items-center gap-2">
              <StatusBadge status={doc.status as DocumentStatus} />
              <ExportMenu onExport={handleExport} exporting={exporting} />
            </div>
          }
        />

        <p className="mb-4 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
          {LEGAL_DISCLAIMER}
        </p>

        {!content ? (
          <LoadingState label="Loading document content..." />
        ) : (
          <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
            {content.sections.map((section) => (
              <section key={section.id}>
                <h2 className="mb-2 text-sm font-semibold text-foreground">{section.title}</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4" /> Regenerate
          </Button>
          <Button>
            <Save className="h-4 w-4" /> Save
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="danger">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            }
            title="Delete document?"
            description="This will remove the document and its generated versions. This cannot be undone."
            confirmLabel="Delete document"
            danger
            onConfirm={handleDelete}
          />
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Key terms</h3>
          {content ? <TermsTable terms={content.terms} /> : <LoadingState label="Loading terms..." />}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Version history</h3>
          <VersionHistory
            versions={(versionsQuery.data ?? []).map((v) => ({
              id: v.id,
              versionNumber: v.version_number,
              createdAt: v.created_at,
              createdByLabel: v.created_by === doc.user_id ? "You" : "AI generated",
              isCurrent: v.id === doc.current_version_id,
            }))}
            onRestore={handleRestore}
          />
        </div>
      </aside>
    </div>
  );
}

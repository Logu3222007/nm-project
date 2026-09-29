import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate } from "@/lib/utils";
import { DOCUMENT_TYPE_LABELS, type DocumentType, type DocumentStatus } from "@/lib/constants";

export interface DocumentCardData {
  id: string;
  title: string;
  documentType: DocumentType;
  status: DocumentStatus;
  updatedAt: string;
}

export function DocumentCard({ doc }: { doc: DocumentCardData }) {
  return (
    <Link
      to={`/documents/${doc.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileText className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">
              {doc.title}
            </h3>
            <p className="text-xs text-muted-foreground">{DOCUMENT_TYPE_LABELS[doc.documentType]}</p>
          </div>
        </div>
        <StatusBadge status={doc.status} />
      </div>
      <p className="text-xs text-muted-foreground">Updated {formatDate(doc.updatedAt)}</p>
    </Link>
  );
}

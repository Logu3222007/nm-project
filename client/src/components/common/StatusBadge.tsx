import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/lib/constants";

const STYLES: Record<DocumentStatus, string> = {
  draft: "bg-border/60 text-foreground",
  generating: "bg-info/10 text-info",
  ready: "bg-success/10 text-success",
  failed: "bg-danger/10 text-danger",
  archived: "bg-border/40 text-muted",
};

const LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  ready: "Ready",
  failed: "Failed",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}

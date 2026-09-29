import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export interface VersionSummary {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdByLabel: string;
  isCurrent: boolean;
}

export function VersionHistory({
  versions,
  onRestore,
}: {
  versions: VersionSummary[];
  onRestore: (versionId: string) => void;
}) {
  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">No versions yet.</p>;
  }
  return (
    <ol className="flex flex-col gap-2">
      {versions.map((v) => (
        <li
          key={v.id}
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Version {v.versionNumber} {v.isCurrent && <span className="text-primary">(current)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {v.createdByLabel} &middot; {formatDateTime(v.createdAt)}
              </p>
            </div>
          </div>
          {!v.isCurrent && (
            <Button variant="outline" size="sm" onClick={() => onRestore(v.id)}>
              Restore
            </Button>
          )}
        </li>
      ))}
    </ol>
  );
}

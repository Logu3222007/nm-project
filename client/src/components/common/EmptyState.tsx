import { PropsWithChildren, ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: PropsWithChildren<{ icon?: ReactNode; title: string; description: string; action?: ReactNode }>) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
      {icon && <div className="mb-4 text-muted">{icon}</div>}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

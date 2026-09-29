import { Link } from "react-router-dom";
import { Briefcase, Shield, Home, Handshake, UserCheck, Clock } from "lucide-react";
import type { TemplateDefinition } from "@/features/templates/definitions";

const ICONS = { briefcase: Briefcase, shield: Shield, home: Home, handshake: Handshake, "user-check": UserCheck };

export function TemplateCard({ template }: { template: TemplateDefinition }) {
  const Icon = ICONS[template.icon];
  return (
    <Link
      to={`/documents/new?type=${template.documentType}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        ~{template.estimatedMinutes} min
      </div>
    </Link>
  );
}

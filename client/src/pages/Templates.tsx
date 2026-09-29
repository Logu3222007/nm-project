import { PageHeader } from "@/components/common/PageHeader";
import { TemplateCard } from "@/components/documents/TemplateCard";
import { TEMPLATES } from "@/features/templates/definitions";

export default function Templates() {
  return (
    <div>
      <PageHeader
        title="Templates"
        description="Choose a template to start drafting. Every document goes through the same review flow before export."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.slug} template={t} />
        ))}
      </div>
    </div>
  );
}

import type { DocumentTerm } from "@/types/document";

export function TermsTable({ terms }: { terms: DocumentTerm[] }) {
  if (terms.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody>
          {terms.map((term, i) => (
            <tr key={term.label} className={i % 2 === 0 ? "bg-surface" : "bg-background"}>
              <th
                scope="row"
                className="w-1/3 border-r border-border px-4 py-2.5 text-left font-medium text-muted-foreground"
              >
                {term.label}
              </th>
              <td className="px-4 py-2.5 text-foreground">{term.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

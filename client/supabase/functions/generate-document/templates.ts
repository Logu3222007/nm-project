// Mirrors src/features/templates/definitions.ts section ids, kept minimal
// here since the Edge Function only needs ids/order for prompt construction.
export const TEMPLATE_SECTION_IDS: Record<string, string[]> = {
  employment_agreement: [
    "parties", "employment", "duties", "compensation", "working-hours",
    "confidentiality", "ip", "termination", "governing-law", "signatures",
  ],
  nda: [
    "parties", "purpose", "confidential-information", "obligations",
    "exceptions", "term", "termination", "governing-law", "signatures",
  ],
  lease_agreement: [
    "parties", "property", "term", "rent", "utilities", "maintenance",
    "termination", "governing-law", "signatures",
  ],
  service_agreement: [
    "parties", "scope", "fees", "term", "termination", "liability",
    "governing-law", "signatures",
  ],
  freelance_agreement: [
    "parties", "project", "deliverables", "timeline", "compensation",
    "ip", "termination", "governing-law", "signatures",
  ],
};

export const DOCUMENT_TYPES = [
  "employment_agreement",
  "nda",
  "lease_agreement",
  "service_agreement",
  "freelance_agreement",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  employment_agreement: "Employment Agreement",
  nda: "Non-Disclosure Agreement",
  lease_agreement: "Lease Agreement",
  service_agreement: "Service Agreement",
  freelance_agreement: "Freelance Agreement",
};

export const DOCUMENT_STATUSES = ["draft", "generating", "ready", "failed", "archived"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const ALLOWED_STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ["generating"],
  generating: ["ready", "failed"],
  ready: ["archived", "generating"],
  failed: ["generating"],
  archived: [],
};

export const EXPORT_FORMATS = ["pdf", "docx", "txt"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export const DAILY_GENERATION_LIMIT = 15;

export const LEGAL_DISCLAIMER =
  "LegalEase provides AI-assisted document drafting and does not replace advice from a qualified legal professional. Review this document carefully, and consult a lawyer before signing.";

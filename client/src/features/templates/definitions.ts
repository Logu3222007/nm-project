// Central registry of document templates. Adding a new document type means
// adding one entry here (+ a Zod schema in schemas/document.ts) — nothing
// else in the app needs to hardcode document-type logic.

export interface TemplateSectionDef {
  id: string;
  title: string;
}

export interface TemplateFieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "currency";
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface TemplateDefinition {
  slug: string;
  documentType: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  icon: "briefcase" | "shield" | "home" | "handshake" | "user-check";
  sections: TemplateSectionDef[];
  fields: TemplateFieldDef[];
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    slug: "employment-agreement",
    documentType: "employment_agreement",
    name: "Employment Agreement",
    description: "A standard employer–employee contract covering role, pay, and terms.",
    estimatedMinutes: 5,
    icon: "briefcase",
    sections: [
      { id: "parties", title: "Parties" },
      { id: "employment", title: "Employment" },
      { id: "duties", title: "Duties" },
      { id: "compensation", title: "Compensation" },
      { id: "working-hours", title: "Working Hours" },
      { id: "confidentiality", title: "Confidentiality" },
      { id: "ip", title: "Intellectual Property" },
      { id: "termination", title: "Termination" },
      { id: "governing-law", title: "Governing Law" },
      { id: "signatures", title: "Signatures" },
    ],
    fields: [
      { name: "employerName", label: "Employer name", type: "text", required: true },
      { name: "employeeName", label: "Employee name", type: "text", required: true },
      { name: "jobTitle", label: "Job title", type: "text", required: true },
      { name: "startDate", label: "Start date", type: "date", required: true },
      {
        name: "employmentType",
        label: "Employment type",
        type: "select",
        required: true,
        options: [
          { label: "Full-time", value: "full_time" },
          { label: "Part-time", value: "part_time" },
          { label: "Contract", value: "contract" },
          { label: "Internship", value: "internship" },
        ],
      },
      { name: "salary", label: "Salary", type: "currency", required: true },
      {
        name: "paymentFrequency",
        label: "Payment frequency",
        type: "select",
        required: true,
        options: [
          { label: "Monthly", value: "monthly" },
          { label: "Bi-weekly", value: "biweekly" },
          { label: "Weekly", value: "weekly" },
          { label: "Annually", value: "annually" },
        ],
      },
      { name: "workingLocation", label: "Working location", type: "text", required: true },
      { name: "workingHours", label: "Working hours", type: "text", required: true },
      { name: "noticePeriodDays", label: "Notice period (days)", type: "number", required: true },
      { name: "probationPeriodDays", label: "Probation period (days)", type: "number" },
      { name: "benefits", label: "Benefits", type: "textarea" },
      { name: "additionalTerms", label: "Additional terms", type: "textarea" },
    ],
  },
  {
    slug: "nda",
    documentType: "nda",
    name: "Non-Disclosure Agreement",
    description: "Protect confidential information shared between two parties.",
    estimatedMinutes: 3,
    icon: "shield",
    sections: [
      { id: "parties", title: "Parties" },
      { id: "purpose", title: "Purpose" },
      { id: "confidential-information", title: "Confidential Information" },
      { id: "obligations", title: "Obligations" },
      { id: "exceptions", title: "Exceptions" },
      { id: "term", title: "Term" },
      { id: "termination", title: "Termination" },
      { id: "governing-law", title: "Governing Law" },
      { id: "signatures", title: "Signatures" },
    ],
    fields: [
      { name: "disclosingParty", label: "Disclosing party", type: "text", required: true },
      { name: "receivingParty", label: "Receiving party", type: "text", required: true },
      { name: "purpose", label: "Purpose of disclosure", type: "textarea", required: true },
      { name: "effectiveDate", label: "Effective date", type: "date", required: true },
      { name: "termMonths", label: "Term (months)", type: "number", required: true },
      { name: "mutual", label: "Mutual NDA (both parties disclose)", type: "checkbox" },
      { name: "governingLaw", label: "Governing law / jurisdiction", type: "text", required: true },
      { name: "additionalTerms", label: "Additional terms", type: "textarea" },
    ],
  },
  {
    slug: "lease-agreement",
    documentType: "lease_agreement",
    name: "Lease Agreement",
    description: "A residential or commercial property lease between landlord and tenant.",
    estimatedMinutes: 5,
    icon: "home",
    sections: [
      { id: "parties", title: "Parties" },
      { id: "property", title: "Property" },
      { id: "term", title: "Lease Term" },
      { id: "rent", title: "Rent & Deposit" },
      { id: "utilities", title: "Utilities" },
      { id: "maintenance", title: "Maintenance" },
      { id: "termination", title: "Termination" },
      { id: "governing-law", title: "Governing Law" },
      { id: "signatures", title: "Signatures" },
    ],
    fields: [
      { name: "landlordName", label: "Landlord name", type: "text", required: true },
      { name: "tenantName", label: "Tenant name", type: "text", required: true },
      { name: "propertyAddress", label: "Property address", type: "textarea", required: true },
      { name: "leaseStartDate", label: "Lease start date", type: "date", required: true },
      { name: "leaseTermMonths", label: "Lease term (months)", type: "number", required: true },
      { name: "monthlyRent", label: "Monthly rent", type: "currency", required: true },
      { name: "securityDeposit", label: "Security deposit", type: "currency", required: true },
      { name: "paymentDueDay", label: "Rent due day of month", type: "number", required: true },
      { name: "utilitiesIncluded", label: "Utilities included in rent", type: "checkbox" },
      { name: "additionalTerms", label: "Additional terms", type: "textarea" },
    ],
  },
  {
    slug: "service-agreement",
    documentType: "service_agreement",
    name: "Service Agreement",
    description: "Define scope, fees, and terms between a service provider and client.",
    estimatedMinutes: 4,
    icon: "handshake",
    sections: [
      { id: "parties", title: "Parties" },
      { id: "scope", title: "Scope of Services" },
      { id: "fees", title: "Fees & Payment" },
      { id: "term", title: "Term" },
      { id: "termination", title: "Termination" },
      { id: "liability", title: "Liability" },
      { id: "governing-law", title: "Governing Law" },
      { id: "signatures", title: "Signatures" },
    ],
    fields: [
      { name: "providerName", label: "Service provider name", type: "text", required: true },
      { name: "clientName", label: "Client name", type: "text", required: true },
      { name: "servicesDescription", label: "Description of services", type: "textarea", required: true },
      { name: "startDate", label: "Start date", type: "date", required: true },
      { name: "fee", label: "Fee", type: "currency", required: true },
      { name: "paymentTerms", label: "Payment terms", type: "text", required: true },
      { name: "terminationNoticeDays", label: "Termination notice (days)", type: "number", required: true },
      { name: "additionalTerms", label: "Additional terms", type: "textarea" },
    ],
  },
  {
    slug: "freelance-agreement",
    documentType: "freelance_agreement",
    name: "Freelance Agreement",
    description: "A project-based contract between a client and an independent freelancer.",
    estimatedMinutes: 4,
    icon: "user-check",
    sections: [
      { id: "parties", title: "Parties" },
      { id: "project", title: "Project Scope" },
      { id: "deliverables", title: "Deliverables" },
      { id: "timeline", title: "Timeline" },
      { id: "compensation", title: "Compensation" },
      { id: "ip", title: "Intellectual Property" },
      { id: "termination", title: "Termination" },
      { id: "governing-law", title: "Governing Law" },
      { id: "signatures", title: "Signatures" },
    ],
    fields: [
      { name: "clientName", label: "Client name", type: "text", required: true },
      { name: "freelancerName", label: "Freelancer name", type: "text", required: true },
      { name: "projectDescription", label: "Project description", type: "textarea", required: true },
      { name: "deliverables", label: "Deliverables", type: "textarea", required: true },
      { name: "startDate", label: "Start date", type: "date", required: true },
      { name: "deadline", label: "Deadline", type: "date", required: true },
      { name: "compensation", label: "Compensation", type: "currency", required: true },
      { name: "paymentSchedule", label: "Payment schedule", type: "text", required: true },
      {
        name: "ipOwnership",
        label: "IP ownership",
        type: "select",
        required: true,
        options: [
          { label: "Client owns all IP", value: "client" },
          { label: "Freelancer retains IP", value: "freelancer" },
          { label: "Shared ownership", value: "shared" },
        ],
      },
      { name: "additionalTerms", label: "Additional terms", type: "textarea" },
    ],
  },
];

export function getTemplateByType(documentType: string): TemplateDefinition | undefined {
  return TEMPLATES.find((t) => t.documentType === documentType);
}

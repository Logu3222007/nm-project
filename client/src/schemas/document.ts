import { z } from "zod";
import { DOCUMENT_TYPES } from "@/lib/constants";

export const documentTypeSchema = z.enum(DOCUMENT_TYPES, {
  errorMap: () => ({ message: "Select a valid document type." }),
});

const money = z.coerce.number().positive("Amount must be greater than 0.").max(1_000_000_000);
const futureOrTodayDate = z.coerce.date().refine((d) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}, "Date cannot be earlier than today.");

export const employmentAgreementSchema = z.object({
  employerName: z.string().min(2, "Employer name is required.").max(200),
  employeeName: z.string().min(2, "Employee name is required.").max(200),
  jobTitle: z.string().min(2, "Job title is required.").max(160),
  startDate: futureOrTodayDate,
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"], {
    errorMap: () => ({ message: "Select an employment type." }),
  }),
  salary: money,
  paymentFrequency: z.enum(["monthly", "biweekly", "weekly", "annually"]),
  workingLocation: z.string().min(2, "Working location is required.").max(200),
  workingHours: z.string().min(1, "Working hours are required.").max(120),
  noticePeriodDays: z.coerce.number().int().min(0).max(365),
  probationPeriodDays: z.coerce.number().int().min(0).max(365).optional(),
  benefits: z.string().max(2000).optional().or(z.literal("")),
  additionalTerms: z.string().max(4000).optional().or(z.literal("")),
});
export type EmploymentAgreementInput = z.infer<typeof employmentAgreementSchema>;

export const ndaSchema = z.object({
  disclosingParty: z.string().min(2, "Disclosing party is required.").max(200),
  receivingParty: z.string().min(2, "Receiving party is required.").max(200),
  purpose: z.string().min(10, "Purpose must be at least 10 characters.").max(1000),
  effectiveDate: futureOrTodayDate,
  termMonths: z.coerce.number().int().min(1, "Term must be at least 1 month.").max(120),
  mutual: z.boolean().default(false),
  governingLaw: z.string().min(2, "Governing law / jurisdiction is required.").max(160),
  additionalTerms: z.string().max(4000).optional().or(z.literal("")),
});
export type NdaInput = z.infer<typeof ndaSchema>;

export const leaseAgreementSchema = z.object({
  landlordName: z.string().min(2, "Landlord name is required.").max(200),
  tenantName: z.string().min(2, "Tenant name is required.").max(200),
  propertyAddress: z.string().min(5, "Property address is required.").max(400),
  leaseStartDate: futureOrTodayDate,
  leaseTermMonths: z.coerce.number().int().min(1).max(120),
  monthlyRent: money,
  securityDeposit: money,
  paymentDueDay: z.coerce.number().int().min(1).max(31),
  utilitiesIncluded: z.boolean().default(false),
  additionalTerms: z.string().max(4000).optional().or(z.literal("")),
});
export type LeaseAgreementInput = z.infer<typeof leaseAgreementSchema>;

export const serviceAgreementSchema = z.object({
  providerName: z.string().min(2, "Service provider name is required.").max(200),
  clientName: z.string().min(2, "Client name is required.").max(200),
  servicesDescription: z.string().min(10, "Describe the services provided.").max(3000),
  startDate: futureOrTodayDate,
  fee: money,
  paymentTerms: z.string().min(2, "Payment terms are required.").max(300),
  terminationNoticeDays: z.coerce.number().int().min(0).max(365),
  additionalTerms: z.string().max(4000).optional().or(z.literal("")),
});
export type ServiceAgreementInput = z.infer<typeof serviceAgreementSchema>;

export const freelanceAgreementSchema = z.object({
  clientName: z.string().min(2, "Client name is required.").max(200),
  freelancerName: z.string().min(2, "Freelancer name is required.").max(200),
  projectDescription: z.string().min(10, "Describe the project scope.").max(3000),
  deliverables: z.string().min(5, "List the deliverables.").max(2000),
  startDate: futureOrTodayDate,
  deadline: futureOrTodayDate,
  compensation: money,
  paymentSchedule: z.string().min(2, "Payment schedule is required.").max(300),
  ipOwnership: z.enum(["client", "freelancer", "shared"]),
  additionalTerms: z.string().max(4000).optional().or(z.literal("")),
});
export type FreelanceAgreementInput = z.infer<typeof freelanceAgreementSchema>;

export const documentInputSchemaByType = {
  employment_agreement: employmentAgreementSchema,
  nda: ndaSchema,
  lease_agreement: leaseAgreementSchema,
  service_agreement: serviceAgreementSchema,
  freelance_agreement: freelanceAgreementSchema,
} as const;

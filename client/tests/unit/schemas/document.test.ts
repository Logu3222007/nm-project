import { describe, it, expect } from "vitest";
import { employmentAgreementSchema, ndaSchema } from "@/schemas/document";

describe("employmentAgreementSchema", () => {
  const base = {
    employerName: "Acme Inc",
    employeeName: "Jane Doe",
    jobTitle: "Engineer",
    startDate: new Date(Date.now() + 86400000).toISOString(),
    employmentType: "full_time",
    salary: 50000,
    paymentFrequency: "monthly",
    workingLocation: "Remote",
    workingHours: "9am-5pm",
    noticePeriodDays: 30,
  };

  it("accepts a valid payload", () => {
    expect(employmentAgreementSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a missing employer name", () => {
    const result = employmentAgreementSchema.safeParse({ ...base, employerName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive salary", () => {
    const result = employmentAgreementSchema.safeParse({ ...base, salary: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a start date in the past", () => {
    const result = employmentAgreementSchema.safeParse({
      ...base,
      startDate: new Date(Date.now() - 86400000 * 30).toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid employment type enum", () => {
    const result = employmentAgreementSchema.safeParse({ ...base, employmentType: "gig" });
    expect(result.success).toBe(false);
  });
});

describe("ndaSchema", () => {
  it("rejects a purpose that is too short", () => {
    const result = ndaSchema.safeParse({
      disclosingParty: "A",
      receivingParty: "B",
      purpose: "short",
      effectiveDate: new Date().toISOString(),
      termMonths: 12,
      mutual: false,
      governingLaw: "Delaware",
    });
    expect(result.success).toBe(false);
  });
});

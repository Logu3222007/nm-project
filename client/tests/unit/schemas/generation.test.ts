import { describe, it, expect } from "vitest";
import { generateDocumentRequestSchema, geminiResponseSchema } from "@/schemas/generation";

describe("generateDocumentRequestSchema", () => {
  it("rejects an unknown document type", () => {
    const result = generateDocumentRequestSchema.safeParse({
      documentType: "power_of_attorney",
      input: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized input object (too many fields)", () => {
    const input: Record<string, string> = {};
    for (let i = 0; i < 50; i++) input[`field${i}`] = "x";
    const result = generateDocumentRequestSchema.safeParse({ documentType: "nda", input });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed request", () => {
    const result = generateDocumentRequestSchema.safeParse({
      documentType: "nda",
      input: { disclosingParty: "Acme" },
    });
    expect(result.success).toBe(true);
  });
});

describe("geminiResponseSchema", () => {
  it("rejects a response with zero sections", () => {
    const result = geminiResponseSchema.safeParse({
      title: "t",
      document_type: "nda",
      sections: [],
      terms: [],
      warnings: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed generation result", () => {
    const result = geminiResponseSchema.safeParse({
      title: "NDA",
      document_type: "nda",
      sections: [{ id: "parties", title: "Parties", content: "..." }],
      terms: [{ label: "Term", value: "12 months" }],
      warnings: [],
    });
    expect(result.success).toBe(true);
  });
});

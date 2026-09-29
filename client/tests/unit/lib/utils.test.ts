import { describe, it, expect } from "vitest";
import { hashInput, formatDate } from "@/lib/utils";

describe("hashInput", () => {
  it("produces the same hash for identical input", async () => {
    const a = await hashInput({ x: 1, y: "two" });
    const b = await hashInput({ x: 1, y: "two" });
    expect(a).toBe(b);
  });

  it("produces a different hash for different input", async () => {
    const a = await hashInput({ x: 1 });
    const b = await hashInput({ x: 2 });
    expect(a).not.toBe(b);
  });
});

describe("formatDate", () => {
  it("formats an ISO date into a readable string", () => {
    expect(formatDate("2026-01-15T00:00:00.000Z")).toContain("2026");
  });
});

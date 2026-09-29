import { describe, it, expect } from "vitest";
import { toAppError, friendlyMessage } from "@/lib/error-handler";

describe("toAppError", () => {
  it("passes through a well-formed AppError", () => {
    const err = toAppError({ code: "RATE_LIMITED", message: "slow down" });
    expect(err.code).toBe("RATE_LIMITED");
  });

  it("maps an arbitrary thrown value to UNKNOWN rather than leaking it", () => {
    const err = toAppError(new Error("relation \"documents\" does not exist"));
    expect(err.code).toBe("UNKNOWN");
    expect(err.message).not.toContain("relation");
  });
});

describe("friendlyMessage", () => {
  it("never returns an empty string for a known code", () => {
    expect(friendlyMessage("GENERATION_FAILED").length).toBeGreaterThan(0);
  });
});

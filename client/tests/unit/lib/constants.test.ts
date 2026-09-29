import { describe, it, expect } from "vitest";
import { ALLOWED_STATUS_TRANSITIONS } from "@/lib/constants";

describe("ALLOWED_STATUS_TRANSITIONS", () => {
  it("does not allow archived documents to transition anywhere", () => {
    expect(ALLOWED_STATUS_TRANSITIONS.archived).toEqual([]);
  });

  it("only allows draft to move to generating", () => {
    expect(ALLOWED_STATUS_TRANSITIONS.draft).toEqual(["generating"]);
  });

  it("does not allow draft to jump directly to ready", () => {
    expect(ALLOWED_STATUS_TRANSITIONS.draft).not.toContain("ready");
  });
});

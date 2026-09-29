import { test, expect } from "@playwright/test";

// IDOR test skeleton per spec section 30/50. Requires two seeded accounts
// (User A, User B) and their storage states — not runnable in this
// environment (no live Supabase project / network). Fill in userB's
// document id and both storageState paths before running against a real
// deployment.

test.describe("IDOR protection", () => {
  test.skip(true, "Requires two live seeded accounts against a real Supabase project.");

  test("User A cannot GET User B's document", async ({ request }) => {
    const res = await request.get("/rest/v1/documents?id=eq.<userBDocumentId>", {
      headers: { Authorization: "Bearer <userAToken>" },
    });
    const body = await res.json();
    expect(body).toEqual([]); // RLS returns an empty set, not a 403 with details
  });

  test("User A cannot DELETE User B's document", async ({ request }) => {
    const res = await request.delete("/rest/v1/documents?id=eq.<userBDocumentId>", {
      headers: { Authorization: "Bearer <userAToken>" },
    });
    expect(res.status()).toBeLessThan(300); // request "succeeds" but affects 0 rows
    // Follow-up: assert via User B's session that the document still exists.
  });
});

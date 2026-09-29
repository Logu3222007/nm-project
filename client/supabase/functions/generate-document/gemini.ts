import { z } from "https://esm.sh/zod@3.23.8";

const geminiResponseSchema = z.object({
  title: z.string().min(1).max(200),
  document_type: z.string().min(1).max(80),
  sections: z
    .array(z.object({ id: z.string().min(1).max(80), title: z.string().min(1).max(200), content: z.string().min(1).max(20000) }))
    .min(1)
    .max(30),
  terms: z.array(z.object({ label: z.string().min(1).max(120), value: z.string().min(1).max(500) })).max(50),
  warnings: z.array(z.string().max(500)).max(20),
});

export type GeminiResult = z.infer<typeof geminiResponseSchema>;

const GEMINI_MODEL = "gemini-1.5-pro";
const TIMEOUT_MS = 45_000;

export async function callGemini(prompt: string): Promise<GeminiResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GENERATION_FAILED"); // never leak "missing API key" to the client

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let raw: string;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!res.ok) {
      if (res.status === 429) throw new Error("UPSTREAM_RATE_LIMITED");
      throw new Error("GENERATION_FAILED");
    }

    const body = await res.json();
    raw = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error("GENERATION_FAILED");
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new Error("GENERATION_TIMEOUT");
    throw e instanceof Error ? e : new Error("GENERATION_FAILED");
  } finally {
    clearTimeout(timeout);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("MALFORMED_RESPONSE");
  }

  const result = geminiResponseSchema.safeParse(parsed);
  if (!result.success) {
    // Controlled recovery attempt: if sections exist but terms/warnings are
    // missing, default them rather than failing outright.
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "sections" in parsed &&
      Array.isArray((parsed as Record<string, unknown>).sections)
    ) {
      const recovered = geminiResponseSchema.safeParse({
        title: (parsed as Record<string, unknown>).title ?? "Untitled Document",
        document_type: (parsed as Record<string, unknown>).document_type ?? "unknown",
        sections: (parsed as Record<string, unknown>).sections,
        terms: (parsed as Record<string, unknown>).terms ?? [],
        warnings: (parsed as Record<string, unknown>).warnings ?? [],
      });
      if (recovered.success) return recovered.data;
    }
    throw new Error("MALFORMED_RESPONSE");
  }

  return result.data;
}

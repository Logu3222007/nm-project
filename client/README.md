# LegalEase

AI-assisted legal document generation platform. Users pick a document type, fill in
structured fields, generate a first draft with Gemini, review and edit it, and export
it as PDF, DOCX, or TXT.

> **Legal disclaimer**: LegalEase provides AI-assisted document drafting and does not
> replace advice from a qualified legal professional. Every generated document should
> be reviewed — and ideally checked by a lawyer — before signing.

---

## ⚠️ Status of this codebase — read this first

This project was generated as a **scaffold**, in an environment with **no network
access** (no `npm install`, no live Supabase project, no Gemini key, no test runner).
That means:

- **Not run**: `npm install`, `tsc`, `eslint`, `vitest`, `playwright`, `supabase db push`,
  `supabase functions deploy` have never actually been executed against this code.
- **Not verified**: there is no guarantee it compiles or builds cleanly until you run it.
- **Structurally complete, functionally scaffolded**: every layer described in the spec
  exists in code — schema, RLS, Edge Functions, Gemini integration, templates, editor,
  exports, auth, tests — but a few interactive pieces (documented below) are UI stubs
  that need their final wiring once you're running against a real backend.

Do **not** treat this as "tested" or "production-ready." Treat it as a strong, coherent
starting point that gets you past the blank-page problem for every layer of the stack.

### What to do next
1. `npm install`
2. Create a Supabase project, copy `.env.example` → `.env`, fill in the values.
3. `supabase link` and `supabase db push` (runs the migrations in `supabase/migrations/`).
4. `supabase secrets set GEMINI_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=...`
5. `supabase functions deploy generate-document export-document delete-document update-document`
6. `npm run typecheck && npm run lint && npm test` — fix whatever surfaces (dependency
   version drift is likely since these were pinned by hand, not resolved by npm).
7. `npm run dev`, then work through the Final QA Checklist in the original spec by hand.
8. `npm run test:e2e` once a dev server + real Supabase project are both reachable.

If you want this actually built out, tested, and iterated on end-to-end, **Claude Code**
(terminal or desktop) is the right tool — it has real network access and can install,
run migrations against a live project, execute the test suites, and fix failures
iteratively the way the original spec's Phase 15–21 process describes.

---

## 1. Architecture

```
React (Vite) ── authenticated requests ──▶ Supabase
                                             ├─ Auth
                                             ├─ PostgreSQL (RLS on every table)
                                             ├─ Storage (private buckets, signed URLs)
                                             └─ Edge Functions (Deno)
                                                 ├─ generate-document ─▶ Gemini
                                                 ├─ export-document   ─▶ PDF/DOCX/TXT
                                                 ├─ update-document   (edit/restore/status)
                                                 └─ delete-document
```

The Gemini API key and the Supabase service-role key exist **only** as Edge Function
secrets. The browser only ever holds the Supabase anon key.

## 2. Tech stack

React 18 · TypeScript (strict) · Vite · Tailwind · Radix primitives (shadcn-style) ·
Lucide · React Router · React Hook Form + Zod · TanStack Query · Supabase
(Postgres/Auth/Storage/Edge Functions, Deno) · Gemini API · pdf-lib · docx ·
Vitest + Testing Library · Playwright.

## 3. Database

Tables (see `supabase/migrations/0001_initial_schema.sql`):
`profiles`, `documents`, `document_versions`, `document_templates`,
`document_generations`, `document_exports`, `user_settings`, `generation_usage`,
`audit_logs`. UUID PKs, `created_at`/`updated_at` timestamps, FKs to `auth.users`,
indexes on the hot query paths (`documents(user_id)`, `documents(user_id, updated_at)`,
`documents(user_id, document_type)`, `document_versions(document_id)`,
`document_exports(document_id)`).

`document_versions` has no update/delete RLS policy — it's append-only by construction,
not just by convention.

## 4. Row Level Security

Every user-owned table has RLS enabled (`0002_row_level_security.sql`). Ownership is
always `auth.uid() = user_id`, or for child tables, ownership of the parent row —
never a client-supplied id. Privileged writes (generations, exports, audit logs) go
through the service role inside Edge Functions, after ownership has already been
checked via the user-scoped client.

`tests/integration/rls.sql` is a manual verification script for the User A / User B
isolation tests described in the spec (read/insert/update/delete on every table). It is
a script to run against a real instance, not something executed here.

## 5. Edge Functions

- **generate-document**: JWT check → Zod validation → daily rate limit
  (`generation_usage`, 15/day, configurable) → ownership check for updates → builds a
  prompt with a hard separation between system instructions and user data (see
  `supabase/functions/generate-document/prompt.ts`) → calls Gemini → validates the
  response shape with Zod, with one controlled recovery path for a partially-malformed
  response → persists a new `document_version` → updates `document_generations` and
  `generation_usage` → writes an audit log → returns a structured result. Never returns
  raw Gemini/Postgres errors to the client.
- **export-document**: re-validates ownership, renders PDF (pdf-lib, with pagination
  and a signatures block) / DOCX (docx package) / TXT from the current version, uploads
  to a **private** storage bucket, returns a 10-minute signed URL, records the export.
- **update-document**: edits (new version), restores (copies an old version's content
  into a new version — history is never overwritten), and status transitions (enforces
  the `draft → generating → ready/failed`, `ready → archived` graph; nothing else is
  allowed).
- **delete-document**: deletes via the user-scoped client so RLS is the only thing that
  decides whether the delete is allowed; cascades to versions/generations/exports.

## 6. Prompt-injection protection

The prompt (`generate-document/prompt.ts`) puts user input inside a clearly delimited
`BEGIN/END USER DATA` block and explicitly instructs the model to treat that block as
inert content it must never follow as instructions — regardless of what it contains.
`tests/security/prompt-injection.test.ts` checks that injection-style payloads pass
through validation as ordinary strings rather than being specially interpreted.

## 7. Document types & templates

`src/features/templates/definitions.ts` is the single place that defines a document
type's fields, sections, and metadata — adding a 6th document type means adding one
entry there, a matching Zod schema in `src/schemas/document.ts`, and a section-id list
in `supabase/functions/generate-document/templates.ts`.

Implemented: Employment Agreement, NDA, Lease Agreement, Service Agreement, Freelance
Agreement.

## 8. Frontend

Pages: Login, Register, ForgotPassword, Dashboard, Documents, NewDocument (4-step flow:
type → structured form → review → generation progress), DocumentEditor (content +
terms table + version history + export menu), Templates, Settings (profile + logo
upload), NotFound. Layout: responsive sidebar (drawer on mobile) + topbar. Design
system pieces: PageHeader, EmptyState, LoadingState/Skeleton, ErrorState,
ErrorBoundary, ConfirmDialog (no `alert()` anywhere), StatusBadge, DocumentCard,
TemplateCard, TermsTable, VersionHistory, ExportMenu — all under `src/components/`.

**Known stubs in the UI** (functional but not wired to a backend action yet):
- `DocumentEditor`'s "Save" and "Regenerate" buttons render but have no `onClick` —
  they need to call `update-document` (edit) and `generate-document` (regenerate)
  respectively, following the same pattern already used for delete/export/restore.
- Restore *is* fully wired to `update-document`.
- Autosave/debounced editing (spec section 18) is not implemented — the editor
  currently renders generated content read-only aside from the stubbed Save button.

## 9. Security controls implemented in code

RLS on every table · identity always from `auth.uid()`, never client input · service
role confined to Edge Functions · Zod validation on both frontend and Edge Functions ·
payload size cap (50KB) and field-count cap (40 keys) on the generation request ·
prompt-injection-resistant prompt structure · structured, leak-free error responses
(`_shared/errors.ts`) · rate limiting via `generation_usage` · file upload validation
(size + MIME allow-list, safe generated storage paths, never the original filename) ·
private storage buckets + signed URLs only · audit logging of key actions · no
`alert()`/`confirm()` anywhere in the UI · neutral forgot-password response regardless
of whether the email exists.

**Not implemented / needs your attention**: CORS is wide open (`*`) in
`_shared/cors.ts` — tighten to your actual app origin before shipping. SVG logo upload
is intentionally *not* in the allowed MIME list (PNG/JPEG/WEBP only) specifically
because unsanitized SVG is an XSS vector; add SVG only if you also add a sanitizer.

## 10. Tests

`tests/unit/` — Zod schema validation (valid/invalid payloads for employment agreement,
NDA, generation request/response), status-transition rules, error-handler leak
prevention, `hashInput`/`formatDate` utilities. These are real, runnable tests once
`npm install` has happened — **they have not been run in this environment.**

`tests/security/` — a Vitest check that prompt-injection-style strings validate as
ordinary text, plus a Playwright IDOR spec skeleton (`test.skip`) that documents exactly
what to fill in (two seeded accounts, their storage states) to run for real.

`tests/e2e/` — Playwright specs for auth flows and 404 that don't need a backend, plus
a skipped document-creation spec that needs a live Supabase project and an authenticated
`storageState` to run.

`tests/integration/rls.sql` — manual/CI script for the User A / User B RLS isolation
matrix described in the spec.

**None of these have been executed.** Running them and fixing whatever breaks is the
next step, not a finished step.

## 11. Environment variables

```
# Frontend (.env — safe to expose, anon key only)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Edge Function secrets (supabase secrets set — never in frontend code)
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## 12. Local development

```bash
npm install
cp .env.example .env   # fill in Supabase project values
supabase start          # or `supabase link` to a hosted project
supabase db push
npm run dev
```

## 13. Scripts

```
npm run dev        # Vite dev server
npm run build       # tsc -b && vite build
npm run preview
npm run lint
npm run typecheck
npm test            # vitest run
npm run test:e2e    # playwright test
npm run format
```

## 14. Known limitations

- No autosave/debounced saving in the editor yet (manual Save action, currently stubbed).
- No optimistic-concurrency handling for two tabs editing the same document
  simultaneously (spec section 53) — last write wins.
- CORS allow-list is a placeholder (`*`).
- Duplicate-generation protection computes an input hash but doesn't yet reject a
  second identical in-flight request — it's there for future de-duplication logic, not
  wired to actually short-circuit yet.
- No admin/template-management UI — templates are seeded via migration only.
- Gemini model pinned to `gemini-1.5-pro`; verify current model naming/availability
  before deploying, since this may have changed since this project was written.

## 15. Engineering report summary

| Area | Status |
|---|---|
| Architecture | Implemented as designed |
| Database tables (8) | Written, not applied to a live DB |
| RLS policies | Written for every table, not verified against a live DB |
| Edge Functions (4) | Written, not deployed or invoked |
| Gemini integration | Written with validation + injection defenses, never called |
| Frontend pages (10) | Written; 2 buttons intentionally stubbed (documented above) |
| Document types (5) | Fully defined end to end |
| Export formats (3) | PDF/DOCX/TXT generation code written, never executed |
| Security controls | Implemented in code, not penetration-tested |
| Tests | Written (unit + e2e + security skeletons), **not executed** |
| Build | **Not run** — no network access in this environment |

If something above says "not run" or "not verified," that's a task for you (or Claude
Code, which can actually install and run things) — not a claim that it already works.

-- Row Level Security for every user-owned table.
-- Principle: identity is ALWAYS derived from auth.uid(), never from a
-- client-supplied user_id. Edge Functions using the service role bypass
-- RLS deliberately and re-check ownership in application code instead.

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_generations enable row level security;
alter table public.document_exports enable row level security;
alter table public.user_settings enable row level security;
alter table public.generation_usage enable row level security;
alter table public.audit_logs enable row level security;
alter table public.document_templates enable row level security;

-- profiles ---------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = user_id);

-- documents ----------------------------------------------------------------
create policy "documents_select_own" on public.documents
  for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents
  for delete using (auth.uid() = user_id);

-- document_versions: ownership is via the parent document ------------------
create policy "document_versions_select_own" on public.document_versions
  for select using (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
  );
create policy "document_versions_insert_own" on public.document_versions
  for insert with check (
    exists (select 1 from public.documents d where d.id = document_id and d.user_id = auth.uid())
    and created_by = auth.uid()
  );
-- Versions are append-only: no update/delete policy is defined, so both
-- operations are denied by default even for the owner.

-- document_generations -------------------------------------------------
create policy "document_generations_select_own" on public.document_generations
  for select using (auth.uid() = user_id);
-- Inserts happen only via the Edge Function using the service role, which
-- bypasses RLS; no insert policy is granted to authenticated clients.

-- document_exports -------------------------------------------------------
create policy "document_exports_select_own" on public.document_exports
  for select using (auth.uid() = user_id);
-- Inserts happen only via the export-document Edge Function (service role).

-- user_settings ------------------------------------------------------------
create policy "user_settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "user_settings_upsert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- generation_usage: read-only for the owner, written by the Edge Function --
create policy "generation_usage_select_own" on public.generation_usage
  for select using (auth.uid() = user_id);

-- audit_logs: users may read their own entries; nothing may update/delete --
create policy "audit_logs_select_own" on public.audit_logs
  for select using (auth.uid() = user_id);

-- document_templates: shared read-only reference data ----------------------
create policy "document_templates_select_all" on public.document_templates
  for select using (active = true);
-- No insert/update/delete policy for regular users — templates are managed
-- via migrations/service role only.

-- Storage buckets and policies.
-- Layout:
--   branding/{user_id}/branding/logo-*.{png,jpg,webp}
--   documents/{user_id}/documents/{document_id}/exports/{export_id}.{pdf,docx,txt}

insert into storage.buckets (id, name, public)
values ('branding', 'branding', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Users may only read/write objects under their own user_id prefix.
-- storage.objects.name for these buckets is "{user_id}/...".

create policy "branding_select_own" on storage.objects
  for select using (
    bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "branding_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "branding_update_own" on storage.objects
  for update using (
    bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "branding_delete_own" on storage.objects
  for delete using (
    bucket_id = 'branding' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Document exports are written exclusively by the export-document Edge
-- Function via the service role (which bypasses RLS). Regular users get
-- read-only access to their own files, and downloads always go through
-- short-lived signed URLs rather than public access.
create policy "documents_bucket_select_own" on storage.objects
  for select using (
    bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

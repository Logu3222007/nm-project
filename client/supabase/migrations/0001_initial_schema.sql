-- LegalEase initial schema
-- Conventions: UUID PKs, created_at/updated_at timestamps, FKs to auth.users.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- document_templates (seeded, not user-owned)
-- ---------------------------------------------------------------------------
create table public.document_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  document_type text not null,
  description text,
  schema jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.document_templates(id),
  title text not null,
  document_type text not null,
  status text not null default 'draft'
    check (status in ('draft', 'generating', 'ready', 'failed', 'archived')),
  current_version_id uuid, -- FK added after document_versions exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_documents_user_id on public.documents(user_id);
create index idx_documents_user_updated on public.documents(user_id, updated_at desc);
create index idx_documents_user_type on public.documents(user_id, document_type);
create index idx_documents_user_status on public.documents(user_id, status);

-- ---------------------------------------------------------------------------
-- document_versions
-- ---------------------------------------------------------------------------
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number int not null,
  content_json jsonb not null,
  plain_text text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index idx_document_versions_document_id on public.document_versions(document_id);

alter table public.documents
  add constraint fk_documents_current_version
  foreign key (current_version_id) references public.document_versions(id) on delete set null;

-- ---------------------------------------------------------------------------
-- document_generations
-- ---------------------------------------------------------------------------
create table public.document_generations (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  model text not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  input_hash text not null,
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_document_generations_document_id on public.document_generations(document_id);
create index idx_document_generations_user_id on public.document_generations(user_id);

-- ---------------------------------------------------------------------------
-- document_exports
-- ---------------------------------------------------------------------------
create table public.document_exports (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('pdf', 'docx', 'txt')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index idx_document_exports_document_id on public.document_exports(document_id);

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------
create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  preferred_export_format text not null default 'pdf' check (preferred_export_format in ('pdf', 'docx', 'txt')),
  branding_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- generation_usage (rate limiting)
-- ---------------------------------------------------------------------------
create table public.generation_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  count int not null default 0,
  primary key (user_id, usage_date)
);

-- ---------------------------------------------------------------------------
-- audit_logs (append-only; written by Edge Functions using the service role)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
create trigger trg_document_templates_updated_at before update on public.document_templates
  for each row execute function public.set_updated_at();
create trigger trg_user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();

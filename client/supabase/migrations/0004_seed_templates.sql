-- Seed the five initial document templates. Keep in sync with
-- src/features/templates/definitions.ts (frontend is the source of truth
-- for form fields; this row mainly anchors documents.template_id).

insert into public.document_templates (name, slug, document_type, description, schema, active) values
  ('Employment Agreement', 'employment-agreement', 'employment_agreement',
   'A standard employer-employee contract covering role, pay, and terms.', '{}'::jsonb, true),
  ('Non-Disclosure Agreement', 'nda', 'nda',
   'Protect confidential information shared between two parties.', '{}'::jsonb, true),
  ('Lease Agreement', 'lease-agreement', 'lease_agreement',
   'A residential or commercial property lease between landlord and tenant.', '{}'::jsonb, true),
  ('Service Agreement', 'service-agreement', 'service_agreement',
   'Define scope, fees, and terms between a service provider and client.', '{}'::jsonb, true),
  ('Freelance Agreement', 'freelance-agreement', 'freelance_agreement',
   'A project-based contract between a client and an independent freelancer.', '{}'::jsonb, true)
on conflict (slug) do nothing;

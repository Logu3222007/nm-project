-- Manual/CI RLS verification script (spec section 48).
-- Run with `psql` against a local `supabase start` instance using two
-- test JWTs (User A / User B), or adapt into pgTAP tests.
--
-- Usage:
--   1. Create two users via Supabase Auth (User A, User B).
--   2. Create one document as each user.
--   3. Run the block below once per user by swapping `request.jwt.claims`.

-- Simulate User A's session:
-- select set_config('request.jwt.claims', '{"sub":"<user_a_id>","role":"authenticated"}', true);

-- Expect: only User A's own document is visible.
select id, user_id from documents;

-- Expect: 0 rows affected (not an error) when targeting User B's document id.
-- update documents set title = 'hacked' where id = '<user_b_document_id>';
-- delete from documents where id = '<user_b_document_id>';

-- Repeat for document_versions, document_exports, profiles with User B's
-- session, asserting the mirror image in each case.

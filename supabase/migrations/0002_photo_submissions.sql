-- supabase/migrations/0002_photo_submissions.sql
-- Fan photo submission queue. Owner-moderated; no public reads.

create table if not exists photo_submissions (
  id                uuid primary key default gen_random_uuid(),
  idol_id           text not null,
  status            text not null default 'pending'
                      check (status in ('pending','approved','rejected')),
  storage_path      text not null,
  source_url        text not null,
  license           text not null
                      check (license in ('cc-by','cc-by-sa','cc0-pd','own')),
  credit            text,
  image_focus       real not null default 0.3,
  submitter_ip_hash text not null,
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reject_reason     text
);

create index if not exists photo_submissions_status_idx on photo_submissions(status);
create index if not exists photo_submissions_idol_idx on photo_submissions(idol_id);

alter table photo_submissions enable row level security;

-- Anonymous clients may ONLY insert a pending row; they can never read or update.
-- All reads/approvals run server-side with the service-role key (RLS-exempt).
create policy "anon insert pending" on photo_submissions
  for insert to anon
  with check (status = 'pending');

-- Storage bucket: pending/ is private; approved/ is served publicly.
insert into storage.buckets (id, name, public)
  values ('submissions', 'submissions', false)
  on conflict (id) do nothing;

-- Public read only for files under approved/ (live photos).
create policy "approved photos public read" on storage.objects
  for select to public
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = 'approved');

create policy "anon upload pending" on storage.objects
  for insert to anon
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = 'pending'
  );

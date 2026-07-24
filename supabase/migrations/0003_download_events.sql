-- supabase/migrations/0003_download_events.sql
-- Durable, queryable card-export tracking (download/share counts), in
-- addition to the existing Vercel Analytics "export" custom event. Public
-- write-only intake (service-role insert from POST /api/track-export); no
-- reads are exposed to any client.

create table if not exists download_events (
  id         uuid primary key default gen_random_uuid(),
  card       text not null
               check (card in ('fourcut','report','fanid','story')),
  action     text not null
               check (action in ('download','share')),
  locale     text,
  created_at timestamptz not null default now()
);

create index if not exists download_events_card_idx on download_events(card);
create index if not exists download_events_created_at_idx on download_events(created_at);

alter table download_events enable row level security;

-- No policies are created: RLS with zero policies means even the anon key
-- can never read or write this table. All inserts go through the
-- service-role key in the /api/track-export route (RLS-exempt), matching
-- the least-privilege posture used elsewhere in this schema.

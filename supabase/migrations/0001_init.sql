-- K-pop discovery schema.

create table if not exists artists (
  id          text primary key,
  name        text not null,
  name_zh     text,
  genres      text[] not null default '{}',
  popularity  int  not null default 0,
  followers   bigint,
  image_url   text
);

create table if not exists tracks (
  id            text primary key,
  name          text not null,
  artist_id     text not null references artists(id) on delete cascade,
  album         text,
  popularity    int not null default 0,
  release_year  int,
  image_url     text,
  preview_url   text
);
create index if not exists tracks_artist_idx on tracks(artist_id);

create table if not exists artist_similarity (
  artist_id         text not null references artists(id) on delete cascade,
  similar_artist_id text not null references artists(id) on delete cascade,
  score             real not null,
  reasons           text[] not null default '{}',
  primary key (artist_id, similar_artist_id)
);

create table if not exists track_similarity (
  track_id         text not null references tracks(id) on delete cascade,
  similar_track_id text not null references tracks(id) on delete cascade,
  score            real not null,
  reasons          text[] not null default '{}',
  primary key (track_id, similar_track_id)
);

create table if not exists favorites (
  user_id      uuid not null references auth.users(id) on delete cascade,
  entity_type  text not null check (entity_type in ('artist','track')),
  entity_id    text not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

-- Catalog is public-readable; favorites are per-user.
alter table artists enable row level security;
alter table tracks enable row level security;
alter table artist_similarity enable row level security;
alter table track_similarity enable row level security;
alter table favorites enable row level security;

create policy "catalog public read" on artists for select using (true);
create policy "catalog public read tracks" on tracks for select using (true);
create policy "catalog public read asim" on artist_similarity for select using (true);
create policy "catalog public read tsim" on track_similarity for select using (true);

create policy "own favorites select" on favorites for select using (auth.uid() = user_id);
create policy "own favorites insert" on favorites for insert with check (auth.uid() = user_id);
create policy "own favorites delete" on favorites for delete using (auth.uid() = user_id);

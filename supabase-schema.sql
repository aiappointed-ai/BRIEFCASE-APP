-- ============================================
-- BriefCase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

create table if not exists coaches (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  photo text,
  school text,
  division text,
  conference text,
  record text,
  position text,
  signed_players text,
  bio text,
  notes text,
  event_ids jsonb default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  date text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

create table if not exists players (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  jersey_number text,
  jersey_color text default '#cc0000',
  position text,
  division text,
  rating text,
  notes text,
  event_id uuid references events(id) on delete set null,
  scouted_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

create table if not exists coach_notes (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references players(id) on delete cascade,
  coach_user_id uuid references auth.users(id),
  coach_name text,
  rating text,
  notes text,
  interested boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(player_id, coach_user_id)
);

-- RLS
alter table coaches enable row level security;
alter table events enable row level security;
alter table players enable row level security;
alter table coach_notes enable row level security;

create policy "coaches_select" on coaches for select to authenticated using (true);
create policy "coaches_insert" on coaches for insert to authenticated with check (true);
create policy "coaches_update" on coaches for update to authenticated using (true);
create policy "coaches_delete" on coaches for delete to authenticated using (true);

create policy "events_select" on events for select to authenticated using (true);
create policy "events_insert" on events for insert to authenticated with check (true);
create policy "events_update" on events for update to authenticated using (true);
create policy "events_delete" on events for delete to authenticated using (true);

create policy "players_select" on players for select to authenticated using (true);
create policy "players_insert" on players for insert to authenticated with check (true);
create policy "players_update" on players for update to authenticated using (true);
create policy "players_delete" on players for delete to authenticated using (auth.uid() = scouted_by);

create policy "notes_select" on coach_notes for select to authenticated using (true);
create policy "notes_insert" on coach_notes for insert to authenticated with check (auth.uid() = coach_user_id);
create policy "notes_update" on coach_notes for update to authenticated using (auth.uid() = coach_user_id);
create policy "notes_delete" on coach_notes for delete to authenticated using (auth.uid() = coach_user_id);

alter publication supabase_realtime add table players;

create index if not exists idx_players_event on players(event_id);
create index if not exists idx_players_jersey on players(jersey_number, event_id);
create index if not exists idx_coach_notes_player on coach_notes(player_id, coach_user_id);

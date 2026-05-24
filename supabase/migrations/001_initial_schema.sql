begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  flag_url text,
  group_letter text not null,
  is_tbd boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint teams_group_letter_check check (group_letter ~ '^[A-L]$'),
  constraint teams_code_format_check check (code ~ '^[A-Z]{3}$'),
  constraint teams_id_group_letter_unique unique (id, group_letter)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  match_number integer not null unique,
  phase text not null,
  group_letter text,
  home_team_id uuid references public.teams (id),
  away_team_id uuid references public.teams (id),
  home_placeholder text,
  away_placeholder text,
  home_score integer,
  away_score integer,
  status text not null default 'SCHEDULED',
  venue text,
  city text,
  kickoff timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint matches_phase_check check (
    phase in (
      'GROUP_STAGE',
      'ROUND_OF_32',
      'ROUND_OF_16',
      'QUARTER_FINALS',
      'SEMI_FINALS',
      'THIRD_PLACE',
      'FINAL'
    )
  ),
  constraint matches_group_letter_check check (
    group_letter is null or group_letter ~ '^[A-L]$'
  ),
  constraint matches_group_stage_requires_group_check check (
    (phase = 'GROUP_STAGE' and group_letter is not null)
    or phase <> 'GROUP_STAGE'
  ),
  constraint matches_status_check check (
    status in ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED', 'CANCELLED')
  ),
  constraint matches_status_scores_check check (
    (
      status in ('LIVE', 'FINISHED')
      and home_score is not null
      and away_score is not null
    )
    or (
      status in ('SCHEDULED', 'POSTPONED', 'CANCELLED')
      and home_score is null
      and away_score is null
    )
  ),
  constraint matches_home_source_check check (
    num_nonnulls(home_team_id, home_placeholder) = 1
  ),
  constraint matches_away_source_check check (
    num_nonnulls(away_team_id, away_placeholder) = 1
  ),
  constraint matches_scores_pair_check check (
    (home_score is null and away_score is null)
    or (
      home_score is not null
      and away_score is not null
      and home_score >= 0
      and away_score >= 0
    )
  ),
  constraint matches_distinct_teams_check check (
    home_team_id is null
    or away_team_id is null
    or home_team_id <> away_team_id
  )
);

create index matches_phase_idx on public.matches (phase);
create index matches_group_letter_idx on public.matches (group_letter);
create index matches_kickoff_idx on public.matches (kickoff);
create index matches_status_idx on public.matches (status);

create table public.group_standings (
  id uuid primary key default gen_random_uuid(),
  group_letter text not null,
  team_id uuid not null,
  position integer not null,
  played integer not null default 0,
  won integer not null default 0,
  drawn integer not null default 0,
  lost integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  goal_difference integer not null default 0,
  points integer not null default 0,
  qualification_status text,
  is_final boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint group_standings_group_letter_check check (group_letter ~ '^[A-L]$'),
  constraint group_standings_team_group_fkey foreign key (team_id, group_letter)
    references public.teams (id, group_letter)
    on update cascade
    on delete cascade,
  constraint group_standings_position_check check (position between 1 and 4),
  constraint group_standings_played_check check (played >= 0),
  constraint group_standings_won_check check (won >= 0),
  constraint group_standings_drawn_check check (drawn >= 0),
  constraint group_standings_lost_check check (lost >= 0),
  constraint group_standings_results_sum_check check (
    played = won + drawn + lost
  ),
  constraint group_standings_goals_for_check check (goals_for >= 0),
  constraint group_standings_goals_against_check check (goals_against >= 0),
  constraint group_standings_points_check check (points >= 0),
  constraint group_standings_goal_difference_check check (
    goal_difference = goals_for - goals_against
  ),
  constraint group_standings_qualification_status_check check (
    qualification_status is null
    or qualification_status in (
      'QUALIFIED_FIRST',
      'QUALIFIED_SECOND',
      'BEST_THIRD',
      'ELIMINATED'
    )
  ),
  constraint group_standings_unique_group_team unique (group_letter, team_id)
);

create unique index group_standings_final_position_unique_idx
  on public.group_standings (group_letter, position)
  where is_final = true;

create index group_standings_group_letter_idx on public.group_standings (group_letter);
create index group_standings_team_id_idx on public.group_standings (team_id);

create table public.group_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  group_letter text not null,
  team_id uuid not null,
  predicted_position integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint group_predictions_group_letter_check check (group_letter ~ '^[A-L]$'),
  constraint group_predictions_team_group_fkey foreign key (team_id, group_letter)
    references public.teams (id, group_letter)
    on update cascade
    on delete cascade,
  constraint group_predictions_position_check check (
    predicted_position between 1 and 4
  ),
  constraint group_predictions_unique_user_team unique (user_id, group_letter, team_id),
  constraint group_predictions_unique_user_position unique (
    user_id,
    group_letter,
    predicted_position
  )
);

create index group_predictions_user_id_idx on public.group_predictions (user_id);
create index group_predictions_group_letter_idx on public.group_predictions (group_letter);

create table public.knockout_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_id uuid not null references public.matches (id) on delete cascade,
  predicted_winner_team_id uuid references public.teams (id),
  is_random boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint knockout_predictions_unique_user_match unique (user_id, match_id)
);

create index knockout_predictions_user_id_idx on public.knockout_predictions (user_id);
create index knockout_predictions_match_id_idx on public.knockout_predictions (match_id);

create table public.champion_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid not null references public.teams (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint champion_predictions_unique_user unique (user_id)
);

create index champion_predictions_team_id_idx on public.champion_predictions (team_id);

create table public.points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_type text not null,
  source_id text not null,
  points_awarded integer not null,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint points_source_type_check check (
    source_type in ('GROUP_POSITION', 'KNOCKOUT_WINNER', 'CHAMPION')
  ),
  constraint points_points_awarded_check check (points_awarded >= 0),
  constraint points_unique_source unique (user_id, source_type, source_id)
);

create index points_user_id_idx on public.points (user_id);
create index points_source_type_idx on public.points (source_type);

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.game_locks (
  id uuid primary key default gen_random_uuid(),
  phase text not null unique,
  locked boolean not null default false,
  lock_at timestamptz,
  locked_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint game_locks_phase_check check (
    phase in (
      'GROUP_STAGE',
      'ROUND_OF_32',
      'ROUND_OF_16',
      'QUARTER_FINALS',
      'SEMI_FINALS',
      'THIRD_PLACE',
      'FINAL',
      'CHAMPION'
    )
  ),
  constraint game_locks_locked_by_check check (
    locked_by is null or locked_by in ('AUTOMATIC', 'MANUAL')
  )
);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  status text not null,
  teams_synced integer not null default 0,
  matches_synced integer not null default 0,
  standings_synced integer not null default 0,
  points_recalculated boolean not null default false,
  error_message text,
  summary jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  constraint sync_runs_status_check check (status in ('SUCCESS', 'PARTIAL', 'FAILED')),
  constraint sync_runs_teams_synced_check check (teams_synced >= 0),
  constraint sync_runs_matches_synced_check check (matches_synced >= 0),
  constraint sync_runs_standings_synced_check check (standings_synced >= 0)
);

create index sync_runs_provider_idx on public.sync_runs (provider);
create index sync_runs_started_at_idx on public.sync_runs (started_at desc);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_matches_updated_at
before update on public.matches
for each row
execute function public.set_updated_at();

create trigger set_group_standings_updated_at
before update on public.group_standings
for each row
execute function public.set_updated_at();

create trigger set_group_predictions_updated_at
before update on public.group_predictions
for each row
execute function public.set_updated_at();

create trigger set_knockout_predictions_updated_at
before update on public.knockout_predictions
for each row
execute function public.set_updated_at();

create trigger set_champion_predictions_updated_at
before update on public.champion_predictions
for each row
execute function public.set_updated_at();

create trigger set_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

create trigger set_game_locks_updated_at
before update on public.game_locks
for each row
execute function public.set_updated_at();

commit;

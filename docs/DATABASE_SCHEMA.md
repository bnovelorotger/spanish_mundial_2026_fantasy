# Database Schema

## Required tables

- profiles
- teams
- matches
- group_standings
- group_predictions
- knockout_predictions
- champion_predictions
- points
- app_settings
- game_locks
- sync_runs

## Table definitions

### profiles

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, references auth.users(id) |
| username | text | unique, not null |
| display_name | text | |
| avatar_url | text | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### teams

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| name | text | not null |
| code | text | unique, not null (ISO 3166-1 alpha-3) |
| flag_url | text | |
| group_letter | text | not null (A-L) |
| is_tbd | boolean | default false |
| created_at | timestamptz | default now() |

### matches

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| match_number | integer | unique, not null |
| phase | text | not null (GROUP_STAGE, ROUND_OF_32, ROUND_OF_16, QUARTER_FINALS, SEMI_FINALS, THIRD_PLACE, FINAL) |
| group_letter | text | nullable |
| home_team_id | uuid | FK teams(id), nullable |
| away_team_id | uuid | FK teams(id), nullable |
| home_placeholder | text | nullable (e.g. "Winner Group A") |
| away_placeholder | text | nullable |
| home_score | integer | nullable |
| away_score | integer | nullable |
| status | text | not null, default 'SCHEDULED' |
| venue | text | |
| city | text | |
| kickoff | timestamptz | not null |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### group_standings

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| group_letter | text | not null |
| team_id | uuid | FK teams(id), not null |
| position | integer | not null (1-4) |
| played | integer | default 0 |
| won | integer | default 0 |
| drawn | integer | default 0 |
| lost | integer | default 0 |
| goals_for | integer | default 0 |
| goals_against | integer | default 0 |
| goal_difference | integer | default 0 |
| points | integer | default 0 |
| qualification_status | text | nullable (QUALIFIED_FIRST, QUALIFIED_SECOND, BEST_THIRD, ELIMINATED) |
| is_final | boolean | default false |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique constraint: (group_letter, team_id)
Unique constraint: (group_letter, position) when is_final = true

### group_predictions

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK profiles(id), not null |
| group_letter | text | not null |
| team_id | uuid | FK teams(id), not null |
| predicted_position | integer | not null (1-4) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique constraint: (user_id, group_letter, team_id)
Unique constraint: (user_id, group_letter, predicted_position)

### knockout_predictions

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK profiles(id), not null |
| match_id | uuid | FK matches(id), not null |
| predicted_winner_team_id | uuid | FK teams(id), nullable |
| is_random | boolean | default false |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique constraint: (user_id, match_id)

### champion_predictions

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK profiles(id), not null |
| team_id | uuid | FK teams(id), not null |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique constraint: (user_id)

### points

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK profiles(id), not null |
| source_type | text | not null (GROUP_POSITION, KNOCKOUT_WINNER, CHAMPION) |
| source_id | text | not null |
| points_awarded | integer | not null |
| reason | text | |
| metadata | jsonb | nullable |
| created_at | timestamptz | default now() |

Unique constraint: (user_id, source_type, source_id)

### app_settings

| Column | Type | Constraints |
|---|---|---|
| key | text | PK |
| value | jsonb | not null |
| updated_at | timestamptz | default now() |

### game_locks

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| phase | text | not null |
| locked | boolean | default false |
| lock_at | timestamptz | nullable |
| locked_by | text | nullable (AUTOMATIC, MANUAL) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

Unique constraint: (phase)

### sync_runs

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| provider | text | not null |
| status | text | not null (SUCCESS, PARTIAL, FAILED) |
| teams_synced | integer | default 0 |
| matches_synced | integer | default 0 |
| standings_synced | integer | default 0 |
| points_recalculated | boolean | default false |
| error_message | text | nullable |
| summary | jsonb | nullable |
| started_at | timestamptz | default now() |
| finished_at | timestamptz | nullable |

## Important design decisions

### group_standings

Group scoring must not be calculated directly from raw matches in MVP 1. The app must store normalized group standings.

### points

Points must be idempotent.

The combination:

- user_id
- source_type
- source_id

must be unique.

### sync_runs

Every sync execution must be logged for debugging.

## Security

- RLS must be enabled where appropriate.
- Authenticated users can read public game data.
- Users can only write their own predictions.
- Server/service role writes matches, standings and points.
- Never expose SUPABASE_SERVICE_ROLE_KEY to the client.

## Indexes

- matches: (phase), (group_letter), (kickoff)
- group_standings: (group_letter), (team_id)
- group_predictions: (user_id), (group_letter)
- points: (user_id), (source_type)
- game_locks: (phase)
- profiles: (username)

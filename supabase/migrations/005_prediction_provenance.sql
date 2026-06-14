begin;

alter table public.group_predictions
  add column if not exists provenance text not null default 'USER_SUBMITTED',
  add column if not exists provenance_note text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references public.profiles (id) on delete set null;

alter table public.knockout_predictions
  add column if not exists provenance text not null default 'USER_SUBMITTED',
  add column if not exists provenance_note text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references public.profiles (id) on delete set null;

alter table public.champion_predictions
  add column if not exists provenance text not null default 'USER_SUBMITTED',
  add column if not exists provenance_note text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references public.profiles (id) on delete set null;

alter table public.group_predictions
  drop constraint if exists group_predictions_provenance_check,
  add constraint group_predictions_provenance_check check (
    provenance in (
      'USER_SUBMITTED',
      'INFERRED_100',
      'MANUAL_REVIEWED',
      'BASELINE',
      'IMPORTED_BACKUP'
    )
  );

alter table public.knockout_predictions
  drop constraint if exists knockout_predictions_provenance_check,
  add constraint knockout_predictions_provenance_check check (
    provenance in (
      'USER_SUBMITTED',
      'INFERRED_100',
      'MANUAL_REVIEWED',
      'BASELINE',
      'IMPORTED_BACKUP'
    )
  );

alter table public.champion_predictions
  drop constraint if exists champion_predictions_provenance_check,
  add constraint champion_predictions_provenance_check check (
    provenance in (
      'USER_SUBMITTED',
      'INFERRED_100',
      'MANUAL_REVIEWED',
      'BASELINE',
      'IMPORTED_BACKUP'
    )
  );

update public.group_predictions
set
  provenance = 'MANUAL_REVIEWED',
  provenance_note = coalesce(
    provenance_note,
    'Recovered during 2026-06-14 incident; pending final audit'
  )
where provenance = 'USER_SUBMITTED';

update public.group_predictions gp
set
  provenance = 'BASELINE',
  provenance_note = 'Recovered during 2026-06-14 incident using team-name alphabetical baseline'
from public.profiles p
where gp.user_id = p.id
  and p.username = 'maytte';

update public.knockout_predictions
set
  provenance = 'MANUAL_REVIEWED',
  provenance_note = coalesce(
    provenance_note,
    'Recovered during 2026-06-14 incident; pending final audit'
  )
where provenance = 'USER_SUBMITTED';

update public.champion_predictions
set
  provenance = 'MANUAL_REVIEWED',
  provenance_note = coalesce(
    provenance_note,
    'Recovered during 2026-06-14 incident; pending final audit'
  )
where provenance = 'USER_SUBMITTED';

create index if not exists group_predictions_provenance_idx
  on public.group_predictions (provenance);

create index if not exists group_predictions_user_provenance_idx
  on public.group_predictions (user_id, provenance);

create index if not exists group_predictions_user_group_provenance_idx
  on public.group_predictions (user_id, group_letter, provenance);

create index if not exists knockout_predictions_provenance_idx
  on public.knockout_predictions (provenance);

create index if not exists knockout_predictions_user_provenance_idx
  on public.knockout_predictions (user_id, provenance);

create index if not exists champion_predictions_provenance_idx
  on public.champion_predictions (provenance);

create index if not exists champion_predictions_user_provenance_idx
  on public.champion_predictions (user_id, provenance);

commit;

begin;

alter table public.matches
  add column if not exists winner_side text;

alter table public.matches
  drop constraint if exists matches_winner_side_check,
  add constraint matches_winner_side_check check (
    winner_side is null or winner_side in ('HOME', 'AWAY')
  );

alter table public.knockout_predictions
  add column if not exists predicted_winner_slot text;

alter table public.knockout_predictions
  drop constraint if exists knockout_predictions_predicted_winner_slot_check,
  add constraint knockout_predictions_predicted_winner_slot_check check (
    predicted_winner_slot is null or predicted_winner_slot in ('HOME', 'AWAY')
  );

update public.matches
set winner_side = case
  when home_score is not null and away_score is not null and home_score > away_score then 'HOME'
  when home_score is not null and away_score is not null and away_score > home_score then 'AWAY'
  else winner_side
end
where phase in (
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'FINAL'
);

update public.knockout_predictions kp
set predicted_winner_slot = case
  when kp.predicted_winner_team_id = m.home_team_id then 'HOME'
  when kp.predicted_winner_team_id = m.away_team_id then 'AWAY'
  else kp.predicted_winner_slot
end
from public.matches m
where kp.match_id = m.id
  and kp.predicted_winner_slot is null;

alter table public.game_locks
  drop constraint if exists game_locks_phase_check,
  add constraint game_locks_phase_check check (
    phase in (
      'GROUP_STAGE',
      'ROUND_OF_32',
      'ROUND_OF_16',
      'KNOCKOUT_STAGE_ONE',
      'QUARTER_FINALS',
      'SEMI_FINALS',
      'KNOCKOUT_STAGE_TWO',
      'THIRD_PLACE',
      'FINAL',
      'CHAMPION'
    )
  );

delete from public.game_locks
where phase = 'CHAMPION';

create index if not exists matches_winner_side_idx
  on public.matches (winner_side);

create index if not exists knockout_predictions_predicted_winner_slot_idx
  on public.knockout_predictions (predicted_winner_slot);

commit;

insert into public.matches (
  match_number,
  phase,
  group_letter,
  home_team_id,
  away_team_id,
  home_placeholder,
  away_placeholder,
  home_score,
  away_score,
  status,
  venue,
  city,
  kickoff
)
values
  (1, 'GROUP_STAGE', 'A', (select id from public.teams where code = 'CAN'), (select id from public.teams where code = 'MEX'), null, null, 1, 1, 'FINISHED', 'BMO Field', 'Toronto', '2026-06-11T19:00:00Z'),
  (2, 'GROUP_STAGE', 'A', (select id from public.teams where code = 'USA'), (select id from public.teams where code = 'CRC'), null, null, 2, 0, 'FINISHED', 'SoFi Stadium', 'Los Angeles', '2026-06-12T02:00:00Z'),
  (3, 'GROUP_STAGE', 'A', (select id from public.teams where code = 'CAN'), (select id from public.teams where code = 'USA'), null, null, 0, 2, 'FINISHED', 'BC Place', 'Vancouver', '2026-06-16T19:00:00Z'),
  (4, 'GROUP_STAGE', 'A', (select id from public.teams where code = 'MEX'), (select id from public.teams where code = 'CRC'), null, null, 3, 1, 'FINISHED', 'Estadio Akron', 'Guadalajara', '2026-06-17T02:00:00Z'),
  (5, 'GROUP_STAGE', 'A', (select id from public.teams where code = 'CRC'), (select id from public.teams where code = 'CAN'), null, null, 0, 1, 'FINISHED', 'AT&T Stadium', 'Arlington', '2026-06-21T19:00:00Z'),
  (6, 'GROUP_STAGE', 'A', (select id from public.teams where code = 'MEX'), (select id from public.teams where code = 'USA'), null, null, 1, 0, 'FINISHED', 'Estadio Azteca', 'Mexico City', '2026-06-21T19:00:00Z'),
  (7, 'GROUP_STAGE', 'B', (select id from public.teams where code = 'ARG'), (select id from public.teams where code = 'CHL'), null, null, 2, 0, 'FINISHED', 'MetLife Stadium', 'New York', '2026-06-12T19:00:00Z'),
  (8, 'GROUP_STAGE', 'B', (select id from public.teams where code = 'PER'), (select id from public.teams where code = 'VEN'), null, null, 1, 1, 'FINISHED', 'NRG Stadium', 'Houston', '2026-06-13T02:00:00Z'),
  (9, 'GROUP_STAGE', 'B', (select id from public.teams where code = 'ARG'), (select id from public.teams where code = 'PER'), null, null, 1, 0, 'FINISHED', 'Lincoln Financial Field', 'Philadelphia', '2026-06-17T19:00:00Z'),
  (10, 'GROUP_STAGE', 'B', (select id from public.teams where code = 'CHL'), (select id from public.teams where code = 'VEN'), null, null, 2, 1, 'FINISHED', 'Hard Rock Stadium', 'Miami Gardens', '2026-06-18T02:00:00Z'),
  (11, 'GROUP_STAGE', 'B', (select id from public.teams where code = 'VEN'), (select id from public.teams where code = 'ARG'), null, null, 0, 3, 'FINISHED', 'Mercedes-Benz Stadium', 'Atlanta', '2026-06-22T19:00:00Z'),
  (12, 'GROUP_STAGE', 'B', (select id from public.teams where code = 'CHL'), (select id from public.teams where code = 'PER'), null, null, 0, 1, 'FINISHED', 'Lumen Field', 'Seattle', '2026-06-22T19:00:00Z'),
  (13, 'GROUP_STAGE', 'C', (select id from public.teams where code = 'BRA'), (select id from public.teams where code = 'COL'), null, null, 2, 1, 'FINISHED', 'Levi''s Stadium', 'Santa Clara', '2026-06-13T19:00:00Z'),
  (14, 'GROUP_STAGE', 'C', (select id from public.teams where code = 'ECU'), (select id from public.teams where code = 'PRY'), null, null, 1, 1, 'LIVE', 'Rose Bowl Stadium', 'Pasadena', '2026-06-14T02:00:00Z'),
  (15, 'GROUP_STAGE', 'C', (select id from public.teams where code = 'BRA'), (select id from public.teams where code = 'ECU'), null, null, null, null, 'SCHEDULED', 'Gillette Stadium', 'Foxborough', '2026-06-18T19:00:00Z'),
  (16, 'GROUP_STAGE', 'C', (select id from public.teams where code = 'COL'), (select id from public.teams where code = 'PRY'), null, null, null, null, 'SCHEDULED', 'GEHA Field at Arrowhead', 'Kansas City', '2026-06-19T02:00:00Z'),
  (17, 'GROUP_STAGE', 'C', (select id from public.teams where code = 'PRY'), (select id from public.teams where code = 'BRA'), null, null, null, null, 'SCHEDULED', 'Camping World Stadium', 'Orlando', '2026-06-23T19:00:00Z'),
  (18, 'GROUP_STAGE', 'C', (select id from public.teams where code = 'COL'), (select id from public.teams where code = 'ECU'), null, null, null, null, 'SCHEDULED', 'State Farm Stadium', 'Glendale', '2026-06-23T19:00:00Z'),
  (19, 'GROUP_STAGE', 'D', (select id from public.teams where code = 'FRA'), (select id from public.teams where code = 'DEU'), null, null, null, null, 'SCHEDULED', 'NRG Stadium', 'Houston', '2026-06-14T19:00:00Z'),
  (20, 'GROUP_STAGE', 'E', (select id from public.teams where code = 'ESP'), (select id from public.teams where code = 'PRT'), null, null, null, null, 'SCHEDULED', 'SoFi Stadium', 'Los Angeles', '2026-06-15T02:00:00Z'),
  (21, 'GROUP_STAGE', 'F', (select id from public.teams where code = 'BEL'), (select id from public.teams where code = 'DNK'), null, null, null, null, 'SCHEDULED', 'AT&T Stadium', 'Arlington', '2026-06-15T19:00:00Z'),
  (22, 'GROUP_STAGE', 'G', (select id from public.teams where code = 'MAR'), (select id from public.teams where code = 'SEN'), null, null, null, null, 'SCHEDULED', 'Estadio BBVA', 'Monterrey', '2026-06-16T02:00:00Z'),
  (23, 'GROUP_STAGE', 'H', (select id from public.teams where code = 'JPN'), (select id from public.teams where code = 'KOR'), null, null, null, null, 'SCHEDULED', 'Lumen Field', 'Seattle', '2026-06-16T19:00:00Z'),
  (24, 'GROUP_STAGE', 'I', (select id from public.teams where code = 'URY'), (select id from public.teams where code = 'CZE'), null, null, null, null, 'SCHEDULED', 'MetLife Stadium', 'New York', '2026-06-17T02:00:00Z'),
  (25, 'GROUP_STAGE', 'J', (select id from public.teams where code = 'ITA'), (select id from public.teams where code = 'AUT'), null, null, null, null, 'SCHEDULED', 'BC Place', 'Vancouver', '2026-06-17T19:00:00Z'),
  (26, 'GROUP_STAGE', 'K', (select id from public.teams where code = 'CIV'), (select id from public.teams where code = 'CMR'), null, null, null, null, 'SCHEDULED', 'Mercedes-Benz Stadium', 'Atlanta', '2026-06-18T02:00:00Z'),
  (27, 'GROUP_STAGE', 'L', (select id from public.teams where code = 'NZL'), (select id from public.teams where code = 'PAN'), null, null, null, null, 'SCHEDULED', 'BMO Field', 'Toronto', '2026-06-18T19:00:00Z'),
  (28, 'GROUP_STAGE', 'K', (select id from public.teams where code = 'DZA'), (select id from public.teams where code = 'TBA'), null, null, null, null, 'SCHEDULED', 'Gillette Stadium', 'Foxborough', '2026-06-22T02:00:00Z'),
  (29, 'GROUP_STAGE', 'L', (select id from public.teams where code = 'TBC'), (select id from public.teams where code = 'TBD'), null, null, null, null, 'SCHEDULED', 'BC Place', 'Vancouver', '2026-06-22T19:00:00Z'),
  (30, 'ROUND_OF_32', null, null, null, 'Winner Group A', 'Runner-up Group B', null, null, 'SCHEDULED', 'SoFi Stadium', 'Los Angeles', '2026-07-01T19:00:00Z'),
  (31, 'ROUND_OF_32', null, null, null, 'Winner Group C', 'Best Third Group B', null, null, 'SCHEDULED', 'NRG Stadium', 'Houston', '2026-07-01T23:00:00Z'),
  (32, 'ROUND_OF_16', null, null, null, 'Winner Match 30', 'Winner Match 31', null, null, 'SCHEDULED', 'MetLife Stadium', 'New York', '2026-07-05T19:00:00Z'),
  (33, 'QUARTER_FINALS', null, null, null, 'Winner Round of 16 Slot 1', 'Winner Round of 16 Slot 2', null, null, 'SCHEDULED', 'Levi''s Stadium', 'Santa Clara', '2026-07-09T19:00:00Z'),
  (34, 'SEMI_FINALS', null, null, null, 'Winner Quarter-final Slot 1', 'Winner Quarter-final Slot 2', null, null, 'SCHEDULED', 'Mercedes-Benz Stadium', 'Atlanta', '2026-07-13T19:00:00Z'),
  (35, 'THIRD_PLACE', null, null, null, 'Semi-final Loser 1', 'Semi-final Loser 2', null, null, 'SCHEDULED', 'Hard Rock Stadium', 'Miami Gardens', '2026-07-17T19:00:00Z'),
  (36, 'FINAL', null, null, null, 'Semi-final Winner 1', 'Semi-final Winner 2', null, null, 'SCHEDULED', 'MetLife Stadium', 'New York', '2026-07-19T19:00:00Z')
on conflict (match_number) do update
set
  phase = excluded.phase,
  group_letter = excluded.group_letter,
  home_team_id = excluded.home_team_id,
  away_team_id = excluded.away_team_id,
  home_placeholder = excluded.home_placeholder,
  away_placeholder = excluded.away_placeholder,
  home_score = excluded.home_score,
  away_score = excluded.away_score,
  status = excluded.status,
  venue = excluded.venue,
  city = excluded.city,
  kickoff = excluded.kickoff;

insert into public.group_standings (
  group_letter,
  team_id,
  position,
  played,
  won,
  drawn,
  lost,
  goals_for,
  goals_against,
  goal_difference,
  points,
  qualification_status,
  is_final
)
values
  ('A', (select id from public.teams where code = 'MEX'), 1, 3, 2, 1, 0, 5, 2, 3, 7, 'QUALIFIED_FIRST', true),
  ('A', (select id from public.teams where code = 'USA'), 2, 3, 2, 0, 1, 4, 2, 2, 6, 'QUALIFIED_SECOND', true),
  ('A', (select id from public.teams where code = 'CAN'), 3, 3, 1, 1, 1, 2, 2, 0, 4, 'ELIMINATED', true),
  ('A', (select id from public.teams where code = 'CRC'), 4, 3, 0, 0, 3, 1, 6, -5, 0, 'ELIMINATED', true),
  ('B', (select id from public.teams where code = 'ARG'), 1, 3, 3, 0, 0, 6, 0, 6, 9, 'QUALIFIED_FIRST', true),
  ('B', (select id from public.teams where code = 'PER'), 2, 3, 1, 1, 1, 2, 2, 0, 4, 'QUALIFIED_SECOND', true),
  ('B', (select id from public.teams where code = 'CHL'), 3, 3, 1, 0, 2, 2, 3, -1, 3, 'BEST_THIRD', true),
  ('B', (select id from public.teams where code = 'VEN'), 4, 3, 0, 1, 2, 2, 5, -3, 1, 'ELIMINATED', true),
  ('C', (select id from public.teams where code = 'BRA'), 1, 1, 1, 0, 0, 2, 1, 1, 3, null, false),
  ('C', (select id from public.teams where code = 'ECU'), 2, 1, 0, 1, 0, 1, 1, 0, 1, null, false),
  ('C', (select id from public.teams where code = 'PRY'), 3, 1, 0, 1, 0, 1, 1, 0, 1, null, false),
  ('C', (select id from public.teams where code = 'COL'), 4, 1, 0, 0, 1, 1, 2, -1, 0, null, false)
on conflict (group_letter, team_id) do update
set
  position = excluded.position,
  played = excluded.played,
  won = excluded.won,
  drawn = excluded.drawn,
  lost = excluded.lost,
  goals_for = excluded.goals_for,
  goals_against = excluded.goals_against,
  goal_difference = excluded.goal_difference,
  points = excluded.points,
  qualification_status = excluded.qualification_status,
  is_final = excluded.is_final;

insert into public.app_settings (key, value)
values
  ('tournament', '{"name":"World Cup 2026 Pick''em","default_provider":"mock"}'::jsonb),
  ('scoring', '{"group_exact":3,"group_top_two_swap":1,"best_third_bonus":2}'::jsonb)
on conflict (key) do update
set value = excluded.value;

insert into public.game_locks (phase, locked, lock_at, locked_by)
values
  ('GROUP_STAGE', false, '2026-06-11T18:00:00Z', 'AUTOMATIC'),
  ('ROUND_OF_32', false, '2026-07-01T18:00:00Z', 'AUTOMATIC'),
  ('ROUND_OF_16', false, '2026-07-05T18:00:00Z', 'AUTOMATIC'),
  ('QUARTER_FINALS', false, '2026-07-09T18:00:00Z', 'AUTOMATIC'),
  ('SEMI_FINALS', false, '2026-07-13T18:00:00Z', 'AUTOMATIC'),
  ('THIRD_PLACE', false, '2026-07-17T18:00:00Z', 'AUTOMATIC'),
  ('FINAL', false, '2026-07-19T18:00:00Z', 'AUTOMATIC'),
  ('CHAMPION', false, '2026-07-19T18:00:00Z', 'AUTOMATIC')
on conflict (phase) do update
set
  locked = excluded.locked,
  lock_at = excluded.lock_at,
  locked_by = excluded.locked_by;

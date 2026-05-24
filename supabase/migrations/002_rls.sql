begin;

grant usage on schema public to authenticated;
grant all privileges on all tables in schema public to service_role;

grant select, insert, update on public.profiles to authenticated;
grant select on public.teams to authenticated;
grant select on public.matches to authenticated;
grant select on public.group_standings to authenticated;
grant select, insert, update, delete on public.group_predictions to authenticated;
grant select, insert, update, delete on public.knockout_predictions to authenticated;
grant select, insert, update, delete on public.champion_predictions to authenticated;
grant select on public.points to authenticated;
grant select on public.app_settings to authenticated;
grant select on public.game_locks to authenticated;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.group_standings enable row level security;
alter table public.group_predictions enable row level security;
alter table public.knockout_predictions enable row level security;
alter table public.champion_predictions enable row level security;
alter table public.points enable row level security;
alter table public.app_settings enable row level security;
alter table public.game_locks enable row level security;
alter table public.sync_runs enable row level security;

create policy "profiles_read_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "teams_read_authenticated"
  on public.teams
  for select
  to authenticated
  using (true);

create policy "matches_read_authenticated"
  on public.matches
  for select
  to authenticated
  using (true);

create policy "group_standings_read_authenticated"
  on public.group_standings
  for select
  to authenticated
  using (true);

create policy "group_predictions_read_own"
  on public.group_predictions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "group_predictions_insert_own"
  on public.group_predictions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "group_predictions_update_own"
  on public.group_predictions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "group_predictions_delete_own"
  on public.group_predictions
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "knockout_predictions_read_own"
  on public.knockout_predictions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "knockout_predictions_insert_own"
  on public.knockout_predictions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "knockout_predictions_update_own"
  on public.knockout_predictions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "knockout_predictions_delete_own"
  on public.knockout_predictions
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "champion_predictions_read_own"
  on public.champion_predictions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "champion_predictions_insert_own"
  on public.champion_predictions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "champion_predictions_update_own"
  on public.champion_predictions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "champion_predictions_delete_own"
  on public.champion_predictions
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "points_read_authenticated"
  on public.points
  for select
  to authenticated
  using (true);

create policy "app_settings_read_authenticated"
  on public.app_settings
  for select
  to authenticated
  using (true);

create policy "game_locks_read_authenticated"
  on public.game_locks
  for select
  to authenticated
  using (true);

commit;

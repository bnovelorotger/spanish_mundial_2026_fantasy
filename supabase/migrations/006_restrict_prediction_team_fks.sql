begin;

alter table public.group_predictions
  drop constraint if exists group_predictions_team_group_fkey,
  add constraint group_predictions_team_group_fkey foreign key (team_id, group_letter)
    references public.teams (id, group_letter)
    on update restrict
    on delete restrict;

alter table public.knockout_predictions
  drop constraint if exists knockout_predictions_predicted_winner_team_id_fkey,
  add constraint knockout_predictions_predicted_winner_team_id_fkey
    foreign key (predicted_winner_team_id)
    references public.teams (id)
    on update restrict
    on delete set null;

alter table public.champion_predictions
  drop constraint if exists champion_predictions_team_id_fkey,
  add constraint champion_predictions_team_id_fkey
    foreign key (team_id)
    references public.teams (id)
    on update restrict
    on delete restrict;

commit;

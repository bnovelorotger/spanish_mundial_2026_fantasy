begin;

-- Profile avatars support two mutually exclusive modes:
-- 1. avatar_url -> uploaded photo stored in the public "avatars" bucket
-- 2. avatar_team_code -> team crest selected from public.teams(code)
--
-- Storage bucket required before applying 004_avatar_storage.sql:
--   bucket name: avatars
--   public: true

alter table public.profiles
  add column if not exists avatar_team_code text references public.teams (code)
    on delete set null;

alter table public.profiles
  drop constraint if exists profiles_avatar_one_kind_check;

alter table public.profiles
  add constraint profiles_avatar_one_kind_check check (
    avatar_url is null or avatar_team_code is null
  );

commit;

-- Row Level Security (RLS) do Ecoverse
-- Rode DEPOIS do schema.sql.

-- =============================================================
-- profiles: legível por qualquer autenticado, gravável só pelo dono
-- =============================================================
alter table public.profiles enable row level security;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all
  on public.profiles for select
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles for delete
  using (auth.uid() = id);

-- =============================================================
-- progress: cada usuário só lê e escreve a própria linha
-- =============================================================
alter table public.progress enable row level security;

drop policy if exists progress_select_own on public.progress;
create policy progress_select_own
  on public.progress for select
  using (auth.uid() = user_id);

drop policy if exists progress_insert_own on public.progress;
create policy progress_insert_own
  on public.progress for insert
  with check (auth.uid() = user_id);

drop policy if exists progress_update_own on public.progress;
create policy progress_update_own
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================
-- pomodoro_sessions: cada usuário só lê e escreve as próprias
-- =============================================================
alter table public.pomodoro_sessions enable row level security;

drop policy if exists pomos_select_own on public.pomodoro_sessions;
create policy pomos_select_own
  on public.pomodoro_sessions for select
  using (auth.uid() = user_id);

drop policy if exists pomos_insert_own on public.pomodoro_sessions;
create policy pomos_insert_own
  on public.pomodoro_sessions for insert
  with check (auth.uid() = user_id);

-- =============================================================
-- Leaderboard: view derivada de progress + profiles.
-- Acesso de leitura controlado pelo grant abaixo.
-- =============================================================
grant select on public.leaderboard to anon, authenticated;

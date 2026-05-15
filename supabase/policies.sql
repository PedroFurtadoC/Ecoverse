-- Row Level Security (RLS) do Ecoverse
-- Rode DEPOIS do schema.sql.
--
-- Usa (select auth.uid()) em vez de auth.uid() para evitar
-- re-execução da função em cada linha — melhora performance,
-- especialmente em queries que tocam várias linhas como o leaderboard.

-- =============================================================
-- profiles: legível por qualquer um (alimenta o leaderboard),
-- gravável só pelo dono.
-- =============================================================
alter table public.profiles enable row level security;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all
  on public.profiles for select
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles for delete
  using ((select auth.uid()) = id);

-- =============================================================
-- progress: cada usuário só lê e escreve a própria linha.
-- =============================================================
alter table public.progress enable row level security;

drop policy if exists progress_select_own on public.progress;
create policy progress_select_own
  on public.progress for select
  using ((select auth.uid()) = user_id);

drop policy if exists progress_insert_own on public.progress;
create policy progress_insert_own
  on public.progress for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists progress_update_own on public.progress;
create policy progress_update_own
  on public.progress for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =============================================================
-- pomodoro_sessions: cada usuário só lê e escreve as próprias.
-- =============================================================
alter table public.pomodoro_sessions enable row level security;

drop policy if exists pomos_select_own on public.pomodoro_sessions;
create policy pomos_select_own
  on public.pomodoro_sessions for select
  using ((select auth.uid()) = user_id);

drop policy if exists pomos_insert_own on public.pomodoro_sessions;
create policy pomos_insert_own
  on public.pomodoro_sessions for insert
  with check ((select auth.uid()) = user_id);

-- =============================================================
-- Leaderboard: view derivada de progress + profiles.
-- Acesso controlado pelo grant abaixo. A view em si usa
-- security_invoker = true (definido no schema), então respeita
-- a RLS do usuário consultante.
-- =============================================================
grant select on public.leaderboard to anon, authenticated;

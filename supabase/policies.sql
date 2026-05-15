-- Row Level Security (RLS) do Ecoverse
-- Rode DEPOIS do schema.sql.
--
-- Usa (select auth.uid()) em vez de auth.uid() para evitar
-- re-execução da função em cada linha — melhora performance,
-- especialmente em queries que tocam várias linhas como o leaderboard.

-- =============================================================
-- GRANTs basicos pras roles do Supabase. Sem isso, o Postgres
-- bloqueia qualquer SELECT/INSERT/UPDATE/DELETE com "permission
-- denied for table" antes mesmo de avaliar a RLS — porque tabelas
-- criadas via SQL direto so recebem privilegios secundarios pra
-- anon/authenticated. As policies abaixo continuam sendo o que
-- de fato restringe os dados; estes grants so abrem a porta.
-- =============================================================
grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;

grant select, insert, update, delete on public.progress to authenticated;

grant select, insert, delete on public.pomodoro_sessions to authenticated;

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
-- Leaderboard: o acesso é feito via function get_leaderboard()
-- definida no schema.sql. A function é SECURITY DEFINER e tem
-- grant explícito pra anon + authenticated, então o ranking
-- aparece pra qualquer visitante sem precisar abrir a tabela
-- progress.
-- =============================================================

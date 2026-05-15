-- Schema do Ecoverse — Supabase (Postgres)
-- Tabelas, view de leaderboard e triggers de updated_at.
-- Idempotente — pode rodar várias vezes sem quebrar nada.

-- =============================================================
-- profiles: 1 linha por usuário autenticado
-- =============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 60),
  avatar_url    text,
  school        text default 'UNAERP',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================
-- progress: estado serializado do jogo por usuário
-- =============================================================
create table if not exists public.progress (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  energy             int  not null default 3,
  coins              int  not null default 0,
  impact             numeric(10,2) not null default 0,
  completed          jsonb not null default '[]'::jsonb,
  achievements       jsonb not null default '[]'::jsonb,
  planted_trees      jsonb not null default '[]'::jsonb,
  pomodoros_completed int not null default 0,
  best_streak        int  not null default 0,
  perfect_minigames  int  not null default 0,
  -- progresso dos 17 quizzes ODS por id: { "1": { score, perfect, attempts }, ... }
  quizzes            jsonb not null default '{}'::jsonb,
  updated_at         timestamptz not null default now()
);

-- =============================================================
-- pomodoro_sessions: histórico de sessões pra leaderboard de foco
-- =============================================================
create table if not exists public.pomodoro_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  started_at  timestamptz not null default now(),
  duration_seconds int not null,
  task_name   text,
  was_break   boolean not null default false
);

create index if not exists idx_pomodoro_sessions_user_started
  on public.pomodoro_sessions (user_id, started_at desc);

-- =============================================================
-- Trigger para atualizar updated_at automaticamente
-- search_path fixo em public para evitar schema poisoning.
-- =============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_progress_updated_at on public.progress;
create trigger trg_progress_updated_at
  before update on public.progress
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Leaderboard como function SECURITY DEFINER em vez de view.
--
-- A view com security_invoker exigia que o consultante tivesse SELECT
-- em progress, mas progress tem RLS estrita. A function bypassa RLS
-- de forma controlada e retorna apenas colunas seguras pro ranking
-- público (sem email).
-- =============================================================
drop view if exists public.leaderboard;

create or replace function public.get_leaderboard(
  period text default 'total',
  max_rows int default 50
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  coins int,
  impact numeric,
  pomodoros_completed int,
  missions_count int,
  last_active timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.user_id,
    pr.display_name,
    pr.avatar_url,
    p.coins,
    p.impact,
    p.pomodoros_completed,
    jsonb_array_length(p.completed)::int as missions_count,
    p.updated_at as last_active
  from public.progress p
  join public.profiles pr on pr.id = p.user_id
  where (
    period = 'total'
    or (period = 'month' and p.updated_at >= date_trunc('month', now()))
  )
  order by p.coins desc, p.impact desc
  limit greatest(max_rows, 1)
$$;

comment on function public.get_leaderboard(text, int) is
  'Ranking público de turma. Retorna apenas colunas seguras (sem email).';

revoke execute on function public.get_leaderboard(text, int) from public;
grant execute on function public.get_leaderboard(text, int) to anon, authenticated;

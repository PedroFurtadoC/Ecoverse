-- Schema do Ecoverse — Supabase (Postgres)
-- Rode este arquivo no SQL Editor do projeto Supabase. Idempotente.

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
-- =============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
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
-- View pública do leaderboard (sem expor user_id)
-- =============================================================
create or replace view public.leaderboard as
select
  p.user_id,
  pr.display_name,
  pr.avatar_url,
  p.coins,
  p.impact,
  p.pomodoros_completed,
  p.perfect_minigames,
  jsonb_array_length(p.completed) as missions_count,
  p.updated_at as last_active
from public.progress p
join public.profiles pr on pr.id = p.user_id;

comment on view public.leaderboard is
  'Visão pública para o ranking de turma. Não expõe email.';

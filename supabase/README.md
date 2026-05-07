# Supabase do Ecoverse

Setup do banco e da autenticação. Você só precisa rodar isso uma vez por ambiente (dev e prod podem ser projetos Supabase diferentes).

## 1. Criar projeto

1. Acesse https://supabase.com → **New project**.
2. Nome: `ecoverse-unaerp` (ou similar).
3. Region: `South America (São Paulo)`.
4. Plano: **Free**.
5. Salve a senha gerada do banco (não vai precisar pra rodar o app).

## 2. Pegar URL e anon key

**Project Settings → API**:

- **Project URL** → vai pro `.env` como `VITE_SUPABASE_URL`.
- **anon / public key** → vai pro `.env` como `VITE_SUPABASE_ANON_KEY`.

## 3. Rodar o schema

**SQL Editor → New query** e cole, em ordem:

1. Conteúdo de `schema.sql` — cria tabelas, view e triggers.
2. Conteúdo de `policies.sql` — habilita RLS e define políticas.

Cada bloco é idempotente — pode rodar de novo sem problema.

## 4. Configurar autenticação

**Authentication → Providers**:

- **Email** já vem ativado. Suficiente pra magic-link e signup.
- **Google OAuth** (opcional): mais ergonômico pra apresentação. Configure se quiser.

**Authentication → URL Configuration**:

- **Site URL**: a URL pública da aplicação (ex.: `https://ecoverse.unaerp.edu.br` ou a URL Vercel).
- **Redirect URLs**: adicione `http://localhost:3000` para dev e a URL de produção.

## 5. Configurar trigger pra criar profile no signup

Cada vez que um novo usuário se cadastra, queremos uma linha em `profiles` automaticamente. **SQL Editor**:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.progress (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Isso garante que toda nova conta tenha `profiles` e `progress` populados.

## 6. Testar

No SQL Editor:

```sql
select * from public.leaderboard;
```

Deve retornar zero linhas (nenhum usuário ainda) sem erro de permissão. Se retornar erro, alguma policy não foi aplicada.

## 7. Adicionar ao .env do projeto

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Reinicie o `npm run dev` para o Vite reler as variáveis.

## Estrutura

- `profiles` — perfil público do aluno (nome, avatar, escola).
- `progress` — estado serializado do jogo por usuário.
- `pomodoro_sessions` — histórico de sessões de foco para leaderboard de horas.
- `leaderboard` (view) — projeção pública usada pelo ranking da turma.

## Em ambiente de prova

Se a apresentação na UNAERP for offline ou o WiFi falhar, o app continua jogável — Supabase é **opcional**, fica no nível de "save em nuvem". O localStorage continua sendo a fonte primária.

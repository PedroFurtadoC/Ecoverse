# Supabase do Ecoverse

Setup do banco e da autenticação. Rode uma vez por ambiente (dev e prod podem ser projetos separados).

## 1. Criar projeto

1. Acesse https://supabase.com → **New project**.
2. Nome: `ecoverse`. Region: `South America (São Paulo)`. Plano: Free.
3. Salve a senha do banco assim que aparecer — ela só aparece uma vez.

## 2. Pegar URL e anon key

**Project Settings → API**:

- **Project URL** → vai pro `.env` como `VITE_SUPABASE_URL`.
- **anon / public key** → vai pro `.env` como `VITE_SUPABASE_ANON_KEY`.

## 3. Rodar os SQLs

**SQL Editor → New query**, cole e rode em ordem:

1. `schema.sql` — cria tabelas, view e triggers.
2. `policies.sql` — habilita RLS e define as políticas.

Os dois são idempotentes — rodar de novo não quebra nada.

## 4. Configurar Auth

**Authentication → Providers**: deixe **Email** ativo (já vem). Suficiente pra magic-link e signup.

**Authentication → URL Configuration**:
- **Site URL**: `https://ecoverse-bice.vercel.app`
- **Redirect URLs**: adicione `http://localhost:3000` pra dev funcionar também.

## 5. Trigger de novo usuário

Toda nova conta precisa de uma linha em `profiles` e `progress`. Cole no **SQL Editor**:

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

## 6. Adicionar ao `.env`

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Reinicie o `npm run dev` pra o Vite reler as variáveis.

## 7. Validar

No SQL Editor:

```sql
select * from public.leaderboard;
```

Deve retornar zero linhas sem erro de permissão. Se der erro, alguma policy não foi aplicada.

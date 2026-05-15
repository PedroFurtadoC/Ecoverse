# Supabase do Ecoverse

Setup do banco e da autenticação. Rode uma vez por ambiente (dev e prod podem ser projetos separados, ou o mesmo projeto com Redirect URLs configurados para ambos).

## 1. Criar projeto

1. Acesse https://supabase.com → **New project**.
2. Nome: `ecoverse`. Region: `South America (São Paulo)` ou a mais próxima dos usuários. Plano: Free.
3. Salve a senha do banco assim que aparecer — ela só aparece uma vez.

## 2. Pegar URL e API key

**Project Settings → API Keys**, aba **Publishable and secret API keys** (não usar a aba legacy):

- **Project URL** → vai pro `.env.local` como `VITE_SUPABASE_URL`.
- **Publishable key** (`sb_publishable_...`) → vai pro `.env.local` como `VITE_SUPABASE_ANON_KEY`.

A publishable key é pública por design — a RLS (Row Level Security) garante a segurança dos dados. Nunca use a secret key no frontend.

## 3. Rodar os SQLs

**SQL Editor → New query**, cole e rode em ordem:

1. `schema.sql` — cria tabelas, view (com `security_invoker`) e triggers.
2. `policies.sql` — habilita RLS e define as políticas otimizadas com `(select auth.uid())`.

Os dois são idempotentes — rodar de novo não quebra nada.

## 4. Configurar Auth

**Authentication → Providers**: deixe **Email** ativo. Suficiente pra magic link e signup.

**Authentication → URL Configuration**:

- **Site URL**: `https://ecoverse.dev`
- **Redirect URLs** (adicione todos):
  - `https://ecoverse.dev/**`
  - `https://www.ecoverse.dev/**`
  - `https://ecoverse-bice.vercel.app/**` (fallback do deploy Vercel)
  - `http://localhost:3000/**` (dev local)

## 5. Trigger de novo usuário + hardening

Toda nova conta precisa de uma linha em `profiles` e `progress`. Cole no **SQL Editor**:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );

  insert into public.progress (user_id) values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A função só deve ser executada pelo trigger, não exposta como RPC pública.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
```

## 6. Adicionar ao `.env.local` e na Vercel

Local — crie `.env.local` na raiz do projeto (já está no `.gitignore`):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Reinicie o `npm run dev` pra o Vite reler as variáveis.

Produção — no painel Vercel do projeto, **Settings → Environment Variables**, cadastre as mesmas duas variáveis em todos os environments (Production, Preview, Development). Sensitive desmarcado — variáveis `VITE_*` são embutidas no bundle JS por design.

## 7. Validar

No SQL Editor:

```sql
select * from public.leaderboard;
```

Deve retornar zero linhas sem erro de permissão. Se der erro, alguma policy não foi aplicada.

Em **Advisors → Security** o resultado esperado é:
- Zero erros nas nossas tabelas e funções.
- Podem aparecer avisos sobre `public.rls_auto_enable()` (função do próprio setup do Supabase, não é nossa) e sobre `public.get_leaderboard()` ser SECURITY DEFINER — esse último é **intencional**: a função expõe só colunas seguras do ranking público, sem acesso direto à tabela `progress`.

## 8. Template do email de magic link

Substitua o template padrão pelo da marca Ecoverse:

1. **Authentication → Email Templates → Magic Link**.
2. **Subject heading**: `Seu acesso ao Ecoverse`.
3. **Message body**: cole o conteúdo de [`email-magic-link.html`](./email-magic-link.html).
4. Salve.

O template usa as variáveis `{{ .ConfirmationURL }}` e `{{ .Email }}` do próprio Supabase — não precisa mexer nelas.

## 9. SMTP custom (opcional, depois do domínio próprio)

O Supabase free entrega magic links via SMTP nativo limitado a 3-4 emails/hora. Pra ter `noreply@ecoverse.dev` no remetente e escala maior:

1. Crie conta no [Resend](https://resend.com) (free, 3000 emails/mês).
2. Adicione o domínio `ecoverse.dev` no Resend e copie os 3 registros DNS (SPF, DKIM, DMARC).
3. No painel da Vercel: **Domains → ecoverse.dev → DNS Records** → cole os três registros.
4. Aguarde verificação do domínio no Resend (~10 min).
5. Crie uma API key no Resend.
6. No Supabase: **Authentication → SMTP Settings** → enable custom SMTP:
   - Host: `smtp.resend.com` · Port: `587`
   - Username: `resend` · Password: a API key
   - Sender email: `noreply@ecoverse.dev`
   - Sender name: `Ecoverse`

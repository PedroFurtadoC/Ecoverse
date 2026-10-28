# Supabase do Ecoverse

Setup do banco e da autenticação. Rode uma vez por ambiente (dev e prod podem ser projetos separados, ou o mesmo projeto com Redirect URLs configurados para ambos).

## 1. Criar projeto

1. Acesse https://supabase.com → **New project**.
2. Nome: `ecoverse`. Region: `East US (North Virginia)`, `us-east-1`, que é onde está a produção e o que a política de privacidade informa. Se escolher outra região, atualize a política. Plano: Free.
3. Salve a senha do banco assim que aparecer: ela só aparece uma vez.

## 2. Pegar URL e API key

**Project Settings → API Keys**, aba **Publishable and secret API keys** (não usar a aba legacy):

- **Project URL** → vai pro `.env.local` como `VITE_SUPABASE_URL`.
- **Publishable key** (`sb_publishable_...`) → vai pro `.env.local` como `VITE_SUPABASE_ANON_KEY`.

A publishable key é pública por design. A RLS (Row Level Security) garante a segurança dos dados. Nunca use a secret key no frontend.

## 3. Rodar os SQLs

**SQL Editor → New query**, cole e rode em ordem:

1. `schema.sql`: cria as tabelas, os triggers de `updated_at`, a função do ranking (`get_leaderboard`) e a função do botão "Excluir minha conta" (`delete_own_account`).
2. `policies.sql`: habilita RLS e define as políticas otimizadas com `(select auth.uid())`.
3. O bloco do trigger de novo usuário da seção 5, que não está em arquivo `.sql`.
4. O tempo real da tabela `progress`, que leva o progresso de um aparelho para o outro sem recarregar a página:

```sql
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'progress') then
    alter publication supabase_realtime add table public.progress;
  end if;
end $$;
```

Os quatro são idempotentes: rodar de novo não quebra nada. O banco não lê o repositório: qualquer mudança futura nesses arquivos só vale depois de colada no SQL Editor.

## 4. Configurar Auth

**Authentication → Providers**: deixe **Email** ativo. Suficiente pra magic link e signup.

**Authentication → URL Configuration**:

- **Site URL**: `https://ecoverse.dev`
- **Redirect URLs**, exatamente estes três, sem `/**` no final:
  - `https://ecoverse.dev`
  - `https://ecoverse-bice.vercel.app` (endereço da Vercel; muda se o projeto for recriado)
  - `http://localhost:3000` (dev local)

O código pede o retorno para `window.location.origin`, que é o endereço puro, sem barra. Um padrão com `/**` exige a barra e não reconhece esse endereço: o login até funciona, mas volta sempre para a Site URL. O `www` fica de fora porque redireciona para `ecoverse.dev` antes de qualquer login.

**Authentication → Rate Limits**: o envio de emails está em 100 por hora. Com SMTP próprio o padrão é 30, pouco para uma turma entrando junta.

## 5. Trigger de novo usuário + hardening

Toda nova conta precisa de uma linha em `profiles` e `progress`. O `display_name` vem do metadata do signup (campo opcional no modal de login) e, se vazio, cai num default neutro tipo `Eco-explorador-A4F8`: não derivado do email, preservando a privacidade do titular.

Cole no **SQL Editor**:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  meta_name text;
  fallback_name text;
begin
  meta_name := nullif(trim(new.raw_user_meta_data->>'display_name'), '');
  fallback_name := 'Eco-explorador-' || upper(substring(replace(new.id::text, '-', ''), 1, 4));

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(meta_name, fallback_name));

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

Local: crie `.env.local` na raiz do projeto (já está no `.gitignore`):

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

Reinicie o `npm run dev` pra o Vite reler as variáveis.

Produção: no painel Vercel do projeto, **Settings → Environment Variables**, cadastre as mesmas duas variáveis em todos os environments (Production, Preview, Development). Sensitive desmarcado, porque variáveis `VITE_*` são embutidas no bundle JS por design. A produção tem ainda uma terceira variável, `CRON_SECRET`, explicada na seção 9.

## 7. Validar

No SQL Editor:

```sql
select * from public.get_leaderboard('total', 50);
```

Deve rodar sem erro (num banco novo, sem linhas). Se der "permission denied for function get_leaderboard", falta o grant de execução, que fica logo depois da função `get_leaderboard`, no `schema.sql`: rode o arquivo de novo. Se der "permission denied for table", são os grants das tabelas, no `policies.sql`.

A função de exclusão de conta só pode ser chamada por quem está logado:

```sql
select has_function_privilege('anon', 'public.delete_own_account()', 'execute') as anon_pode,
       has_function_privilege('authenticated', 'public.delete_own_account()', 'execute') as logado_pode;
```

Esperado: `false` e `true`.

Pra conferir que as tabelas têm os GRANTs corretos (anon só lê profiles, que é o que o ping de manutenção consulta; authenticated grava nas próprias linhas):

```sql
select grantee, table_name, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('profiles','progress','pomodoro_sessions')
  and grantee in ('anon','authenticated')
  and privilege_type in ('SELECT','INSERT','UPDATE','DELETE')
order by table_name, grantee, privilege_type;
```

Esperado: 12 linhas (4 SELECT/INSERT/UPDATE/DELETE em progress, 5 em profiles, 3 em pomodoro_sessions).

Em **Advisors → Security** o resultado esperado é:
- Zero erros nas nossas tabelas e funções.
- Aviso sobre `public.get_leaderboard()` ser SECURITY DEFINER. É **intencional**: a função expõe só colunas seguras do ranking público, sem acesso direto à tabela `progress`.
- Aviso sobre `public.delete_own_account()` ser SECURITY DEFINER e executável por `authenticated`. Também é **intencional**: é o botão "Excluir minha conta". Ela só apaga a conta de quem chama (o filtro é `auth.uid()`), e `anon` não pode executá-la.
- Aviso de *Leaked Password Protection* desligado. Não se aplica: o login é só por link mágico, ninguém cria senha.
- Se o projeto tiver o RLS automático ligado, aparece também `public.rls_auto_enable()`, a função do Supabase que liga RLS em toda tabela nova. Ninguém da API precisa chamá-la, então feche o acesso (o RLS automático continua funcionando):

```sql
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
```

## 8. Templates de email com a marca

O Supabase tem templates separados pro **primeiro acesso de um email** (`Confirm sign up`) e pros **acessos seguintes** (`Magic link or OTP`). Os dois precisam ser personalizados, senão o primeiro email chega genérico em inglês. Os nomes exatos mudam de tempos em tempos na interface, então procure pelo sentido e não pelo rótulo.

Para os dois, faça o mesmo passo:

1. **Authentication → Emails → Templates → Confirm sign up** (e depois **Magic link or OTP**).
2. **Subject heading**: `Seu acesso ao Ecoverse`.
3. **Message body**: cole o conteúdo de [`email-magic-link.html`](./email-magic-link.html).
4. Salve.

O HTML é o mesmo para os dois templates. O conteúdo do email não muda, só o gatilho. A única variável usada é `{{ .ConfirmationURL }}`, que o Supabase troca pelo link na hora do envio.

## 9. Manter o projeto acordado

O plano gratuito pausa projetos que passam 7 dias sem atividade **no banco**. Pausou, o site continua abrindo e o jogo funciona com o progresso salvo no navegador, mas login, sincronização e ranking param. Só um clique em **Resume project** no painel traz de volta, e isso vale até 90 dias depois da pausa; passado esse prazo, o painel só deixa baixar os dados para recriar o projeto. Nenhum ping acorda projeto pausado.

O detalhe que derrubou a primeira versão desse setup: o Supabase conta query no Postgres, não requisição HTTP qualquer. Bater em `/auth/v1/health` devolve 200 sem encostar no banco, então o ping passava verde enquanto o contador seguia correndo.

Hoje são duas camadas, as duas fazendo um `SELECT` real em `profiles`:

| Camada | Onde | Frequência | Observação |
| --- | --- | --- | --- |
| Principal | Cron da Vercel: [`api/keep-alive.js`](../api/keep-alive.js) + `crons` no `vercel.json` | diária, entre 08:00 e 08:59 UTC (no Hobby a Vercel garante só a hora) | Não depende de movimento no repositório |
| Reserva | GitHub Actions: [`keep-supabase-warm.yml`](../.github/workflows/keep-supabase-warm.yml) | diária, marcada para 08:23 UTC; o GitHub costuma atrasar algumas horas | Desliga sozinho após 60 dias sem commit |

Nada disso exige plano pago: cron diário roda no Hobby da Vercel e Actions é gratuito em repositório público. O Pro do Supabase (US$ 25/mês) resolve por outro caminho: projeto pago não pausa, ponto. Vale se o app precisar de disponibilidade garantida; pra uso acadêmico as duas camadas acima dão conta.

O workflow do GitHub lê `SUPABASE_URL` e `SUPABASE_ANON_KEY` dos segredos do repositório (**Settings → Secrets and variables → Actions**). Se o repositório for recriado em vez de transferido, cadastre os dois de novo.

Sobre o limite dos 60 dias do GitHub: é regra da plataforma pra repositório público, e não tem como desativar. Se o repositório ficar parado (o que é normal depois da entrega), o workflow aparece como *disabled_inactivity* em **Actions**: basta clicar em **Enable workflow**. Por isso a camada principal é a da Vercel.

Se o ping falhar, o workflow abre uma issue no repositório. Antes ele falhava calado, e foram seis semanas de falha até alguém notar.

### Variável CRON_SECRET

O endpoint `/api/keep-alive` fica exposto na internet como qualquer rota do site. Ele não devolve dado nenhum, só o status do ping, mas sem proteção qualquer um pode chamar em volume e consumir a cota de execuções do plano gratuito.

A variável `CRON_SECRET`, cadastrada nas variáveis de ambiente da Vercel, resolve isso. A própria Vercel passa a enviá-la no cabeçalho `Authorization` quando dispara o cron, e o código rejeita quem não mandar. Use uma cadeia aleatória de pelo menos 16 caracteres.

Em produção a variável está cadastrada. Para conferir, abra `https://ecoverse.dev/api/keep-alive` no navegador: a resposta deve ser `{"ok":false,"erro":"nao autorizado"}`, com status 401. Se vier `{"ok":true}`, a variável sumiu e o endpoint está aberto.

Se a variável não existir, o ping continua funcionando normalmente. A proteção é opcional do ponto de vista funcional, e recomendada do ponto de vista de custo.

## 10. SMTP próprio (já configurado)

O SMTP nativo do Supabase entrega poucos emails por hora, o que trava uma turma inteira tentando entrar ao mesmo tempo. Por isso o envio foi movido para o [Resend](https://resend.com) em maio de 2026, e é assim que os magic links saem hoje.

**Configuração em produção:**

| Item | Valor |
| --- | --- |
| Domínio verificado | `auth.ecoverse.dev`, subdomínio dedicado ao envio |
| Remetente | `"Ecoverse" <noreply@auth.ecoverse.dev>` |
| Região | `sa-east-1` |
| Limite do plano gratuito | 100 emails por dia e 3.000 por mês |
| Limite no Supabase | 100 envios por hora (Authentication → Rate Limits) |

O limite que pesa é o diário. Cada pedido de link gasta um email, inclusive os repetidos, então uma turma inteira entrando no mesmo dia chega perto do teto. Quando estoura, o envio falha e o site pede para tentar de novo.

Usar um subdomínio em vez do apex é escolha deliberada: isola a reputação de envio do domínio principal, então um problema de entrega no email não afeta o site, e vice-versa. Os registros de DKIM e o MX de retorno ficam sob `auth.ecoverse.dev`, não sob `ecoverse.dev`.

**Se precisar refazer em outro ambiente:**

1. Crie a conta no Resend e adicione o subdomínio de envio.
2. Copie os registros DNS que o Resend gerar e cole no provedor de DNS do domínio. Na Vercel isso fica em **Domains → DNS Records**.
3. Aguarde a verificação, que costuma levar poucos minutos.
4. Gere uma API key no Resend.
5. No Supabase, em **Authentication → SMTP Settings**, habilite o SMTP customizado com host `smtp.resend.com`, porta `587`, usuário `resend` e a API key como senha.
6. Preencha o remetente com o endereço do subdomínio verificado.

Depois de qualquer alteração no arquivo [`email-magic-link.html`](./email-magic-link.html), o conteúdo precisa ser colado de novo nos dois templates do painel, conforme a seção 8. O Supabase guarda uma cópia do HTML, não lê o arquivo do repositório.

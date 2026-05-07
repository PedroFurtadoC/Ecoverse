# Guia operacional para a professora Isadora

Professora, este documento é o passo a passo para você (ou qualquer mantenedora futura) operar o Ecoverse sem precisar entrar em detalhe técnico.

## Resumo em uma frase

O Ecoverse roda em um servidor gratuito chamado Vercel, que pega o código do GitHub automaticamente e publica no site oficial. A senhora não precisa instalar nada no computador — basta ter conta no GitHub e na Vercel.

## Primeira publicação (uma vez só)

1. **Login no Vercel** com a conta do GitHub que tem acesso ao repositório `Ecoverse`. Endereço: https://vercel.com.
2. **Importe o projeto**: clique em **Add New → Project**, escolha o repositório `Ecoverse`, e clique em **Deploy**.
3. **Aguarde 1-2 minutos**. A Vercel detecta que é um projeto Vite e configura tudo automaticamente. Ao terminar, ela mostra a URL pública (algo como `ecoverse-xyz.vercel.app`).
4. **Pronto**. A partir desse momento, qualquer commit que entrar na branch `main` no GitHub vira automaticamente uma nova versão publicada — geralmente em 60 segundos.

## Adicionar domínio personalizado (opcional)

Se a UNAERP comprar um domínio (ex.: `ecoverse.com.br`):

1. Painel da Vercel → projeto Ecoverse → **Settings → Domains**.
2. Clique em **Add**, digite o domínio.
3. A Vercel mostra os registros DNS que precisam ser configurados no provedor do domínio (Registro.br, GoDaddy, etc.). Tipicamente um registro `A` ou `CNAME`.
4. Após a propagação (até 24h, geralmente menos), o domínio passa a apontar para o site.

## Adicionar variáveis de ambiente

Se for ativar o leaderboard com Supabase ou outras integrações pagas:

1. Painel da Vercel → projeto Ecoverse → **Settings → Environment Variables**.
2. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Clique em **Save**. A próxima publicação automática usará essas variáveis. Para forçar publicação imediata, use **Deployments → Redeploy**.

## Acompanhar progresso da turma

Quando o leaderboard estiver configurado (depois de seguir o passo a passo em `supabase/README.md`):

- Painel do Supabase: https://supabase.com — login com a conta usada na criação do projeto.
- Aba **Table Editor** mostra `profiles` (alunos cadastrados) e `progress` (estado de jogo).
- Aba **SQL Editor** permite consultas ad-hoc do tipo "quantos Pomodoros a turma já fez no total?".

## Equipe colaboradora

Cada aluno foi adicionado como colaborador no GitHub. Eles abrem pull requests com novos minigames, e você (ou o Pedro) revisa e aprova. Não precisa rodar nada localmente — a Vercel gera uma "preview URL" para cada PR aberto, que você pode abrir no navegador antes de aceitar.

## Se algo der errado

- **Site fora do ar**: na Vercel, **Deployments → Redeploy** na última publicação que funcionava.
- **Erro de build**: na aba **Deployments**, clique no deploy que falhou; o log mostra a linha exata. Pedro Furtado consegue resolver.
- **Esqueceu uma senha**: tanto Vercel quanto Supabase têm "Esqueci minha senha" funcionais via email. A UNAERP é dona dos dois projetos.

## Custos

- **Vercel free tier**: gratuito até 100 GB de banda/mês. O Ecoverse não chega perto disso.
- **Supabase free tier**: gratuito até 500 MB de banco e 2 GB de transferência/mês. Suficiente para várias turmas.
- **Domínio personalizado** (se quiser): R$ 40/ano em média no Registro.br.

## Suporte

Pedro Furtado Cunha mantém o projeto até a entrega final. Após a entrega, este `docs/` e o restante da documentação cobrem 95% das operações. Se precisar de ajuda além disso, abrir uma issue no GitHub é o caminho oficial.

# Ecoverse

Plataforma educacional gamificada sobre resíduos e sustentabilidade. Você viaja por 8 biomas reais, cada um com um problema concreto de resíduos, e enfrenta minigames temáticos para protegê-los. Entre missões, o Pomodoro recompensa sessões de foco com energia para a próxima missão.

Trabalho final da disciplina de Sustentabilidade Ambiental da **UNAERP, Universidade de Ribeirão Preto**, em 2026, sob orientação da professora **Isadora**.

---

## Como rodar localmente

Pré-requisitos: Node.js 22, a mesma versão do CI e da Vercel (campo `engines` do `package.json`).

```bash
git clone https://github.com/PedroFurtadoC/Ecoverse.git
cd Ecoverse
npm install
npm run dev
```

A aplicação abre em `http://localhost:3000`. Para testar missões sem fazer Pomodoro, use `http://localhost:3000/?dev=free`: todas as missões ficam liberadas, não gastam energia e não contam como concluídas. Quizzes e Pomodoro salvam normalmente.

Para gerar o build de produção:

```bash
npm run build       # gera dist/
npm run preview     # serve dist/ localmente
```

---

## O que tem dentro

- **Globo 3D interativo** com 8 missões em locais reais (Amazônia, Bacia do Congo, Mata Atlântica, Bornéu, Madagascar, Pantanal, Grande Barreira de Coral, Cordilheira dos Andes).
- **Minigames temáticos** focados em problemas reais de resíduos por bioma (plástico no rio, resíduos eletrônicos, microplástico, pesca-fantasma, etc.).
- **Pomodoro** integrado: sessões de 25/5/15 minutos geram energia, que libera as missões, e moedas.
- **Quizzes ODS**: 17 quizzes baseados nos Objetivos de Desenvolvimento Sustentável da ONU, desbloqueados em três fases conforme você completa missões.
- **16 conquistas** que ensinam conceitos de resíduos enquanto recompensam (15 visíveis e 1 secreta).
- **Conta opcional com magic link** (sem senha). Quem cadastra sincroniza o progresso na nuvem e aparece no **ranking da turma** (abas Geral e Este mês).
- **Direitos da LGPD no menu**: consentimento no cadastro, exportação dos dados em JSON e exclusão da conta, que apaga na hora tudo o que está na nuvem.
- **Contas separadas no mesmo aparelho**: ao sair com o progresso salvo na nuvem, o navegador volta ao começo para a próxima pessoa, e o progresso de uma conta não passa para outra.
- **Teclado**: missões, quizzes e janelas funcionam com Tab, Enter e Esc. Entre os minigames, o 5 e o 6 também; os outros ainda dependem de mouse ou toque.

---

## Stack

- **Vite + JavaScript ES Modules** (sem framework, projeto leve e didático).
- **Globe.GL** (Three.js por baixo) para a visualização 3D.
- **Supabase** para Auth e leaderboard (opcional, o jogo roda sem isso usando localStorage).
- **CSS puro** com design system em variáveis (`src/css/variables.css`), mobile-first, modo escuro.
- **PWA** instalável com manifest e service worker: depois da primeira visita o site abre sem internet (login, ranking e sincronização continuam dependendo de conexão).
- **Hospedagem na Vercel** com headers de segurança (CSP, etc.) configurados em `vercel.json`.

---

## Como contribuir (equipe)

Cada colega tem uma pasta exclusiva em `src/js/modules/minigames/` e implementa os 2 minigames das missões correspondentes. Veja o `README.md` da sua pasta:

| Dev | Pasta | Missões |
|---|---|---|
| André Fernando Machado | `andre/` | 1 e 2 |
| Felipe de Sousa Pegoraro | `felipe/` | 3 e 4 |
| Pedro Borges Casaroti | `pedro_borges/` | 5 e 6 |
| Thiago Salata Siena | `thiago/` | 7 e 8 |

Setup, branches, commits, code review: [`docs/contribuindo.md`](./docs/contribuindo.md).

---

## Deploy

Hospedagem na **Vercel**. Cada push na `main` publica a produção em cerca de um minuto, e cada Pull Request ganha uma prévia. O CI roda `npm run build` nos dois casos e o CodeQL analisa o código, mas nenhum dos dois bloqueia o merge.

A `main` aceita push direto, mas recusa force push e exclusão (ruleset "main protegida"). Para fechar uma versão:

```bash
npm version X.Y.Z --no-git-tag-version
git commit -am "chore(release): X.Y.Z"
git tag -a vX.Y.Z -m "Ecoverse X.Y.Z"
git push origin main --follow-tags
```

Depois, crie a Release no GitHub a partir da tag e marque como Latest. Tags `v*` e `inpi-*` não podem ser movidas nem apagadas (ruleset "versões imutáveis"): se uma versão sair errada, publique a seguinte.

---

## Banco de dados (Supabase)

O leaderboard de turma, autenticação por magic link e a sincronização de progresso entre dispositivos usam Supabase. Sem as variáveis de ambiente configuradas, o jogo roda anônimo usando `localStorage` no navegador, e toda a parte de login fica oculta. O ranking continua no menu, vazio.

- Setup completo em [`supabase/README.md`](./supabase/README.md).
- Template do email de magic link, com a marca, em [`supabase/email-magic-link.html`](./supabase/email-magic-link.html).
- Ping diário automático pra evitar o auto-pause do plano free, em duas camadas: cron da Vercel ([`api/keep-alive.js`](./api/keep-alive.js)) como principal e o workflow [`keep-supabase-warm`](./.github/workflows/keep-supabase-warm.yml) como reserva. Detalhes em [`supabase/README.md`](./supabase/README.md).

---

## Documentação

Tudo em [`docs/`](./docs/), com um índice explicando para quem serve cada peça.

- [`docs/arquitetura.md`](./docs/arquitetura.md): fluxo de dados e decisões de design.
- [`docs/contribuindo.md`](./docs/contribuindo.md): setup, branches, commits.
- **Transferência do projeto** e **Bateria de testes**, em `.docx`, para a entrega institucional.
- [`SECURITY.md`](./SECURITY.md): como relatar uma falha de segurança.

A marca fica em [`design/marca/`](./design/marca/): arquivos em SVG, exportações e regras de uso. O nome e o logotipo não entram na licença MIT, conforme a seção de marcas do [`LICENSE`](./LICENSE).

O material do registro no INPI é processo interno e fica fora do repositório. A exceção é `registro-inpi/certificados/`, onde entram os certificados emitidos. O código registrado é o da tag `inpi-2026-09-22`.

---

## Licença e parceria

[MIT](./LICENSE). O aviso de copyright nomeia os cinco autores e a UNAERP, e acompanha qualquer redistribuição. Autoria, bibliotecas, imagens de terceiros e parceria institucional em [`NOTICE.md`](./NOTICE.md).

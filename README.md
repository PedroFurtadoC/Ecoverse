# Ecoverse

Plataforma educacional gamificada sobre resíduos e sustentabilidade. Você viaja por 8 biomas reais, cada um com um problema concreto de resíduos, e enfrenta minigames temáticos para protegê-los. Entre missões, o Pomodoro recompensa sessões de foco com energia para a próxima missão.

Trabalho final da disciplina de Sustentabilidade Ambiental da **UNAERP, Universidade de Ribeirão Preto**, em 2026, sob orientação da professora **Isadora**.

---

## Como rodar localmente

Pré-requisitos: Node.js 20 ou superior.

```bash
git clone https://github.com/PedroFurtadoC/Ecoverse.git
cd Ecoverse
npm install
npm run dev
```

A aplicação abre em `http://localhost:3000`. Para testar missões sem fazer Pomodoro, use `http://localhost:3000/?dev=free` (energia liberada).

Para gerar o build de produção:

```bash
npm run build       # gera dist/
npm run preview     # serve dist/ localmente
```

---

## O que tem dentro

- **Globo 3D interativo** com 8 missões em locais reais (Amazônia, Bacia do Congo, Mata Atlântica, Bornéu, Madagascar, Pantanal, Grande Barreira de Coral, Cordilheira dos Andes).
- **Minigames temáticos** focados em problemas reais de resíduos por bioma (plástico no rio, e-waste, microplástico, pesca-fantasma, etc.).
- **Pomodoro** integrado: sessões de 25/5/15 minutos geram energia e moedas para iniciar missões.
- **Quizzes ODS**: 17 quizzes baseados nos Objetivos de Desenvolvimento Sustentável da ONU, desbloqueados em três fases conforme você completa missões.
- **16 conquistas** que ensinam conceitos de resíduos enquanto recompensam (15 visíveis e 1 secreta).
- **Conta opcional com magic link** (sem senha). Quem cadastra sincroniza o progresso na nuvem e aparece no **ranking de turma** (filtros Mensal/Geral).
- **Conformidade com a LGPD**: políticas claras, botão de exclusão de conta e exportação de dados em JSON direto no menu.

---

## Stack

- **Vite + JavaScript ES Modules** (sem framework, projeto leve e didático).
- **Globe.GL** (Three.js por baixo) para a visualização 3D.
- **Supabase** para Auth e leaderboard (opcional, o jogo roda sem isso usando localStorage).
- **CSS puro** com design system em variáveis (`src/css/variables.css`), mobile-first, modo escuro.
- **PWA** instalável com manifest e service worker para funcionamento offline básico.
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

Hospedagem na **Vercel**, com deploy automático a partir da branch `main`:

1. Pull Request aberto para `main`.
2. CI no GitHub Actions roda `npm run build`.
3. Após merge, a Vercel publica em ~1 minuto.

---

## Banco de dados (Supabase)

O leaderboard de turma, autenticação por magic link e a sincronização de progresso entre dispositivos usam Supabase. Sem as variáveis de ambiente configuradas, o jogo roda anônimo usando `localStorage` no navegador, e toda a parte de login fica oculta.

- Setup completo em [`supabase/README.md`](./supabase/README.md).
- Template do email de magic link branded em [`supabase/email-magic-link.html`](./supabase/email-magic-link.html).
- Ping diário automático pra evitar o auto-pause do plano free, em duas camadas: cron da Vercel ([`api/keep-alive.js`](./api/keep-alive.js)) como principal e o workflow [`keep-supabase-warm`](./.github/workflows/keep-supabase-warm.yml) como reserva. Detalhes em [`supabase/README.md`](./supabase/README.md).

---

## Documentação

Tudo em [`docs/`](./docs/), com um índice explicando para quem serve cada peça.

- [`docs/arquitetura.md`](./docs/arquitetura.md): fluxo de dados e decisões de design.
- [`docs/contribuindo.md`](./docs/contribuindo.md): setup, branches, commits.
- **Transferência do projeto** e **Bateria de testes**, em `.docx`, para a entrega institucional.

---

## Licença e parceria

[MIT](./LICENSE) com atribuição UNAERP. Créditos completos e parceria institucional em [`NOTICE.md`](./NOTICE.md).

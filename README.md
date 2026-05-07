# Ecoverse

Plataforma educacional gamificada sobre resíduos e sustentabilidade. Você viaja por 8 biomas reais, cada um com um problema concreto de resíduos, e enfrenta minigames temáticos para protegê-los. Entre missões, o Pomodoro recompensa sessões de foco com energia para a próxima missão.

Trabalho final da disciplina de Sustentabilidade Ambiental da **UNAERP — Universidade de Ribeirão Preto**, em 2026, sob orientação da professora **Isadora**.

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
- **Pomodoro** integrado — sessões de 25/5/15 minutos geram energia e moedas para iniciar missões.
- **Quizzes ODS** — 17 quizzes baseados nos Objetivos de Desenvolvimento Sustentável da ONU, desbloqueados em três fases conforme você completa missões.
- **15 conquistas** que ensinam conceitos de resíduos enquanto recompensam.
- **Leaderboard de turma** opcional via Supabase — para que a UNAERP possa acompanhar o progresso coletivo.

---

## Stack

- **Vite + JavaScript ES Modules** (sem framework — projeto leve e didático).
- **Globe.GL** (Three.js por baixo) para a visualização 3D.
- **Supabase** para Auth e leaderboard (opcional — o jogo roda sem isso usando localStorage).
- **CSS puro** com design system em variáveis (`src/css/variables.css`), mobile-first, modo escuro.
- **PWA** instalável com manifest e service worker para funcionamento offline básico.
- **Hospedagem na Vercel** com headers de segurança (CSP, etc.) configurados em `vercel.json`.

---

## Como contribuir (equipe)

Cada colega tem uma pasta exclusiva em `src/js/modules/minigames/` e implementa os 2 minigames das missões correspondentes. Veja o `README.md` da sua pasta:

| Dev | Pasta | Missões |
|---|---|---|
| André | `andre/` | 1 e 2 |
| Felipe | `felipe/` | 3 e 4 |
| Pedro Borges | `pedro_borges/` | 5 e 6 |
| Thiago | `thiago/` | 7 e 8 |

Setup, branches, commits, code review: [`docs/contribuindo.md`](./docs/contribuindo.md).

---

## Deploy

Hospedagem na **Vercel**, com deploy automático a partir da branch `main`. O fluxo é:

1. Você abre um Pull Request para `main`.
2. CI no GitHub Actions roda `npm run build` e valida.
3. PR revisado e merged em `main`.
4. Vercel publica em ~1 minuto.

Guia operacional não-técnico (primeira publicação, domínio, variáveis de ambiente): [`docs/professora-isadora.md`](./docs/professora-isadora.md).

---

## Banco de dados (Supabase)

O leaderboard de turma e a sincronização de progresso entre dispositivos são **opcionais** e usam Supabase (Postgres + Auth gerenciados). Sem configurar Supabase, o jogo continua funcionando — apenas usa `localStorage` no navegador.

Passo a passo de setup: [`supabase/README.md`](./supabase/README.md).

---

## Documentação

- [`docs/arquitetura.md`](./docs/arquitetura.md) — fluxo de dados, decisões de design.
- [`docs/contribuindo.md`](./docs/contribuindo.md) — guia para a equipe (setup, branches, commits).
- [`docs/professora-isadora.md`](./docs/professora-isadora.md) — operação não-técnica (Vercel, domínio).
- [`docs/parceria-unaerp.md`](./docs/parceria-unaerp.md) — proposta institucional para a faculdade.

---

## Licença e parceria

[MIT](./LICENSE) com atribuição UNAERP. Créditos completos e parceria institucional em [`NOTICE.md`](./NOTICE.md).

# Arquitetura

Aplicação single-page sem framework. Vite empacota em ESM. O código é dividido em três camadas:

1. **Estado global** (`src/js/store/`): `state.js` é a única fonte de verdade do progresso do jogador; `events.js` é um event bus simples para desacoplar módulos.
2. **Módulos de domínio** (`src/js/modules/`): Pomodoro, conquistas, quizzes ODS, roteador de minigames. Cada um expõe um objeto público (ex.: `Pomodoro.init()`, `MiniGames.open(...)`).
3. **Apresentação** (`src/js/main.js` + `src/css/`): orquestra DOM, anima HUD, controla o globo, encadeia ações entre módulos via event bus.

## Fluxo principal

```
[loading]  → pré-carrega assets, baixa Globe.GL em paralelo
   ↓
[startGame]  → carrega estado salvo, init Pomodoro, monta globo
   ↓
[globo]  → marcadores HTML por missão; clicar abre modal
   ↓
[modal-mission]  → "Iniciar" gasta energia, dispara minigame
   ↓
[MiniGames.open(gameType, callback)]  → instancia ModuloN do dev
   ↓
[ModuloN.start()]  → joga, chama onGameEnd({success, perfect})
   ↓
[completeMission]  → credita moedas+CO₂, salva, planta árvores, atualiza globo
   ↓
[checkAchievements]  → desbloqueia conquistas se aplicável
```

Em paralelo, o Pomodoro emite `EVENTS.REWARD` e `EVENTS.POMODORO_COMPLETE`: `main.js` escuta para atualizar HUD e plantar uma árvore aleatória.

## Convenções

- **ESM** em todo lugar, paths relativos com extensão `.js`.
- **Português** para domínio (`plantTree`, `flyToMission`); **inglês** para técnico-genérico (`init`, `update`, `open`).
- **Event bus** para acoplamento de "notificação" (módulo A avisa, módulo B reage). Imports diretos só para contratos síncronos (`MiniGames.open()` chamado direto).
- **localStorage** é a fonte primária (chave `ecoverse_save_v6`). O progresso dos quizzes ODS vive dentro desse mesmo save, e não em chave separada, pra subir junto na sincronização. Quando o Supabase está configurado, `services/sync.js` faz upsert com debounce de 2s sem alterar o localStorage.

## Build

`vite.config.js` separa `globe.gl` em chunk próprio (lazy-load via `import('globe.gl')` em `main.js`). Números da entrega atual, comprimidos:

| Arquivo | gzip | Quando carrega |
| --- | --- | --- |
| `index.html` | ~7,7 KB | sempre |
| `index.css` | ~15 KB | sempre |
| chunk do app | ~71 KB | sempre |
| chunk do Supabase | ~57 KB | só quando o usuário entra na conta |
| chunk do globo | ~519 KB | depois da tela de carregamento |

O globo carrega Three.js junto e por isso pesa. Fica fora do caminho crítico de propósito: a tela de carregamento aparece antes, e o download acontece enquanto ela está visível.

Esses valores mudam a cada alteração de conteúdo ou dependência. Se precisar do número atual, rode `npm run build` e leia a saída, que é a fonte de verdade.

Target ES2020. Cobre 95%+ dos navegadores atuais.

## Rotina de manutenção

Fora das três camadas da aplicação existe uma função serverless em `api/keep-alive.js`, publicada junto com o site. Ela não faz parte do produto: só executa uma consulta de leitura diária no banco para evitar que o plano gratuito pause o projeto por inatividade. O agendamento fica no bloco `crons` do `vercel.json`, e o detalhe de por que isso é necessário está em [`supabase/README.md`](../supabase/README.md).
